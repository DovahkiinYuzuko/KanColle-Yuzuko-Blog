import puppeteer, { type ConsoleMessage } from 'puppeteer-core';
import sharp from 'sharp';
import * as esbuild from 'esbuild';
import { DeckBuilder } from 'gkcoi';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectSystemBrowserPath } from './browserDetector.js';
import { loadAppConfig } from './configManager.js';

let cachedGkcoiBundleJs: string | null = null;

/**
 * Bundles gkcoi in-memory into an IIFE script exposed as window.gkcoi for browser execution.
 */
async function getGkcoiBrowserBundle(): Promise<string> {
  if (cachedGkcoiBundleJs) {
    return cachedGkcoiBundleJs;
  }

  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  const result = await esbuild.build({
    stdin: {
      contents: `
        import * as gkcoi from 'gkcoi';
        window.gkcoi = gkcoi;
      `,
      resolveDir: currentDir,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'iife',
    minify: true,
    platform: 'browser',
  });

  cachedGkcoiBundleJs = result.outputFiles[0].text;
  return cachedGkcoiBundleJs!;
}

/**
 * Generates 256-color optimized fleet composition PNG image from DeckBuilder data using system browser.
 */
export async function generateFleetImage(
  deckBuilder: DeckBuilder,
  theme?: string,
  customConfigPath?: string
): Promise<Buffer> {
  const config = loadAppConfig(customConfigPath);
  const selectedTheme = theme || config.image.defaultTheme || 'official';

  if (config.logging.debug) {
    console.error('[kcyaml:LOG] システムブラウザの自動検出を実行しています...');
  }

  const browserPath = detectSystemBrowserPath();

  if (!browserPath) {
    if (config.logging.debug) {
      console.error('[kcyaml:ERROR] システムブラウザ (Microsoft Edge / Google Chrome) が見つかりませんでした。');
    }
    throw new Error(
      '画像生成に必要なシステムブラウザ (Microsoft Edge または Google Chrome) が見つかりませんでした。'
    );
  }

  if (config.logging.debug) {
    console.error(`[kcyaml:LOG] 検出されたシステムブラウザを無人モードで起動します: ${browserPath}`);
  }

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'],
  });

  try {
    if (config.logging.debug) {
      console.error('[kcyaml:LOG] ブラウザページを開き、インメモリバンドルを注入しています...');
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });

    if (config.logging.showBrowserLogs) {
      page.on('console', (msg: ConsoleMessage) => {
        console.error(`[kcyaml:BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`);
      });
    }

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
        const BLANK_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSU5EUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        try {
          Object.defineProperty(document.fonts, 'ready', {
            get() { return Promise.resolve(); }
          });
        } catch(e) {}

        const origSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;

        Object.defineProperty(HTMLImageElement.prototype, 'onerror', {
          get() { return this._customOnError; },
          set(fn) {
            const img = this;
            this._customOnError = function(err) {
              if (!img.getAttribute('data-fallback-done')) {
                img.setAttribute('data-fallback-done', 'true');
                origSrcSetter.call(img, BLANK_PNG);
                setTimeout(function() {
                  if (typeof img.onload === 'function') img.onload();
                }, 10);
                return;
              }
              if (typeof fn === 'function') fn.call(this, err);
            };
          },
          configurable: true
        });

        function createCompleteStart2Data(baseData) {
          const shipMap = {};
          if (baseData && Array.isArray(baseData.api_mst_ship)) {
            for (const s of baseData.api_mst_ship) {
              if (s && s.api_id) shipMap[s.api_id] = s;
            }
          }

          const itemMap = {};
          if (baseData && Array.isArray(baseData.api_mst_slotitem)) {
            for (const i of baseData.api_mst_slotitem) {
              if (i && i.api_id) itemMap[i.api_id] = i;
            }
          }

          const completeShips = [];
          for (let id = 1; id <= 2000; id++) {
            if (shipMap[id]) {
              completeShips.push(shipMap[id]);
            } else {
              completeShips.push({
                api_id: id,
                api_name: "艦娘(ID:" + id + ")",
                api_yomi: '',
                api_stype: 2,
                api_ctype: 1,
                api_slot_num: 5,
                api_leng: 1,
                api_soku: 10,
                api_maxeq: [1, 1, 1, 1, 1]
              });
            }
          }

          const completeItems = [];
          for (let id = 1; id <= 1000; id++) {
            if (itemMap[id]) {
              completeItems.push(itemMap[id]);
            } else {
              completeItems.push({
                api_id: id,
                api_name: "装備(ID:" + id + ")",
                api_type: [1, 1, 1, 1, 0],
                api_houg: 0,
                api_raig: 0,
                api_baku: 0,
                api_souk: 0,
                api_tyku: 0,
                api_houk: 0,
                api_houm: 0,
                api_tais: 0,
                api_saku: 0,
                api_leng: 1
              });
            }
          }

          return {
            api_mst_ship: completeShips,
            api_mst_slotitem: completeItems
          };
        }

        const origFetch = window.fetch;
        window.fetch = async function(input, init) {
          const urlStr = typeof input === 'string' ? input : (input && input.url) ? input.url : String(input);

          if (urlStr.includes('start2.json') || urlStr.includes('START2.json')) {
            let baseData = null;
            try {
              const res = await origFetch(input, init);
              if (res.ok) {
                baseData = await res.json();
              }
            } catch(e) {}

            const completeData = createCompleteStart2Data(baseData);
            return new Response(JSON.stringify(completeData), { status: 200, headers: { 'Content-Type': 'application/json' } });
          }

          try {
            const res = await origFetch(input, init);
            if (res.ok) return res;
          } catch(e) {}

          return new Response(atob(BLANK_PNG.split(',')[1]), { status: 200, headers: { 'Content-Type': 'image/png' } });
        };

        window.startRender = function(deckData, urls) {
          window.renderResult = null;

          var generateOpts = undefined;
          if (urls && (urls.start2Url || urls.shipUrl || urls.masterUrl)) {
            generateOpts = {};
            if (urls.start2Url) generateOpts.start2URL = urls.start2Url;
            if (urls.shipUrl) generateOpts.shipURL = urls.shipUrl;
            if (urls.masterUrl) generateOpts.masterUrl = urls.masterUrl;
          }

          console.log("gkcoi.generate を呼び出し中...");

          window.gkcoi.generate(deckData, generateOpts).then(function(canvas) {
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
    if (config.logging.debug) {
      console.error('[kcyaml:LOG] インメモリ HTML ページの展開を完了しました。');
    }

    const deckDataWithTheme = {
      ...deckBuilder,
      theme: selectedTheme as any,
      lang: 'jp' as any,
    };

    if (config.logging.debug) {
      console.error(`[kcyaml:LOG] ブラウザ内で gkcoi レンダリングを開始します (テーマ: ${selectedTheme})...`);
    }

    // Determine custom URLs: only pass if user explicitly modified default URLs
    const isCustomUrls =
      config.urls.start2Url !== 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master/static/START2.json' ||
      config.urls.shipUrl !== 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master' ||
      config.urls.masterUrl !== 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master';

    const passUrls = isCustomUrls ? config.urls : null;

    // First Attempt: execute rendering with current url settings
    await page.evaluate((data: any, urls: any) => {
      (window as any).startRender(data, urls);
    }, deckDataWithTheme, passUrls);

    if (config.logging.debug) {
      console.error('[kcyaml:LOG] キャンバス描画の完了を監視中 (最大タイムアウト: 15秒)...');
    }

    let dataUrlResult: any = null;
    try {
      await page.waitForFunction(() => (window as any).renderResult !== null, { timeout: 15000 });
      dataUrlResult = await page.evaluate(() => (window as any).renderResult);
    } catch (err) {
      // Automatic Fallback: If custom URL rendering fails or times out, fallback to default null options
      if (passUrls) {
        if (config.logging.debug) {
          console.error('[kcyaml:WARNING] カスタムURLでの画像描画がタイムアウトしました。公式デフォルト設定へ自動フォールバックして再試行します...');
        }
        await page.evaluate((data) => {
          (window as any).startRender(data, null);
        }, deckDataWithTheme);
        await page.waitForFunction(() => (window as any).renderResult !== null, { timeout: 15000 });
        dataUrlResult = await page.evaluate(() => (window as any).renderResult);
      } else {
        throw err;
      }
    }

    if (!dataUrlResult || typeof dataUrlResult !== 'string') {
      const errMsg = (dataUrlResult && dataUrlResult.error) || 'Unknown error during rendering';
      if (config.logging.debug) {
        console.error(`[kcyaml:ERROR] ブラウザ内での画像生成に失敗しました: ${errMsg}`);
      }
      throw new Error(`ブラウザ内での画像生成に失敗しました: ${errMsg}`);
    }

    if (config.logging.debug) {
      console.error('[kcyaml:LOG] レンダリング画像の取得完了。sharp による256色軽量化処理を開始します...');
    }

    const base64Data = dataUrlResult.replace(/^data:image\/png;base64,/, '');
    const rawBuffer = Buffer.from(base64Data, 'base64');

    const optimizedBuffer = await sharp(rawBuffer)
      .png({
        palette: config.image.palette,
        quality: config.image.quality,
        compressionLevel: 9,
        effort: 10,
      })
      .toBuffer();

    if (config.logging.debug) {
      console.error('[kcyaml:LOG] 画像の256色軽量化および圧縮が正常に完了しました。');
    }

    return optimizedBuffer;
  } finally {
    if (config.logging.debug) {
      console.error('[kcyaml:LOG] システムブラウザのプロセスを終了しています...');
    }
    await browser.close();
  }
}
