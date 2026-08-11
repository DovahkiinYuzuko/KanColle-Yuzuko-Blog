import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { CliOptions } from './types.js';
import { loadMasterData } from './masterData.js';
import { parseDeckBuilder } from './parser.js';
import { buildMarkdownOutput, buildYamlOutput } from './formatter.js';
import { generateFleetImage } from './imageGenerator.js';
import { promptSaveFilePath } from './fileDialog.js';
import { loadAppConfig } from './configManager.js';
import clipboardy from 'clipboardy';
import notifier from 'node-notifier';

function sendOsNotification(title: string, message: string): void {
  try {
    notifier.notify({ title, message, sound: false, wait: false });
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

export async function runTui(): Promise<void> {
  p.intro('⚓ kcyaml 対話型 TUI ウィザード ⚓');

  const appConfig = loadAppConfig();

  // 1. 入力元ソースの選択
  const inputSource = await p.select({
    message: 'JSON データの取得元を選択してください:',
    options: [
      { value: 'clipboard', label: '📋 クリップボードから取得 (標準)' },
      { value: 'file', label: '📁 JSON ファイルパスを指定する' },
    ],
  });

  if (p.isCancel(inputSource)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }

  let inputFilePath = '';
  if (inputSource === 'file') {
    const fileRes = await p.text({
      message: 'JSON ファイルのパスを入力してください:',
      placeholder: '例: ./例.json',
      validate: (val) => {
        if (!val || val.trim() === '') return 'ファイルパスを入力してください';
        if (!fs.existsSync(val.trim())) return '指定されたファイルが存在しません';
        return undefined;
      },
    });

    if (p.isCancel(fileRes)) {
      p.cancel('処理をキャンセルしました。');
      return;
    }
    inputFilePath = String(fileRes).trim();
  }

  // 2. 艦隊番号の選択
  const fleetRes = await p.multiselect({
    message: '変換対象の艦隊を選択してください:',
    options: [
      { value: 1, label: '第1艦隊', hint: 'デフォルト' },
      { value: 2, label: '第2艦隊' },
      { value: 3, label: '第3艦隊' },
      { value: 4, label: '第4艦隊' },
    ],
    initialValues: [1],
    required: false,
  });

  if (p.isCancel(fleetRes)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }
  const selectedFleets = fleetRes as number[];

  // 3. 基地航空隊番号の選択
  const airRes = await p.multiselect({
    message: '変換対象の基地航空隊を選択してください (省略可):',
    options: [
      { value: 1, label: '第1基地' },
      { value: 2, label: '第2基地' },
      { value: 3, label: '第3基地' },
    ],
    required: false,
  });

  if (p.isCancel(airRes)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }
  const selectedAir = airRes as number[];

  // 4. 連合艦隊フォーマット
  const isRengo = await p.confirm({
    message: '連合艦隊フォーマットで出力しますか？',
    initialValue: false,
  });
  if (p.isCancel(isRengo)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }

  // 5. 熟練度数値 (mas) の保持
  const isExactMas = await p.confirm({
    message: '実際の熟練度数値 (mas) をそのまま計算に使用しますか？',
    initialValue: false,
  });
  if (p.isCancel(isExactMas)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }

  // 6. 編成画像 (PNG) 出力
  const isImage = await p.confirm({
    message: '編成画像 (PNG) を同時に生成しますか？',
    initialValue: false,
  });
  if (p.isCancel(isImage)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }

  let imageTheme = appConfig.image.defaultTheme || 'official';
  if (isImage) {
    const themeRes = await p.select({
      message: '編成画像のテーマを選択してください:',
      options: [
        { value: 'official', label: 'Official (公式風)' },
        { value: 'dark', label: 'Dark (ダーク)' },
        { value: 'light', label: 'Light (ライト)' },
        { value: '74lc', label: '74lc (七四式風)' },
      ],
    });
    if (p.isCancel(themeRes)) {
      p.cancel('処理をキャンセルしました。');
      return;
    }
    imageTheme = String(themeRes);
  }

  // 7. 出力ファイル保存
  const isSaveFile = await p.confirm({
    message: 'YAML/Markdown ファイルをディスクに保存しますか？',
    initialValue: false,
  });
  if (p.isCancel(isSaveFile)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }

  const s = p.spinner();
  s.start('変換処理を実行中...');

  // 入力JSONの読み込み
  let inputText = '';
  if (inputFilePath) {
    try {
      inputText = fs.readFileSync(inputFilePath, 'utf-8');
    } catch (err: any) {
      s.stop('ファイルの読み込みに失敗しました。');
      p.cancel(`エラー: ${err.message}`);
      return;
    }
  } else {
    try {
      inputText = await clipboardy.read();
    } catch (err: any) {
      s.stop('クリップボードの読み取りに失敗しました。');
      p.cancel(`エラー: ${err.message}`);
      return;
    }
  }

  if (!inputText || inputText.trim() === '') {
    s.stop('入力データが空です。');
    p.cancel('クリップボードまたはファイルに JSON データを入れてください。');
    return;
  }

  const options: CliOptions = {
    fleet: selectedFleets.length > 0 ? selectedFleets : [1],
    air: selectedAir.length > 0 ? selectedAir : undefined,
    input: inputFilePath || undefined,
    output: isSaveFile ? true : undefined,
    image: Boolean(isImage),
    imageTheme,
    noDialog: !appConfig.dialog.enabled,
    dryRun: false,
    refresh: false,
    validate: false,
    initConfig: false,
    exactMas: Boolean(isExactMas),
    rengo: Boolean(isRengo),
  };

  try {
    const rawDeckObj = JSON.parse(inputText);
    const masterData = await loadMasterData(false);
    const parsedData = parseDeckBuilder(inputText, options, masterData);
    const markdownResult = buildMarkdownOutput(parsedData, options);

    // クリップボードへコピー
    await clipboardy.write(markdownResult);
    sendOsNotification('kcyaml', '変換結果をクリップボードにコピーしました！');

    // ファイル保存処理
    if (isSaveFile) {
      const dirPath = path.join(process.cwd(), 'kcdata-output');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filename = `kcyaml_output_${getFormattedTimestamp()}.yaml`;
      const targetPath = path.join(dirPath, filename);
      fs.writeFileSync(targetPath, buildYamlOutput(parsedData, options), 'utf-8');
    }

    s.stop('変換が正常に完了しました！');

    // 画像出力
    if (options.image) {
      const imgSpinner = p.spinner();
      imgSpinner.start('編成画像 (PNG) を生成中...');

      const targetFleets = options.fleet || [1];
      for (const fleetNum of targetFleets) {
        const fleetKey = `f${fleetNum}`;
        const fleetLabel = `第${fleetNum}艦隊`;

        if (!rawDeckObj[fleetKey]) continue;

        const singleFleetDeck = {
          version: rawDeckObj.version || 4,
          hqlv: rawDeckObj.hqlv || 120,
          f1: rawDeckObj[fleetKey],
          lang: 'jp' as any,
          theme: imageTheme as any,
        };

        try {
          const imageBuffer = await generateFleetImage(singleFleetDeck, imageTheme);
          const defaultFilename = `fleet_${fleetLabel}_${getFormattedTimestamp()}.png`;
          const dirPath = path.join(process.cwd(), 'kcdata-output');
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          const imageSavePath = path.join(dirPath, defaultFilename);
          fs.writeFileSync(imageSavePath, imageBuffer);
        } catch (imgErr: any) {
          p.note(`画像生成エラー (${fleetLabel}): ${imgErr.message}`);
        }
      }
      imgSpinner.stop('編成画像の生成が完了しました！');
    }

    p.note(markdownResult, '📝 変換結果 (Markdown)');
    p.outro('🎉 処理が完了しました！クリップボードからそのまま貼り付けられます。');
  } catch (err: any) {
    s.stop('処理中にエラーが発生しました。');
    p.cancel(`エラー詳細: ${err.message}`);
  }
}
