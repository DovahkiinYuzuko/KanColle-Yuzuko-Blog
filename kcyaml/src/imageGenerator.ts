import { JSDOM } from 'jsdom';
import canvasPkg from 'canvas';
const { createCanvas, Image, loadImage } = canvasPkg;
import sharp from 'sharp';
import { generate, DeckBuilder } from 'gkcoi';

// Saved original node fetch function
const nativeNodeFetch = globalThis.fetch;

// Fast embedded start2 fallback data for offline / instantaneous rendering
const FAST_START2_DATA = {
  api_mst_ship: [
    { api_id: 1, api_name: '睦月', api_yomi: 'むつき', api_stype: 2, api_ctype: 1, api_slot_num: 3, api_leng: 1, api_soku: 10, api_maxeq: [1, 1, 0, 0, 0] },
    { api_id: 194, api_name: '羽黒改二', api_yomi: 'はぐろ', api_stype: 5, api_ctype: 6, api_slot_num: 5, api_leng: 2, api_soku: 10, api_maxeq: [2, 2, 2, 2, 0] },
  ],
  api_mst_slotitem: [
    { api_id: 1, api_name: '12.7cm連装砲', api_type: [1, 1, 1, 1, 0], api_houg: 2, api_raig: 0, api_baku: 0, api_souk: 0, api_tyku: 1, api_houk: 0, api_houm: 0, api_tais: 0, api_saku: 0, api_leng: 1 },
  ]
};

// Cached start2 JSON response to prevent repeated network delays
let cachedStart2Json: any = null;

async function getFullStart2Data(): Promise<any> {
  if (cachedStart2Json) {
    return cachedStart2Json;
  }

  const start2Urls = [
    'https://raw.githubusercontent.com/Nishisonic/gkcoi/master/start2.json',
    'https://raw.githubusercontent.com/Nishisonic/gkcoi/main/start2.json',
  ];

  for (const url of start2Urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const res = await nativeNodeFetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.api_mst_ship) && json.api_mst_ship.length > 0) {
          cachedStart2Json = json;
          return json;
        }
      }
    } catch (e) {}
  }

  cachedStart2Json = FAST_START2_DATA;
  return FAST_START2_DATA;
}

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
  } catch (e) {}

  // Intercept fetch for start2.json with Proxy safety net for missing ships and items
  globalThis.fetch = async function (input: any, init?: any) {
    const urlStr = typeof input === 'string' ? input : input?.url ? input.url : String(input);

    if (urlStr.includes('start2.json')) {
      const fullData = await getFullStart2Data();
      const res = new Response(JSON.stringify(fullData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

      res.json = async () => {
        const data = JSON.parse(JSON.stringify(fullData));

        data.api_mst_ship = new Proxy(data.api_mst_ship || [], {
          get(target, prop) {
            if (prop === 'reduce') {
              return function (callback: any, initialValue: any) {
                const map = target.reduce(callback, initialValue);
                return new Proxy(map, {
                  get(mapTarget, shipId) {
                    const key = String(shipId);
                    if (key in mapTarget) {
                      return mapTarget[key];
                    }
                    return {
                      api_id: Number(key) || 1,
                      api_name: `艦娘(ID:${key})`,
                      api_yomi: '',
                      api_stype: 2,
                      api_ctype: 1,
                      api_slot_num: 5,
                      api_leng: 1,
                      api_soku: 10,
                      api_maxeq: [1, 1, 1, 1, 1],
                    };
                  },
                });
              };
            }
            return (target as any)[prop];
          },
        });

        data.api_mst_slotitem = new Proxy(data.api_mst_slotitem || [], {
          get(target, prop) {
            if (prop === 'reduce') {
              return function (callback: any, initialValue: any) {
                const map = target.reduce(callback, initialValue);
                return new Proxy(map, {
                  get(mapTarget, itemId) {
                    const key = String(itemId);
                    if (key in mapTarget) {
                      return mapTarget[key];
                    }
                    return {
                      api_id: Number(key) || 1,
                      api_name: `装備(ID:${key})`,
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
                      api_leng: 1,
                    };
                  },
                });
              };
            }
            return (target as any)[prop];
          },
        });

        return data;
      };

      return res;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const res = await nativeNodeFetch(input, { ...init, signal: controller.signal });
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
      let _onload: any = null;
      let _isLoaded = false;

      Object.defineProperty(img, 'onload', {
        get() {
          return _onload;
        },
        set(fn) {
          _onload = fn;
          if (_isLoaded && typeof fn === 'function') {
            process.nextTick(() => fn());
          }
        },
        configurable: true,
      });

      Object.defineProperty(img, 'src', {
        get() {
          return _src;
        },
        set(val: string) {
          _src = val;
          if (!val) return;

          let handled = false;
          const markComplete = (loadedImg?: any) => {
            if (handled) return;
            handled = true;
            _isLoaded = true;
            if (loadedImg) {
              Object.assign(img, loadedImg);
            }
            if (typeof _onload === 'function') {
              _onload();
            }
          };

          const timeout = setTimeout(() => {
            const blank = createCanvas(1, 1);
            loadImage(blank.toDataURL()).then(markComplete).catch(() => markComplete());
          }, 300);

          loadImage(val)
            .then((loadedImg) => {
              clearTimeout(timeout);
              markComplete(loadedImg);
            })
            .catch(() => {
              clearTimeout(timeout);
              const blank = createCanvas(1, 1);
              loadImage(blank.toDataURL()).then(markComplete).catch(() => markComplete());
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
