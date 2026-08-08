import { JSDOM } from 'jsdom';
import canvasPkg from 'canvas';
const { createCanvas, Image, loadImage } = canvasPkg;
import sharp from 'sharp';
import { generate, DeckBuilder } from 'gkcoi';

// Minimal dummy start2.json object for gkcoi initialization fallback
const DUMMY_START2_DATA = {
  api_mst_ship: [
    { api_id: 1, api_name: '睦月', api_yomi: 'むつき', api_stype: 2, api_ctype: 1, api_slot_num: 3, api_leng: 1, api_soku: 10, api_maxeq: [1, 1, 0, 0, 0] }
  ],
  api_mst_slotitem: [
    { api_id: 1, api_name: '12.7cm連装砲', api_type: [1, 1, 1, 1, 0], api_houg: 2, api_raig: 0, api_baku: 0, api_souk: 0, api_tyku: 1, api_houk: 0, api_houm: 0, api_tais: 0, api_saku: 0, api_leng: 1 }
  ]
};

/**
 * Global DOM Polyfill setup for running gkcoi in Node.js environment
 */
function ensureDomEnvironment(): void {
  if (globalThis.document && globalThis.window) {
    return;
  }

  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  globalThis.window = dom.window as any;
  globalThis.document = dom.window.document as any;
  globalThis.HTMLCanvasElement = dom.window.HTMLCanvasElement as any;
  globalThis.Image = Image as any;

  try {
    Object.defineProperty(globalThis, 'navigator', {
      value: dom.window.navigator,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    // Ignore if navigator is already set
  }

  // Intercept fetch for start2.json & timeout protection
  const origFetch = globalThis.fetch;
  globalThis.fetch = async function (input: any, init?: any) {
    const urlStr = typeof input === 'string' ? input : (input && input.url ? input.url : String(input));

    if (urlStr.includes('start2.json')) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await origFetch(input, { ...init, signal: controller.signal });
        clearTimeout(timeout);
        if (res.ok) {
          const text = await res.clone().text();
          if (text.startsWith('{')) {
            return res;
          }
        }
      } catch (err) {}
      // Return dummy start2 JSON response on network error or invalid JSON response
      return new Response(JSON.stringify(DUMMY_START2_DATA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await origFetch(input, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err) {
      clearTimeout(timeout);
      return new Response('{}', { status: 404 });
    }
  } as any;

  const origCreateElement = globalThis.document.createElement.bind(globalThis.document);
  globalThis.document.createElement = function (tagName: string, options?: any) {
    const tag = tagName.toLowerCase();
    if (tag === 'canvas') {
      return createCanvas(1, 1) as any;
    }
    if (tag === 'img') {
      const img = new Image() as any;
      let _src = '';
      Object.defineProperty(img, 'src', {
        get() {
          return _src;
        },
        set(val: string) {
          _src = val;
          if (!val) return;

          let handled = false;
          const fallback = () => {
            if (handled) return;
            handled = true;
            const blank = createCanvas(1, 1);
            loadImage(blank.toDataURL()).then((bImg) => {
              Object.assign(img, bImg);
              if (img.onload) img.onload();
            }).catch(() => {
              if (img.onload) img.onload();
            });
          };

          const timeout = setTimeout(fallback, 2000);

          loadImage(val)
            .then((loadedImg) => {
              if (!handled) {
                handled = true;
                clearTimeout(timeout);
                Object.assign(img, loadedImg);
                if (img.onload) img.onload();
              }
            })
            .catch(() => {
              clearTimeout(timeout);
              fallback();
            });
        },
        configurable: true,
      });
      return img;
    }
    return origCreateElement(tagName, options);
  };

  globalThis.FontFace = class FontFace {
    family: string;
    source: string;
    constructor(family: string, source: string) {
      this.family = family;
      this.source = source;
    }
    async load() {
      return this;
    }
  } as any;

  if (!globalThis.document.fonts) {
    (globalThis.document as any).fonts = {
      add: () => {},
      ready: Promise.resolve(),
    };
  }
}

/**
 * Generates 256-color optimized fleet composition PNG image from DeckBuilder data.
 */
export async function generateFleetImage(
  deckBuilder: DeckBuilder,
  theme: string = 'official'
): Promise<Buffer> {
  ensureDomEnvironment();

  const deckDataWithTheme: DeckBuilder = {
    ...deckBuilder,
    theme: theme as any,
    lang: 'jp' as any,
  };

  const canvas = await generate(deckDataWithTheme, {
    start2URL: 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master/start2.json',
    shipURL: 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master',
    masterUrl: 'https://raw.githubusercontent.com/Nishisonic/gkcoi/master',
  });

  const rawBuffer = (canvas as any).toBuffer('image/png');

  // Perform 256-color palette quantization and strip non-essential metadata
  const optimizedBuffer = await sharp(rawBuffer)
    .png({
      palette: true,
      quality: 80,
      compressionLevel: 9,
      effort: 10,
    })
    .toBuffer();

  return optimizedBuffer;
}
