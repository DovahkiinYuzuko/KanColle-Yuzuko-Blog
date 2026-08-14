import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadAppConfig } from './configManager.js';
const DEFAULT_MASTER_JSON_URL = 'https://firebasestorage.googleapis.com/v0/b/development-74af0.appspot.com/o/master.json?alt=media';
const DEFAULT_START2_URL = 'https://raw.githubusercontent.com/noro6/kc-web/main/public/START2.json';
const CACHE_DIR = path.join(os.tmpdir(), 'kcyaml-cache');
const MASTER_CACHE = path.join(CACHE_DIR, 'kcweb_master.json');
const FIT_BONUS_CACHE = path.join(CACHE_DIR, 'fit_bonus.json');
const DEFAULT_FIT_BONUS_URL = 'https://raw.githubusercontent.com/noro6/kc-web/main/public/bonus.json';
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
            const parsed = JSON.parse(data);
            if (parsed && parsed.items && typeof parsed.items === 'object') {
                const firstKey = Object.keys(parsed.items)[0];
                if (firstKey && (parsed.items[firstKey].typeId === undefined || parsed.items[firstKey].firepower === undefined || parsed.items[firstKey].taiku === undefined || parsed.items[firstKey].itype === undefined || parsed.items[firstKey].itype === 0)) {
                    // 古いキャッシュのため無効化
                    return null;
                }
                if (parsed.items['173'] && parsed.items['173'].evasion === 0) {
                    return null;
                }
            }
            if (parsed && parsed.ships && typeof parsed.ships === 'object') {
                const firstShipKey = Object.keys(parsed.ships)[0];
                if (firstShipKey && (parsed.ships[firstShipKey].firepower === undefined || parsed.ships[firstShipKey].shipClass === undefined)) {
                    return null;
                }
            }
            return parsed;
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
    // 1. master.json format (ships array)
    if (rawMaster && Array.isArray(rawMaster.ships)) {
        for (const s of rawMaster.ships) {
            if (s && s.id && s.name) {
                ships[String(s.id)] = {
                    name: s.name,
                    stype: s.type ?? s.stype,
                    shipClass: s.type2 ?? s.ctype ?? s.class ?? s.shipClass ?? 0,
                    minScout: s.minScout ?? s.min_scout ?? 0,
                    maxScout: s.maxScout ?? s.scout ?? 0,
                    minAvoid: s.minAvoid ?? s.min_avoid ?? 0,
                    maxAvoid: s.maxAvoid ?? s.avoid ?? 0,
                    minAsw: s.minAsw ?? s.min_asw ?? 0,
                    maxAsw: s.maxAsw ?? s.asw ?? 0,
                    firepower: s.firepower ?? s.fire ?? 0,
                    torpedo: s.torpedo ?? 0,
                    antiAir: s.antiAir ?? s.anti_air ?? 0,
                    armor: s.armor ?? 0,
                    hp: s.hp ?? 0,
                    luck: s.luck ?? 0,
                    maxeq: Array.isArray(s.slots) ? s.slots : (Array.isArray(s.maxeq) ? s.maxeq : []),
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
                    shipClass: s.api_ctype ?? 0,
                    minScout: 0,
                    maxScout: 0,
                    minAvoid: 0,
                    maxAvoid: 0,
                    minAsw: 0,
                    maxAsw: 0,
                    firepower: Array.isArray(s.api_houg) ? s.api_houg[1] ?? 0 : 0,
                    torpedo: Array.isArray(s.api_raig) ? s.api_raig[1] ?? 0 : 0,
                    antiAir: Array.isArray(s.api_tyku) ? s.api_tyku[1] ?? 0 : 0,
                    armor: Array.isArray(s.api_souk) ? s.api_souk[1] ?? 0 : 0,
                    hp: Array.isArray(s.api_taik) ? s.api_taik[0] ?? 0 : 0,
                    luck: Array.isArray(s.api_luck) ? s.api_luck[0] ?? 0 : 0,
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
                    taiku: i.antiAir ?? i.anti_air ?? 0,
                    saku: i.scout ?? 0,
                    firepower: i.fire ?? 0,
                    torpedo: i.torpedo ?? 0,
                    armor: i.armor ?? 0,
                    asw: i.asw ?? 0,
                    evasion: (i.avoid2 !== undefined && i.avoid2 !== 0) ? i.avoid2 : (i.avoid ?? 0),
                    typeId: i.type ?? 0,
                    itype: i.itype ?? i.icon ?? 0,
                    type: [0, 0, i.type ?? 0, i.itype ?? i.icon ?? 0],
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
                    type: Array.isArray(i.api_type) ? i.api_type : [],
                };
            }
        }
    }
    return { ships, items };
}
/**
 * リモートから装備フィットボーナスマスタを取得またはキャッシュからロード
 */
export async function loadFitBonusData(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = readCache(FIT_BONUS_CACHE);
        if (cached)
            return cached;
    }
    try {
        const raw = await fetchWithTimeout(DEFAULT_FIT_BONUS_URL, 1500);
        if (raw) {
            writeCache(FIT_BONUS_CACHE, raw);
            return raw;
        }
    }
    catch (err) {
        // ネットワーク失敗時は既存キャッシュへフォールバック
        const cached = readCache(FIT_BONUS_CACHE);
        if (cached)
            return cached;
    }
    return null;
}
export async function loadMasterData(forceRefresh = false, customUrl) {
    const config = loadAppConfig();
    const targetUrl = customUrl || config.urls?.masterJsonUrl || DEFAULT_MASTER_JSON_URL;
    // 1. キャッシュから読み込み (forceRefresh でない場合)
    if (!forceRefresh) {
        const cached = readCache(MASTER_CACHE);
        if (cached) {
            const fitBonus = await loadFitBonusData(false);
            return { ...cached, fitBonus };
        }
    }
    // 2. リモートから短時間タイムアウトで取得を試みる
    try {
        const rawData = await fetchWithTimeout(targetUrl, 1500);
        const mapped = buildMasterMaps(rawData);
        if (Object.keys(mapped.ships).length > 0) {
            writeCache(MASTER_CACHE, mapped);
            const fitBonus = await loadFitBonusData(forceRefresh);
            return { ...mapped, fitBonus };
        }
    }
    catch (err) {
        // START2.json フォールバック
        try {
            const start2Url = config.urls?.start2Url || DEFAULT_START2_URL;
            const rawStart2 = await fetchWithTimeout(start2Url, 1500);
            const mapped = buildMasterMaps(rawStart2);
            if (Object.keys(mapped.ships).length > 0) {
                writeCache(MASTER_CACHE, mapped);
                const fitBonus = await loadFitBonusData(forceRefresh);
                return { ...mapped, fitBonus };
            }
        }
        catch { }
    }
    // 3. リモート失敗時はキャッシュを最終フォールバック
    const fallbackCached = readCache(MASTER_CACHE);
    if (fallbackCached) {
        const fitBonus = await loadFitBonusData(false);
        return { ...fallbackCached, fitBonus };
    }
    const emptyFit = await loadFitBonusData(false);
    return { ships: {}, items: {}, fitBonus: emptyFit };
}
