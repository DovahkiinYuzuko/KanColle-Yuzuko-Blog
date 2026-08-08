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
    .option('-o, --output [path]', '出力ファイルパス (引数なしの場合は kcdata-output/ に自動保存)')
    .option('--dry-run', 'クリップボード書き込みを行わずstdout出力のみ', false)
    .option('-r, --refresh', 'マスタデータをリモートから強制再取得・更新する', false)
    .option('--validate', '入力データの整合性・未知のIDチェックを実行する', false);

  program.parse(argv);
  const opts = program.opts();

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
    dryRun: opts.dryRun,
    refresh: opts.refresh,
    validate: opts.validate,
  };

  if (!options.fleet && !options.air) {
    options.fleet = [1];
  }

  let inputText = '';
  if (options.input) {
    try {
      inputText = fs.readFileSync(options.input, 'utf-8');
    } catch (err: any) {
      console.error(`エラー: 入力ファイル '${options.input}' の読み込みに失敗しました: ${err.message}`);
      process.exit(1);
    }
  } else {
    try {
      inputText = await clipboardy.read();
    } catch (err: any) {
      console.error(`エラー: クリップボードからの読み取りに失敗しました: ${err.message}`);
      process.exit(1);
    }
  }

  if (!inputText || inputText.trim() === '') {
    console.error('エラー: 入力データが空です。ファイル指定 (-i) またはクリップボードにJSONをコピーしてください。');
    process.exit(1);
  }

  try {
    const masterData = await loadMasterData(options.refresh);

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
          console.error(`\n(ファイル '${targetPath}' に保存しました)`);
        } catch (err: any) {
          console.error(`エラー: ファイル '${targetPath}' への保存に失敗しました: ${err.message}`);
        }
      }
    }

    console.log(markdownResult);

    if (!options.dryRun) {
      try {
        await clipboardy.write(markdownResult);
        console.error('\n(変換結果をクリップボードにコピーしました)');
        sendOsNotification('kcyaml', '変換結果をクリップボードにコピーしました！');
      } catch (err: any) {
        console.error(`\n(警告: クリップボードへの書き込みに失敗しました: ${err.message})`);
      }
    }
  } catch (err: any) {
    console.error(`エラー: ${err.message}`);
    process.exit(1);
  }
}
