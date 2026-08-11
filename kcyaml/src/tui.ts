import fs from 'fs';
import path from 'path';
import * as p from '@clack/prompts';
import { CliOptions } from './types.js';
import { loadMasterData } from './masterData.js';
import { parseDeckBuilder } from './parser.js';
import { buildMarkdownOutput, buildYamlOutput } from './formatter.js';
import { generateFleetImage } from './imageGenerator.js';
import { loadAppConfig } from './configManager.js';
import { TuiFsmEngine } from './tuiFsm.js';
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
  const fsm = new TuiFsmEngine();

  // --- STATE 1: INPUT_SOURCE ---
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
  fsm.context.inputSource = inputSource as 'clipboard' | 'file';

  if (fsm.context.inputSource === 'file') {
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
    fsm.context.inputFilePath = String(fileRes).trim();
  }

  // --- STATE 2: TARGET_SELECTION ---
  const fleetRes = await p.multiselect({
    message: '変換対象の艦隊を選択してください (Space: 選択/解除 | Enter: 決定 / 省略可):',
    options: [
      { value: 1, label: '第1艦隊' },
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
  fsm.context.selectedFleets = fleetRes as number[];

  const airRes = await p.multiselect({
    message: '変換対象の基地航空隊を選択してください (Space: 選択/解除 | Enter: 決定 / 省略可):',
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
  fsm.context.selectedAir = airRes as number[];

  if (fsm.context.selectedFleets.length === 0 && fsm.context.selectedAir.length === 0) {
    p.cancel('艦隊または基地航空隊のいずれかを1つ以上選択してください。');
    return;
  }

  // --- STATE 3: MODE_BRANCH (HFSM 階層評価) ---
  const modeSubState = fsm.evaluateTargetBranch();

  if (modeSubState === 'AIR_ONLY') {
    // 基地航空隊のみサブ状態: 連合艦隊・画像質問は自動スキップ！
    const isExactMas = await p.confirm({
      message: '実際の熟練度数値 (mas) をそのまま計算に使用しますか？',
      initialValue: false,
    });
    if (p.isCancel(isExactMas)) {
      p.cancel('処理をキャンセルしました。');
      return;
    }
    fsm.context.isExactMas = Boolean(isExactMas);
  } else {
    // 艦隊含むサブ状態 (FLEET_INCLUDED)
    const isRengo = await p.confirm({
      message: '連合艦隊フォーマットで出力しますか？',
      initialValue: false,
    });
    if (p.isCancel(isRengo)) {
      p.cancel('処理をキャンセルしました。');
      return;
    }
    fsm.context.isRengo = Boolean(isRengo);

    const isExactMas = await p.confirm({
      message: '実際の熟練度数値 (mas) をそのまま計算に使用しますか？',
      initialValue: false,
    });
    if (p.isCancel(isExactMas)) {
      p.cancel('処理をキャンセルしました。');
      return;
    }
    fsm.context.isExactMas = Boolean(isExactMas);

    const isImage = await p.confirm({
      message: '編成画像 (PNG) を同時に生成しますか？',
      initialValue: false,
    });
    if (p.isCancel(isImage)) {
      p.cancel('処理をキャンセルしました。');
      return;
    }
    fsm.context.isImage = Boolean(isImage);

    if (fsm.context.isImage) {
      // サブ状態 THEME_SELECT
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
      fsm.context.imageTheme = String(themeRes);
    }
  }

  // --- STATE 4: OUTPUT_SETTING ---
  fsm.transitionTo('OUTPUT_SETTING');
  const isSaveFile = await p.confirm({
    message: 'YAML/Markdown ファイルをディスクに保存しますか？',
    initialValue: false,
  });
  if (p.isCancel(isSaveFile)) {
    p.cancel('処理をキャンセルしました。');
    return;
  }
  fsm.context.isSaveFile = Boolean(isSaveFile);

  // --- STATE 5: EXECUTION ---
  fsm.transitionTo('EXECUTION');
  const s = p.spinner();
  s.start('変換処理を実行中...');

  let inputText = '';
  if (fsm.context.inputFilePath) {
    try {
      inputText = fs.readFileSync(fsm.context.inputFilePath, 'utf-8');
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

  const options: CliOptions = fsm.buildCliOptions(
    appConfig.image.defaultTheme || 'official',
    appConfig.dialog.enabled
  );

  try {
    const rawDeckObj = JSON.parse(inputText);
    const masterData = await loadMasterData(false);
    const parsedData = parseDeckBuilder(inputText, options, masterData);
    const markdownResult = buildMarkdownOutput(parsedData, options);

    // クリップボードへコピー
    await clipboardy.write(markdownResult);
    sendOsNotification('kcyaml', '変換結果をクリップボードにコピーしました！');

    // ファイル保存処理
    if (fsm.context.isSaveFile) {
      const dirPath = path.join(process.cwd(), 'kcdata-output');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filename = `kcyaml_output_${getFormattedTimestamp()}.yaml`;
      const targetPath = path.join(dirPath, filename);
      fs.writeFileSync(targetPath, buildYamlOutput(parsedData, options), 'utf-8');
    }

    s.stop('変換が正常に完了しました！');

    // 画像出力 (艦隊が含まれる場合のみ実行)
    if (options.image && options.fleet && options.fleet.length > 0) {
      const imgSpinner = p.spinner();
      imgSpinner.start('編成画像 (PNG) を生成中...');

      const targetFleets = options.fleet;
      for (const fleetNum of targetFleets) {
        const fleetKey = `f${fleetNum}`;
        const fleetLabel = `第${fleetNum}艦隊`;

        if (!rawDeckObj[fleetKey]) continue;

        const singleFleetDeck = {
          version: rawDeckObj.version || 4,
          hqlv: rawDeckObj.hqlv || 120,
          f1: rawDeckObj[fleetKey],
          lang: 'jp' as any,
          theme: fsm.context.imageTheme as any,
        };

        try {
          const imageBuffer = await generateFleetImage(singleFleetDeck, fsm.context.imageTheme);
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
