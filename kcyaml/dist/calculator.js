function getItemCategory(item) {
    if (item.itype !== undefined && item.itype > 0) {
        return item.itype;
    }
    if (item.type && item.type.length >= 3) {
        return item.type[2];
    }
    return 0;
}
/**
 * 装備の対空改修ボーナス (☆加算値)
 */
function getAaRefitBonus(category, rf, item) {
    if (!rf || rf <= 0)
        return 0;
    // 艦戦(6), 水戦(45), 陸戦(26), 局戦(48)
    if ([6, 45, 26, 48].includes(category)) {
        return 0.2 * rf;
    }
    // 対空値を持つ艦爆 (爆戦など)
    if (category === 7 && (item.taiku ?? 0) > 0) {
        return 0.25 * rf;
    }
    // 陸攻(25)
    if (category === 25) {
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
    const isFighter = [6, 45, 26, 48].includes(category);
    const isSeaplaneBomber = category === 11;
    const isAttackerOrBomber = [8, 7, 25].includes(category);
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
    const isAirEquip = [6, 7, 8, 9, 10, 11, 25, 26, 45, 48].includes(category);
    if (!isAirEquip || rawAa <= 0) {
        if (![6, 45, 26, 48].includes(category)) {
            return 0;
        }
    }
    const aaBonus = getAaRefitBonus(category, rf ?? 0, item);
    const totalAa = rawAa + aaBonus;
    const profBonus = getProficiencyBonus(category, mas ?? 0);
    return Math.floor(totalAa * Math.sqrt(slotCapacity) + profBonus);
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
 * 艦娘の素索敵値を計算 (作戦室/Jervis準拠)
 */
function getShipRawSaku(shipObj, masterData) {
    if (!shipObj || !shipObj.id)
        return 0;
    const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
    const level = shipObj.lv || 1;
    if (!masterShip)
        return 0;
    const minScout = masterShip.minScout ?? 0;
    const maxScout = masterShip.maxScout ?? 0;
    if (maxScout === 0)
        return 0;
    if (level === 99) {
        return maxScout;
    }
    return Math.floor((maxScout - minScout) * (level / 99) + minScout);
}
/**
 * 改修による索敵加算ボーナス (bonusScout)
 */
function getBonusScout(category, rf) {
    if (!rf || rf <= 0)
        return 0;
    const sqRf = Math.sqrt(rf);
    if (category === 12)
        return 1.25 * sqRf; // 小型電探
    if (category === 13)
        return 1.4 * sqRf; // 大型電探
    if (category === 10)
        return 1.2 * sqRf; // 水上偵察機
    if (category === 11)
        return 1.15 * sqRf; // 水上爆撃機
    if (category === 9)
        return 1.2 * sqRf; // 艦上偵察機
    return 0;
}
/**
 * 装備の索敵係数
 */
function getItemScoutCoefficient(category) {
    if (category === 8)
        return 0.8; // 艦攻
    if (category === 9)
        return 1.0; // 艦偵
    if (category === 10)
        return 1.2; // 水偵
    if (category === 11)
        return 1.1; // 水爆
    return 0.6; // その他全装備
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
                const rawItemSaku = masterItem.saku ?? 0;
                const rf = itemObj.rf ?? 0;
                const bonusScout = getBonusScout(category, rf);
                const coeff = getItemScoutCoefficient(category);
                const score = (rawItemSaku + bonusScout) * coeff;
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
