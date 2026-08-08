import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import clipboardy from 'clipboardy';
import notifier from 'node-notifier';
import { loadMasterData } from './masterData.js';
import { parseDeckBuilder, validateDeckBuilder } from './parser.js';
import { buildMarkdownOutput, buildYamlOutput } from './formatter.js';
import { generateFleetImage } from './imageGenerator.js';
import { promptSaveFilePath } from './fileDialog.js';
function sendOsNotification(title, message) {
    try {
        notifier.notify({
            title,
            message,
            sound: false,
            wait: false,
        });
    }
    catch { }
}
function getFormattedTimestamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}
export async function runCli(argv) {
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
        .option('-g, --image', '編成画像(PNG)を出力する', false)
        .option('--image-theme <theme>', '編成画像の表示テーマ (official, dark, light, 74lc 等)', 'official')
        .option('--image-output <path>', '編成画像の保存先ファイルパス')
        .option('--no-dialog', 'OSのエクスプローラー保存ダイアログ表示をスキップする', false)
        .option('--dry-run', 'クリップボード書き込みを行わずstdout出力のみ', false)
        .option('-r, --refresh', 'マスタデータをリモートから強制再取得・更新する', false)
        .option('--validate', '入力データの整合性・未知のIDチェックを実行する', false);
    program.parse(argv);
    const opts = program.opts();
    const parsedFleet = opts.fleet
        ? (Array.isArray(opts.fleet) ? opts.fleet : [opts.fleet]).map((n) => parseInt(String(n), 10)).filter((n) => !isNaN(n))
        : undefined;
    const parsedAir = opts.air
        ? (Array.isArray(opts.air) ? opts.air : [opts.air]).map((n) => parseInt(String(n), 10)).filter((n) => !isNaN(n))
        : undefined;
    const options = {
        fleet: parsedFleet,
        air: parsedAir,
        title: opts.title,
        fleetTitle: opts.fleetTitle,
        airTitle: opts.airTitle,
        input: opts.input,
        output: opts.output,
        image: opts.image,
        imageTheme: opts.imageTheme,
        imageOutput: opts.imageOutput,
        noDialog: !opts.dialog,
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
        }
        catch (err) {
            console.error(`エラー: 入力ファイル '${options.input}' の読み込みに失敗しました: ${err.message}`);
            process.exit(1);
        }
    }
    else {
        try {
            inputText = await clipboardy.read();
        }
        catch (err) {
            console.error(`エラー: クリップボードからの読み取りに失敗しました: ${err.message}`);
            process.exit(1);
        }
    }
    if (!inputText || inputText.trim() === '') {
        console.error('エラー: 入力データが空です。ファイル指定 (-i) またはクリップボードにJSONをコピーしてください。');
        process.exit(1);
    }
    try {
        const rawDeckObj = JSON.parse(inputText);
        const masterData = await loadMasterData(options.refresh);
        if (options.validate) {
            const report = validateDeckBuilder(inputText, options, masterData);
            console.log('=== Deck Builder データ検証結果 ===');
            if (report.issues.length === 0) {
                console.log('OK: データに異常や未登録IDは見つかりませんでした。');
            }
            else {
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
            }
            else if (typeof options.output === 'string') {
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
                }
                catch (err) {
                    console.error(`エラー: ファイル '${targetPath}' への保存に失敗しました: ${err.message}`);
                }
            }
        }
        // Process image output if -g / --image is specified
        if (options.image) {
            try {
                console.error('\n(編成画像を生成中...)');
                const theme = options.imageTheme || 'official';
                const targetFleets = options.fleet || [1];
                for (const fleetNum of targetFleets) {
                    const fleetKey = `f${fleetNum}`;
                    if (!rawDeckObj[fleetKey]) {
                        continue;
                    }
                    // Build a single fleet DeckBuilder object
                    const singleFleetDeck = {
                        version: rawDeckObj.version || 4,
                        hqlv: rawDeckObj.hqlv || 120,
                        f1: rawDeckObj[fleetKey],
                        lang: 'jp',
                        theme: theme,
                    };
                    const imageBuffer = await generateFleetImage(singleFleetDeck, theme);
                    let imageSavePath = options.imageOutput;
                    const defaultTitle = options.title || options.fleetTitle || 'fleet';
                    const fleetLabel = `第${fleetNum}艦隊`;
                    const defaultFilename = `${defaultTitle.replace(/[\\/:*?"<>|]/g, '_')}_${fleetLabel}_${getFormattedTimestamp()}.png`;
                    if (targetFleets.length === 1 && imageSavePath) {
                        // Keep user specified output path if only single fleet
                    }
                    else {
                        imageSavePath = '';
                    }
                    // Prompt via OS dialog if imageOutput is not explicitly specified and dialog is enabled
                    if (!imageSavePath && !options.noDialog) {
                        const selectedPath = await promptSaveFilePath(defaultFilename);
                        if (selectedPath) {
                            imageSavePath = selectedPath;
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
                    console.error(`(編成画像 [${fleetLabel}] を256色軽量化の上 '${imageSavePath}' に保存しました)`);
                }
            }
            catch (imgErr) {
                console.error(`(警告: 編成画像の生成・保存に失敗しました: ${imgErr.message})`);
            }
        }
        console.log(markdownResult);
        if (!options.dryRun) {
            try {
                await clipboardy.write(markdownResult);
                console.error('\n(変換結果をクリップボードにコピーしました)');
                sendOsNotification('kcyaml', '変換結果をクリップボードにコピーしました！');
            }
            catch (err) {
                console.error(`\n(警告: クリップボードへの書き込みに失敗しました: ${err.message})`);
            }
        }
    }
    catch (err) {
        console.error(`エラー: ${err.message}`);
        process.exit(1);
    }
}
