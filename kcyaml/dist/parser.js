const MODE_MAP = {
    0: '待機',
    1: '出撃',
    2: '防空',
    3: '退避',
    4: '休息',
};
function formatItemName(id, rf, masterItems) {
    if (!id || id <= 0)
        return null;
    const itemInfo = masterItems[id] || masterItems[String(id)];
    const name = itemInfo ? itemInfo.name : `Unknown Equipment (ID: ${id})`;
    if (rf && rf >= 1) {
        return `${name}☆${rf}`;
    }
    return name;
}
export function parseDeckBuilder(jsonText, options, masterData) {
    let rawData;
    try {
        rawData = JSON.parse(jsonText);
    }
    catch (err) {
        throw new Error('入力データのJSONパースに失敗しました。有効なDeck Builder形式テキストを指定してください。');
    }
    const result = {
        fleets: [],
        airBases: [],
    };
    if (options.fleet && Array.isArray(options.fleet)) {
        for (const num of options.fleet) {
            const fleetKey = `f${num}`;
            const fleetObj = rawData[fleetKey];
            if (!fleetObj || typeof fleetObj !== 'object')
                continue;
            const ships = [];
            for (let sIdx = 1; sIdx <= 7; sIdx++) {
                const shipKey = `s${sIdx}`;
                const shipObj = fleetObj[shipKey];
                if (!shipObj || !shipObj.id)
                    continue;
                const shipInfo = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
                const shipName = shipInfo ? shipInfo.name : `Unknown Ship (ID: ${shipObj.id})`;
                const level = shipObj.lv || 1;
                const equipments = [];
                if (shipObj.items && typeof shipObj.items === 'object') {
                    for (let iIdx = 1; iIdx <= 6; iIdx++) {
                        const itemKey = `i${iIdx}`;
                        const itemObj = shipObj.items[itemKey];
                        if (itemObj) {
                            const formatted = formatItemName(itemObj.id, itemObj.rf, masterData.items);
                            if (formatted)
                                equipments.push(formatted);
                        }
                    }
                    const ixObj = shipObj.items.ix || shipObj.items.slot_ex;
                    if (ixObj) {
                        const formatted = formatItemName(ixObj.id, ixObj.rf, masterData.items);
                        if (formatted)
                            equipments.push(formatted);
                    }
                }
                ships.push({
                    name: shipName,
                    level,
                    equipments,
                });
            }
            if (ships.length > 0) {
                result.fleets.push({
                    number: num,
                    ships,
                });
            }
        }
    }
    if (options.air && Array.isArray(options.air)) {
        for (const num of options.air) {
            const airKey = `a${num}`;
            const airObj = rawData[airKey];
            if (!airObj || typeof airObj !== 'object')
                continue;
            const modeNum = airObj.mode ?? 1;
            const modeStr = MODE_MAP[modeNum] || '出撃';
            const squadrons = [];
            if (airObj.items && typeof airObj.items === 'object') {
                for (let iIdx = 1; iIdx <= 4; iIdx++) {
                    const itemKey = `i${iIdx}`;
                    const itemObj = airObj.items[itemKey];
                    if (itemObj) {
                        const formatted = formatItemName(itemObj.id, itemObj.rf, masterData.items);
                        if (formatted)
                            squadrons.push(formatted);
                    }
                }
            }
            result.airBases.push({
                number: num,
                mode: modeStr,
                squadrons,
            });
        }
    }
    return result;
}
export function validateDeckBuilder(jsonText, options, masterData) {
    const issues = [];
    let rawData;
    try {
        rawData = JSON.parse(jsonText);
    }
    catch (err) {
        return {
            isValid: false,
            issues: [{ type: 'ERROR', message: '入力データが正当なJSON形式ではありません。' }],
        };
    }
    if (!rawData.f1 && !rawData.a1) {
        issues.push({ type: 'WARNING', message: 'Deck Builder の標準キー (f1 または a1) が検出されませんでした。' });
    }
    if (options.fleet) {
        for (const num of options.fleet) {
            const fleetObj = rawData[`f${num}`];
            if (!fleetObj) {
                issues.push({ type: 'WARNING', message: `指定された第${num}艦隊 (f${num}) がJSON内に存在しません。` });
                continue;
            }
            for (let sIdx = 1; sIdx <= 7; sIdx++) {
                const shipObj = fleetObj[`s${sIdx}`];
                if (!shipObj || !shipObj.id)
                    continue;
                if (!masterData.ships[shipObj.id] && !masterData.ships[String(shipObj.id)]) {
                    issues.push({ type: 'WARNING', message: `未登録の艦娘 ID を検出しました: ${shipObj.id} (第${num}艦隊 艦娘${sIdx})` });
                }
                if (shipObj.items && typeof shipObj.items === 'object') {
                    for (const key of Object.keys(shipObj.items)) {
                        const itemObj = shipObj.items[key];
                        if (itemObj && itemObj.id && !masterData.items[itemObj.id] && !masterData.items[String(itemObj.id)]) {
                            issues.push({ type: 'WARNING', message: `未登録の装備 ID を検出しました: ${itemObj.id} (第${num}艦隊 艦娘${sIdx} スロット ${key})` });
                        }
                    }
                }
            }
        }
    }
    return {
        isValid: issues.filter(i => i.type === 'ERROR').length === 0,
        issues,
    };
}
