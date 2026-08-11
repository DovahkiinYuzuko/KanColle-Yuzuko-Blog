import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Command } from 'commander';
import clipboardy from 'clipboardy';
import notifier from 'node-notifier';
import { CliOptions } from './types.js';
import { loadMasterData } from './masterData.js';
import { parseDeckBuilder, validateDeckBuilder } from './parser.js';
import { buildMarkdownOutput, buildYamlOutput } from './formatter.js';

import { generateFleetImage } from './imageGenerator.js';
import { promptSaveFilePath } from './fileDialog.js';
import { loadAppConfig, initConfigFile } from './configManager.js';

function sendOsNotification(title: string, message: string): void {
  try {
    notifier.notify({
      title,
      message,
      sound: false,
      wait: false,
    });
  } catch {}
}

function getFormattedTimestamp(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

export async function runCli(argv: string[]): Promise<void> {
  const program = new Command();

  program
    .name('kcyaml')
    .description('KanColle Deck Builder JSON to Markdown YAML Converter')
    .version('1.0.0')
    .option('-f, --fleet <numbers...>', '変換対象の艦隊番号 (例: -f 1 2)')
    .option('-a, --air <numbers...>', '変換対象の基地航空隊番号 (例: -a 1 2)')
    .option('-t, --title <string>', 'YAML内の親キータイトル名')
    .option('--ft, --fleet-title <string>', '艦隊専用のタイトル名')
    .option('--at, --air-title <string>', '基地航空隊専用のタイトル名')
    .option('-i, --input <path>', '入力JSONファイルパス (未指定時はクリップボードから取得)')
    .option('-o, --output [path]', '出力ファイルパス (引数なしの場合は config.json の規定フォルダに自動保存)')
    .option('-g, --image', '編成画像(PNG)を出力する', false)
    .option('--image-theme <theme>', '編成画像の表示テーマ (official, dark, light, 74lc 等)')
    .option('--image-output <path>', '編成画像の保存先ファイルパス')
    .option('--no-dialog', 'OSのエクスプローラー保存ダイアログ表示をスキップする')
    .option('--init-config', 'デフォルトの config.json ファイルをプロジェクトルートに初期生成する', false)
    .option('--config <path>', 'カスタム config.json ファイルのパス')
    .option('--dry-run', 'クリップボード書き込みを行わずstdout出力のみ', false)
    .option('-r, --rengo', '連合艦隊フォーマットで出力する', false)
    .option('--refresh', 'マスタデータをリモートから強制再取得・更新する', false)
    .option('--validate', '入力データの整合性・未知のIDチェックを実行する', false)
    .option('--exact-mas', '入力JSONの実際の熟練度数値(mas)をそのまま使用して制空値を計算する', false);

  program.parse(argv);
  const opts = program.opts();

  if (opts.initConfig) {
    const createdPath = initConfigFile();
    console.error(`[kcyaml:SUCCESS] デフォルトの config.json を '${createdPath}' に生成しました。`);
    return;
  }

  const appConfig = loadAppConfig(opts.config);

  const parsedFleet = opts.fleet
    ? (Array.isArray(opts.fleet) ? opts.fleet : [opts.fleet]).map((n: any) => parseInt(String(n), 10)).filter((n: number) => !isNaN(n))
    : undefined;

  const parsedAir = opts.air
    ? (Array.isArray(opts.air) ? opts.air : [opts.air]).map((n: any) => parseInt(String(n), 10)).filter((n: number) => !isNaN(n))
    : undefined;

  const options: CliOptions = {
    fleet: parsedFleet,
    air: parsedAir,
    title: opts.title,
    fleetTitle: opts.fleetTitle,
    airTitle: opts.airTitle,
    input: opts.input,
    output: opts.output,
    image: opts.image,
    imageTheme: opts.imageTheme || appConfig.image.defaultTheme,
    imageOutput: opts.imageOutput,
    noDialog: opts.dialog === false ? true : !appConfig.dialog.enabled,
    dryRun: opts.dryRun,
    refresh: opts.refresh,
    validate: opts.validate,
    initConfig: opts.initConfig,
    configFile: opts.config,
    exactMas: opts.exactMas,
    rengo: opts.rengo,
  };


  if (!options.fleet && !options.air) {
    options.fleet = [1];
  }

  let inputText = '';
  if (options.input) {
    try {
      inputText = fs.readFileSync(options.input, 'utf-8');
    } catch (err: any) {
      console.error(`[kcyaml:ERROR] 入力ファイル '${options.input}' の読み込みに失敗しました: ${err.message}`);
      process.exit(1);
    }
  } else {
    try {
      inputText = await clipboardy.read();
    } catch (err: any) {
      console.error(`[kcyaml:ERROR] クリップボードからの読み取りに失敗しました: ${err.message}`);
      process.exit(1);
    }
  }

  if (!inputText || inputText.trim() === '') {
    console.error('[kcyaml:ERROR] 入力データが空です。ファイル指定 (-i) またはクリップボードにJSONをコピーしてください。');
    process.exit(1);
  }

  try {
    const rawDeckObj = JSON.parse(inputText);
    console.error('[kcyaml:LOG] 入力JSONデータを正常に解析しました。');

    const masterData = await loadMasterData(options.refresh);
    console.error('[kcyaml:LOG] マスタデータの読み込みを完了しました。');


    if (options.validate) {
      const report = validateDeckBuilder(inputText, options, masterData);
      console.log('=== Deck Builder データ検証結果 ===');
      if (report.issues.length === 0) {
        console.log('OK: データに異常や未登録IDは見つかりませんでした。');
      } else {
        for (const issue of report.issues) {
          console.log(`[${issue.type}] ${issue.message}`);
        }
      }
      console.log('====================================\n');
    }

    const parsedData = parseDeckBuilder(inputText, options, masterData);
    const markdownResult = buildMarkdownOutput(parsedData, options);

    // 1. Output YAML / Markdown file if -o is specified
    if (options.output !== undefined) {
      let targetPath = '';
      let isPureYaml = false;

      if (options.output === true || options.output === '') {
        const dirPath = path.join(process.cwd(), 'kcdata-output');
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const titleName = options.title || options.fleetTitle || 'kcyaml_output';
        const sanitizedTitle = titleName.replace(/[\\/:*?"<>|]/g, '_');
        const filename = `${sanitizedTitle}_${getFormattedTimestamp()}.yaml`;
        targetPath = path.join(dirPath, filename);
        isPureYaml = true;
      } else if (typeof options.output === 'string') {
        targetPath = options.output;
        const ext = path.extname(targetPath).toLowerCase();
        if (ext === '.yaml' || ext === '.yml') {
          isPureYaml = true;
        }
      }

      if (targetPath) {
        const outputContent = isPureYaml ? buildYamlOutput(parsedData, options) : markdownResult;
        try {
          fs.writeFileSync(targetPath, outputContent, 'utf-8');
          console.error(`[kcyaml:SUCCESS] テキストファイル '${targetPath}' に保存しました。`);
        } catch (err: any) {
          console.error(`[kcyaml:ERROR] ファイル '${targetPath}' への保存に失敗しました: ${err.message}`);
        }
      }
    }

    // 2. Output YAML to console / stdout immediately
    console.log(markdownResult);

    // 3. Copy to clipboard immediately
    if (!options.dryRun) {
      try {
        await clipboardy.write(markdownResult);
        console.error('[kcyaml:SUCCESS] 変換結果をクリップボードにコピーしました。');
        sendOsNotification('kcyaml', '変換結果をクリップボードにコピーしました！');
      } catch (err: any) {
        console.error(`[kcyaml:WARNING] クリップボードへの書き込みに失敗しました: ${err.message}`);
      }
    }

    // 4. Process image output independently if -g / --image is specified
    if (options.image) {
      console.error('\n[kcyaml:LOG] ----------------------------------------');
      console.error('[kcyaml:LOG] 編成画像の生成処理を開始します...');

      const theme = options.imageTheme || 'official';
      const targetFleets = options.fleet || [1];

      for (const fleetNum of targetFleets) {
        const fleetKey = `f${fleetNum}`;
        const fleetLabel = `第${fleetNum}艦隊`;

        if (!rawDeckObj[fleetKey]) {
          console.error(`[kcyaml:SKIP] ${fleetLabel} のデータが存在しないためスキップします。`);
          continue;
        }

        console.error(`[kcyaml:LOG] ${fleetLabel} の画像生成を開始します (テーマ: ${theme})...`);

        const singleFleetDeck = {
          version: rawDeckObj.version || 4,
          hqlv: rawDeckObj.hqlv || 120,
          f1: rawDeckObj[fleetKey],
          lang: 'jp' as any,
          theme: theme as any,
        };

        try {
          const imageBuffer = await generateFleetImage(singleFleetDeck, theme);
          console.error(`[kcyaml:LOG] ${fleetLabel} のレンダリングおよび256色軽量化が完了しました。`);

          let imageSavePath = options.imageOutput;
          const defaultTitle = options.title || options.fleetTitle || 'fleet';
          const defaultFilename = `${defaultTitle.replace(/[\\/:*?"<>|]/g, '_')}_${fleetLabel}_${getFormattedTimestamp()}.png`;

          if (targetFleets.length === 1 && imageSavePath) {
            // Keep custom output path for single fleet
          } else {
            imageSavePath = '';
          }

          // Prompt via OS dialog if imageOutput is not explicitly specified and dialog is enabled
          if (!imageSavePath && !options.noDialog) {
            console.error(`[kcyaml:LOG] ${fleetLabel} の保存先を指定するための OS 保存ダイアログを開きます...`);
            const selectedPath = await promptSaveFilePath(defaultFilename);
            if (selectedPath) {
              imageSavePath = selectedPath;
              console.error(`[kcyaml:LOG] ダイアログで保存先が選択されました: ${imageSavePath}`);
            } else {
              console.error('[kcyaml:LOG] ダイアログがキャンセルされたため、デフォルトフォルダに自動保存します。');
            }
          }

          // Fallback to default output folder
          if (!imageSavePath) {
            const dirPath = path.join(process.cwd(), 'kcdata-output');
            if (!fs.existsSync(dirPath)) {
              fs.mkdirSync(dirPath, { recursive: true });
            }
            imageSavePath = path.join(dirPath, defaultFilename);
          }

          const imgDir = path.dirname(imageSavePath);
          if (!fs.existsSync(imgDir)) {
            fs.mkdirSync(imgDir, { recursive: true });
          }

          fs.writeFileSync(imageSavePath, imageBuffer);
          const sizeKb = (imageBuffer.length / 1024).toFixed(1);
          console.error(`[kcyaml:SUCCESS] ${fleetLabel} の画像を '${imageSavePath}' に保存しました (サイズ: ${sizeKb} KB)`);
        } catch (imgErr: any) {
          console.error(`[kcyaml:ERROR] ${fleetLabel} の画像生成・保存中にエラーが発生しました: ${imgErr.message}`);
        }
      }
      console.error('[kcyaml:LOG] ----------------------------------------\n');
    }
  } catch (err: any) {
    console.error(`[kcyaml:FATAL] エラーが発生しました: ${err.message}`);
    process.exit(1);
  }
}


