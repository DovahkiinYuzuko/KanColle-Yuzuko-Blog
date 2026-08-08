import fs from 'fs';
import path from 'path';
import os from 'os';
const START2_URL = 'https://raw.githubusercontent.com/noro6/kc-web/main/public/START2.json';
const CACHE_DIR = path.join(os.tmpdir(), 'kcyaml-cache');
const MASTER_CACHE = path.join(CACHE_DIR, 'start2_master.json');
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
function buildMasterMaps(rawStart2) {
    const ships = {};
    const items = {};
    const rootData = rawStart2?.api_data || rawStart2;
    if (rootData && Array.isArray(rootData.api_mst_ship)) {
        for (const s of rootData.api_mst_ship) {
            if (s && s.api_id && s.api_name) {
                ships[String(s.api_id)] = { name: s.api_name };
            }
            else if (s && s.id && s.api_name) {
                ships[String(s.id)] = { name: s.api_name };
            }
            else if (s && s.id && s.name) {
                ships[String(s.id)] = { name: s.name };
            }
        }
    }
    if (rootData && Array.isArray(rootData.api_mst_slotitem)) {
        for (const i of rootData.api_mst_slotitem) {
            if (i && i.api_id && i.api_name) {
                items[String(i.api_id)] = { name: i.api_name };
            }
            else if (i && i.id && i.api_name) {
                items[String(i.id)] = { name: i.api_name };
            }
            else if (i && i.id && i.name) {
                items[String(i.id)] = { name: i.name };
            }
        }
    }
    return { ships, items };
}
export async function loadMasterData(forceRefresh = false) {
    let cachedData = readCache(MASTER_CACHE);
    const timeout = forceRefresh ? 10000 : 1500;
    if (forceRefresh || !cachedData || Object.keys(cachedData.ships).length === 0) {
        try {
            const rawStart2 = await fetchWithTimeout(START2_URL, timeout);
            if (rawStart2) {
                cachedData = buildMasterMaps(rawStart2);
                writeCache(MASTER_CACHE, cachedData);
            }
        }
        catch (err) {
            if (!cachedData) {
                cachedData = { ships: {}, items: {} };
            }
        }
    }
    return cachedData || { ships: {}, items: {} };
}
