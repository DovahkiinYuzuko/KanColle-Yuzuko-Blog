import fs from 'fs';
import path from 'path';
import os from 'os';
import { MasterData, MasterShip, MasterItem } from './types.js';

const MASTER_JSON_URL = 'https://firebasestorage.googleapis.com/v0/b/development-74af0.appspot.com/o/master.json?alt=media';
const START2_URL = 'https://raw.githubusercontent.com/noro6/kc-web/main/public/START2.json';

const CACHE_DIR = path.join(os.tmpdir(), 'kcyaml-cache');
const MASTER_CACHE = path.join(CACHE_DIR, 'kcweb_master.json');

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readCache<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch {}
  return null;
}

function writeCache(filePath: string, data: any): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
  } catch {}
}

function buildMasterMaps(rawMaster: any): MasterData {
  const ships: Record<string, MasterShip> = {};
  const items: Record<string, MasterItem> = {};

  if (rawMaster && Array.isArray(rawMaster.ships)) {
    for (const s of rawMaster.ships) {
      if (s && s.id && s.name) {
        ships[String(s.id)] = {
          name: s.name,
          stype: s.type,
          minScout: s.min_scout ?? 0,
          maxScout: s.scout ?? 0,
          maxeq: Array.isArray(s.slots) ? s.slots : [],
        };
      }
    }
  }

  if (rawMaster && Array.isArray(rawMaster.items)) {
    for (const i of rawMaster.items) {
      if (i && i.id && i.name) {
        items[String(i.id)] = {
          name: i.name,
          taiku: i.antiAir ?? i.api_tyku ?? 0,
          saku: i.scout ?? i.api_saku ?? 0,
          itype: i.itype ?? (Array.isArray(i.api_type) ? i.api_type[2] : 0),
          type: Array.isArray(i.api_type) ? i.api_type : undefined,
        };
      }
    }
  }

  return { ships, items };
}

export async function loadMasterData(forceRefresh: boolean = false): Promise<MasterData> {
  let cachedData = readCache<MasterData>(MASTER_CACHE);

  const timeout = forceRefresh ? 10000 : 3000;

  if (forceRefresh || !cachedData || Object.keys(cachedData.ships).length === 0) {
    try {
      const rawMaster = await fetchWithTimeout(MASTER_JSON_URL, timeout);
      if (rawMaster) {
        cachedData = buildMasterMaps(rawMaster);
        writeCache(MASTER_CACHE, cachedData);
      }
    } catch (err) {
      try {
        const rawStart2 = await fetchWithTimeout(START2_URL, timeout);
        if (rawStart2) {
          cachedData = buildMasterMaps(rawStart2);
          writeCache(MASTER_CACHE, cachedData);
        }
      } catch (err2) {
        if (!cachedData) {
          cachedData = { ships: {}, items: {} };
        }
      }
    }
  }

  return cachedData || { ships: {}, items: {} };
}
