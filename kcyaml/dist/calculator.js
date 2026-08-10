// 装備カテゴリID (api_type[2] または api_type[3])
const TYPE_KAN_SEN = 6; // 艦上戦闘機
const TYPE_KAN_BAKU = 7; // 艦上爆撃機
const TYPE_KAN_KO = 8; // 艦上攻撃機
const TYPE_KAN_SAKU = 9; // 艦上偵察機
const TYPE_SUI_SAKU = 10; // 水上偵察機
const TYPE_SUI_BAKU = 11; // 水上爆撃機
const TYPE_SMALL_RADAR = 12; // 小型電探
const TYPE_LARGE_RADAR = 13; // 大型電探
const TYPE_RIKU_KOU = 25; // 陸上攻撃機
const TYPE_RIKU_SEN = 26; // 陸上戦闘機 / 局地戦闘機
const TYPE_SUI_SEN = 45; // 水上戦闘機
const TYPE_KYOKU_SEN = 48; // 局地戦闘機
function getItemCategory(item) {
    if (item.type && item.type.length >= 3) {
        return item.type[2];
    }
    if (item.type && item.type.length >= 4) {
        return item.type[3];
    }
    return 0;
}
/**
 * 装備の対空改修ボーナス (☆加算値)
 */
function getAaRefitBonus(category, rf, item) {
    if (!rf || rf <= 0)
        return 0;
    // 艦戦, 水戦, 陸戦, 局戦
    if ([TYPE_KAN_SEN, TYPE_SUI_SEN, TYPE_RIKU_SEN, TYPE_KYOKU_SEN].includes(category)) {
        return 0.2 * rf;
    }
    // 対空値を持つ艦爆 (爆戦など)
    if (category === TYPE_KAN_BAKU && (item.taiku ?? 0) > 0) {
        return 0.25 * rf;
    }
    // 陸攻
    if (category === TYPE_RIKU_KOU) {
        return 0.5 * Math.sqrt(rf);
    }
    return 0;
}
/**
 * 熟練度 (mas) ボーナス
 */
function getProficiencyBonus(category, mas) {
    if (!mas || mas <= 0)
        return 0;
    // 熟練度レベルテーブル (mas 1〜7)
    const isFighter = [TYPE_KAN_SEN, TYPE_SUI_SEN, TYPE_RIKU_SEN, TYPE_KYOKU_SEN].includes(category);
    const isSeaplaneBomber = category === TYPE_SUI_BAKU;
    const isAttackerOrBomber = [TYPE_KAN_KO, TYPE_KAN_BAKU, TYPE_RIKU_KOU].includes(category);
    if (isFighter) {
        const table = [0, 1, 4, 6, 9, 14, 14, 25];
        return table[Math.min(mas, 7)] || 0;
    }
    if (isSeaplaneBomber) {
        const table = [0, 1, 1, 1, 1, 3, 3, 9];
        return table[Math.min(mas, 7)] || 0;
    }
    if (isAttackerOrBomber) {
        const table = [0, 0, 0, 0, 0, 1, 1, 3];
        return table[Math.min(mas, 7)] || 0;
    }
    return 0;
}
/**
 * 1スロットの制空値を計算
 */
export function calculateSlotFighterPower(itemId, rf, mas, slotCapacity, masterData) {
    if (!itemId || itemId <= 0 || slotCapacity <= 0)
        return 0;
    const item = masterData.items[itemId] || masterData.items[String(itemId)];
    if (!item)
        return 0;
    const category = getItemCategory(item);
    const rawAa = item.taiku ?? 0;
    // 制空に関与する装備タイプか確認
    const isAirEquip = [
        TYPE_KAN_SEN,
        TYPE_KAN_BAKU,
        TYPE_KAN_KO,
        TYPE_SUI_SAKU,
        TYPE_SUI_BAKU,
        TYPE_RIKU_KOU,
        TYPE_RIKU_SEN,
        TYPE_SUI_SEN,
        TYPE_KYOKU_SEN,
    ].includes(category);
    if (!isAirEquip || rawAa <= 0) {
        if (![TYPE_KAN_SEN, TYPE_SUI_SEN, TYPE_RIKU_SEN, TYPE_KYOKU_SEN].includes(category)) {
            return 0;
        }
    }
    const aaBonus = getAaRefitBonus(category, rf ?? 0, item);
    const totalAa = rawAa + aaBonus;
    const profBonus = getProficiencyBonus(category, mas ?? 0);
    const fp = Math.floor(totalAa * Math.sqrt(slotCapacity) + profBonus);
    return fp;
}
/**
 * 艦隊の合計制空値を計算
 */
export function calculateFleetFighterPower(ships, masterData) {
    let total = 0;
    for (const shipObj of ships) {
        if (!shipObj || !shipObj.id)
            continue;
        const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
        const maxeq = masterShip?.maxeq || [];
        if (shipObj.items && typeof shipObj.items === 'object') {
            const keys = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'];
            for (let idx = 0; idx < keys.length; idx++) {
                const itemObj = shipObj.items[keys[idx]];
                if (itemObj && itemObj.id) {
                    const cap = maxeq[idx] ?? 0;
                    total += calculateSlotFighterPower(itemObj.id, itemObj.rf, itemObj.mas, cap, masterData);
                }
            }
        }
    }
    return total;
}
/**
 * 艦娘の推定素索敵値を計算
 */
function getShipRawSaku(shipObj, masterData) {
    if (!shipObj || !shipObj.id)
        return 0;
    const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
    const level = shipObj.lv || 1;
    let minSaku = 0;
    let maxSaku = 0;
    if (masterShip && masterShip.saku && Array.isArray(masterShip.saku)) {
        minSaku = masterShip.saku[0] || 0;
        maxSaku = masterShip.saku[1] || 0;
    }
    if (maxSaku === 0)
        return 0;
    // 線形補間: Math.floor(min + (max - min) * (level / 99))
    const estimated = Math.floor(minSaku + (maxSaku - minSaku) * (level / 99));
    return estimated;
}
/**
 * 33式分岐点係数の索敵スコアを計算 (C1, C2, C3, C4)
 */
export function calculateFleetSaku33(ships, hqlv = 120, masterData) {
    let equipScoreTotal = 0;
    let shipRawSakuSqrtTotal = 0;
    let shipCount = 0;
    for (const shipObj of ships) {
        if (!shipObj || !shipObj.id)
            continue;
        shipCount++;
        const rawSaku = getShipRawSaku(shipObj, masterData);
        shipRawSakuSqrtTotal += Math.sqrt(rawSaku);
        if (shipObj.items && typeof shipObj.items === 'object') {
            for (const key of Object.keys(shipObj.items)) {
                const itemObj = shipObj.items[key];
                if (!itemObj || !itemObj.id)
                    continue;
                const masterItem = masterData.items[itemObj.id] || masterData.items[String(itemObj.id)];
                if (!masterItem)
                    continue;
                const category = getItemCategory(masterItem);
                const itemSaku = masterItem.saku ?? 0;
                const rf = itemObj.rf ?? 0;
                let equipCoeff = 0.6; // デフォルト 0.6
                let refitCoeff = 0.0; // デフォルト 0.0
                switch (category) {
                    case TYPE_SUI_SAKU: // 水上偵察機
                        equipCoeff = 1.2;
                        refitCoeff = 1.2;
                        break;
                    case TYPE_SUI_BAKU: // 水上爆撃機
                        equipCoeff = 1.1;
                        refitCoeff = 1.15;
                        break;
                    case TYPE_KAN_SAKU: // 艦上偵察機
                        equipCoeff = 1.0;
                        refitCoeff = 1.2;
                        break;
                    case TYPE_KAN_KO: // 艦上攻撃機
                        equipCoeff = 0.8;
                        refitCoeff = 0.0;
                        break;
                    case TYPE_SMALL_RADAR: // 小型電探
                        equipCoeff = 0.6;
                        refitCoeff = 1.25;
                        break;
                    case TYPE_LARGE_RADAR: // 大型電探
                        equipCoeff = 0.6;
                        refitCoeff = 1.4;
                        break;
                    default:
                        equipCoeff = 0.6;
                        refitCoeff = 0.0;
                        break;
                }
                const score = equipCoeff * (itemSaku + refitCoeff * Math.sqrt(rf));
                equipScoreTotal += score;
            }
        }
    }
    const hqMod = Math.ceil(0.4 * hqlv);
    const fleetCountMod = 2 * (6 - Math.min(shipCount, 6));
    const baseScore = shipRawSakuSqrtTotal - hqMod + fleetCountMod;
    const calcCn = (cn) => {
        const total = cn * equipScoreTotal + baseScore;
        return Math.round(total * 100) / 100;
    };
    return {
        c1: calcCn(1),
        c2: calcCn(2),
        c3: calcCn(3),
        c4: calcCn(4),
    };
}
