import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import * as esbuild from 'esbuild';
import { DeckBuilder } from 'gkcoi';
import { detectSystemBrowserPath } from './browserDetector.js';

let cachedGkcoiBundleJs: string | null = null;

/**
 * Bundles gkcoi in-memory into an IIFE script exposed as window.gkcoi for browser execution.
 */
async function getGkcoiBrowserBundle(): Promise<string> {
  if (cachedGkcoiBundleJs) {
    return cachedGkcoiBundleJs;
  }

  const result = await esbuild.build({
    stdin: {
      contents: `
        import * as gkcoi from 'gkcoi';
        window.gkcoi = gkcoi;
      `,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    platform: 'browser',
  });

  cachedGkcoiBundleJs = result.outputFiles[0].text;
  return cachedGkcoiBundleJs;
}

/**
 * Generates 256-color optimized fleet composition PNG image from DeckBuilder data using system browser.
 */
export async function generateFleetImage(
  deckBuilder: DeckBuilder,
  theme: string = 'official'
): Promise<Buffer> {
  console.error('[kcyaml:LOG] システムブラウザの自動検出を実行しています...');
  const browserPath = detectSystemBrowserPath();

  if (!browserPath) {
    console.error('[kcyaml:ERROR] システムブラウザ (Microsoft Edge / Google Chrome) が見つかりませんでした。');
    throw new Error(
      '画像生成に必要なシステムブラウザ (Microsoft Edge または Google Chrome) が見つかりませんでした。'
    );
  }

  console.error(`[kcyaml:LOG] 検出されたシステムブラウザを無人モードで起動します: ${browserPath}`);

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    console.error('[kcyaml:LOG] ブラウザページを開き、gkcoi インメモリバンドルを注入しています...');
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    // Relay browser console logs to CLI stdout/stderr for full debug transparency
    page.on('console', (msg) => {
      console.error(`[kcyaml:BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    const bundleJs = await getGkcoiBrowserBundle();

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body>
      <div id="container"></div>
      <script>
        ${bundleJs}
      </script>
      <script>
        console.log("gkcoi スクリプトの注入完了。レンダリングを準備中...");

        window.startRender = function(deckData) {
          window.renderResult = null;
          console.log("gkcoi.generate を公式デフォルト設定 (static/START2.json) で呼び出し中...");

          // Use gkcoi's official default configuration without passing invalid URLs
          window.gkcoi.generate(deckData).then(function(canvas) {
            console.log("gkcoi キャンバス描画が完了しました。PNG化を開始します...");
            document.getElementById('container').appendChild(canvas);
            window.renderResult = canvas.toDataURL('image/png');
          }).catch(function(e) {
            console.error("gkcoi 描画エラー: " + (e.message || String(e)));
            window.renderResult = { error: e.message || String(e) };
          });
        };
      </script>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    console.error('[kcyaml:LOG] インメモリ HTML ページの展開を完了しました。');

    const deckDataWithTheme = {
      ...deckBuilder,
      theme: theme as any,
      lang: 'jp' as any,
    };

    console.error(`[kcyaml:LOG] ブラウザ内で gkcoi レンダリングを開始します (テーマ: ${theme})...`);
    await page.evaluate((data) => {
      (window as any).startRender(data);
    }, deckDataWithTheme);

    console.error('[kcyaml:LOG] キャンバス描画の完了を監視中 (最大タイムアウト: 20秒)...');
    await page.waitForFunction(() => (window as any).renderResult !== null, { timeout: 20000 });

    const dataUrlResult = await page.evaluate(() => (window as any).renderResult);

    if (!dataUrlResult || typeof dataUrlResult !== 'string') {
      const errMsg = (dataUrlResult && dataUrlResult.error) || 'Unknown error during rendering';
      console.error(`[kcyaml:ERROR] ブラウザ内での画像生成に失敗しました: ${errMsg}`);
      throw new Error(`ブラウザ内での画像生成に失敗しました: ${errMsg}`);
    }

    console.error('[kcyaml:LOG] レンダリング画像の取得完了。sharp による256色軽量化処理を開始します...');
    const base64Data = dataUrlResult.replace(/^data:image\/png;base64,/, '');
    const rawBuffer = Buffer.from(base64Data, 'base64');

    const optimizedBuffer = await sharp(rawBuffer)
      .png({
        palette: true,
        quality: 80,
        compressionLevel: 9,
        effort: 10,
      })
      .toBuffer();

    console.error('[kcyaml:LOG] 画像の256色軽量化および圧縮が正常に完了しました。');
    return optimizedBuffer;
  } finally {
    console.error('[kcyaml:LOG] システムブラウザのプロセスを終了しています...');
    await browser.close();
  }
}
