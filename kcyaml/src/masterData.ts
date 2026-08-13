import fs from 'fs';
import path from 'path';
import os from 'os';
import { MasterData, MasterShip, MasterItem } from './types.js';
import { loadAppConfig } from './configManager.js';

const DEFAULT_MASTER_JSON_URL = 'https://firebasestorage.googleapis.com/v0/b/development-74af0.appspot.com/o/master.json?alt=media';
const DEFAULT_START2_URL = 'https://raw.githubusercontent.com/noro6/kc-web/main/public/START2.json';

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
      const parsed = JSON.parse(data) as any;
      if (parsed && parsed.items && typeof parsed.items === 'object') {
        const firstKey = Object.keys(parsed.items)[0];
        if (firstKey && (parsed.items[firstKey].typeId === undefined || parsed.items[firstKey].firepower === undefined)) {
          // 古いキャッシュのため無効化
          return null;
        }
      }
      if (parsed && parsed.ships && typeof parsed.ships === 'object') {
        const firstShipKey = Object.keys(parsed.ships)[0];
        if (firstShipKey && parsed.ships[firstShipKey].firepower === undefined) {
          return null;
        }
      }
      return parsed as T;
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

  // 1. master.json format (ships array)
  if (rawMaster && Array.isArray(rawMaster.ships)) {
    for (const s of rawMaster.ships) {
      if (s && s.id && s.name) {
        ships[String(s.id)] = {
          name: s.name,
          stype: s.type,
          minScout: s.min_scout ?? 0,
          maxScout: s.scout ?? 0,
          minAvoid: s.min_avoid ?? 0,
          maxAvoid: s.avoid ?? 0,
          minAsw: s.min_asw ?? 0,
          maxAsw: s.asw ?? 0,
          firepower: s.fire ?? 0,
          torpedo: s.torpedo ?? 0,
          antiAir: s.anti_air ?? 0,
          armor: s.armor ?? 0,
          hp: s.hp ?? 0,
          luck: s.luck ?? 0,
          maxeq: Array.isArray(s.slots) ? s.slots : [],
        };
      }
    }
  }
  // 1b. START2.json format fallback (api_mst_ship array)
  else if (rawMaster && Array.isArray(rawMaster.api_mst_ship)) {
    for (const s of rawMaster.api_mst_ship) {
      if (s && s.api_id && s.api_name) {
        ships[String(s.api_id)] = {
          name: s.api_name,
          stype: s.api_stype,
          minScout: 0,
          maxScout: 0,
          minAvoid: 0,
          maxAvoid: 0,
          minAsw: 0,
          maxAsw: 0,
          firepower: Array.isArray(s.api_houg) ? s.api_houg[1] : 0,
          torpedo: Array.isArray(s.api_raig) ? s.api_raig[1] : 0,
          antiAir: Array.isArray(s.api_tyku) ? s.api_tyku[1] : 0,
          armor: Array.isArray(s.api_souk) ? s.api_souk[1] : 0,
          hp: Array.isArray(s.api_taik) ? s.api_taik[0] : 0,
          luck: Array.isArray(s.api_luck) ? s.api_luck[0] : 0,
          maxeq: Array.isArray(s.api_maxeq) ? s.api_maxeq : [],
        };
      }
    }
  }

  // 2. master.json format (items array)
  if (rawMaster && Array.isArray(rawMaster.items)) {
    for (const i of rawMaster.items) {
      if (i && i.id && i.name) {
        items[String(i.id)] = {
          name: i.name,
          taiku: i.antiAir ?? i.api_tyku ?? 0,
          saku: i.scout ?? i.api_saku ?? 0,
          firepower: i.fire ?? i.api_houg ?? 0,
          torpedo: i.torpedo ?? i.api_raig ?? 0,
          armor: i.armor ?? i.api_souk ?? 0,
          asw: i.asw ?? i.api_tais ?? 0,
          evasion: i.avoid ?? i.api_houk ?? 0,
          typeId: i.type ?? (Array.isArray(i.api_type) ? i.api_type[2] : 0),
          itype: i.itype,
          type: Array.isArray(i.api_type) ? i.api_type : undefined,
        };
      }
    }
  }
  // 2b. START2.json format fallback (api_mst_slotitem array)
  else if (rawMaster && Array.isArray(rawMaster.api_mst_slotitem)) {
    for (const i of rawMaster.api_mst_slotitem) {
      if (i && i.api_id && i.api_name) {
        items[String(i.api_id)] = {
          name: i.api_name,
          taiku: i.api_tyku ?? 0,
          saku: i.api_saku ?? 0,
          firepower: i.api_houg ?? 0,
          torpedo: i.api_raig ?? 0,
          armor: i.api_souk ?? 0,
          asw: i.api_tais ?? 0,
          evasion: i.api_houk ?? 0,
          typeId: Array.isArray(i.api_type) ? i.api_type[2] : 0,
          itype: Array.isArray(i.api_type) ? i.api_type[3] : 0,
          type: Array.isArray(i.api_type) ? i.api_type : undefined,
        };
      }
    }
  }

  return { ships, items };
}

export async function loadMasterData(forceRefresh: boolean = false): Promise<MasterData> {
  let cachedData = readCache<MasterData>(MASTER_CACHE);

  const config = loadAppConfig();
  const masterJsonUrl = config.urls.masterJsonUrl || DEFAULT_MASTER_JSON_URL;
  const start2Url = config.urls.start2Url || DEFAULT_START2_URL;

  const timeout = forceRefresh ? 10000 : 3000;

  if (forceRefresh || !cachedData || Object.keys(cachedData.ships).length === 0) {
    try {
      const rawMaster = await fetchWithTimeout(masterJsonUrl, timeout);
      if (rawMaster) {
        cachedData = buildMasterMaps(rawMaster);
        writeCache(MASTER_CACHE, cachedData);
      }
    } catch (err) {
      try {
        const rawStart2 = await fetchWithTimeout(start2Url, timeout);
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
