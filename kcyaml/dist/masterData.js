import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadAppConfig } from './configManager.js';
const DEFAULT_MASTER_JSON_URL = 'https://firebasestorage.googleapis.com/v0/b/development-74af0.appspot.com/o/master.json?alt=media';
const DEFAULT_START2_URL = 'https://raw.githubusercontent.com/noro6/kc-web/main/public/START2.json';
const CACHE_DIR = path.join(os.tmpdir(), 'kcyaml-cache');
const MASTER_CACHE = path.join(CACHE_DIR, 'kcweb_master.json');
async function fetchWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok)
            throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
    catch (err) {
        clearTimeout(id);
        throw err;
    }
}
function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
}
function readCache(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        }
    }
    catch { }
    return null;
}
function writeCache(filePath, data) {
    try {
        ensureCacheDir();
        fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    }
    catch { }
}
function buildMasterMaps(rawMaster) {
    const ships = {};
    const items = {};
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
                    typeId: i.type ?? (Array.isArray(i.api_type) ? i.api_type[2] : 0),
                    itype: i.itype,
                    type: Array.isArray(i.api_type) ? i.api_type : undefined,
                };
            }
        }
    }
    return { ships, items };
}
export async function loadMasterData(forceRefresh = false) {
    let cachedData = readCache(MASTER_CACHE);
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
        }
        catch (err) {
            try {
                const rawStart2 = await fetchWithTimeout(start2Url, timeout);
                if (rawStart2) {
                    cachedData = buildMasterMaps(rawStart2);
                    writeCache(MASTER_CACHE, cachedData);
                }
            }
            catch (err2) {
                if (!cachedData) {
                    cachedData = { ships: {}, items: {} };
                }
            }
        }
    }
    return cachedData || { ships: {}, items: {} };
}
