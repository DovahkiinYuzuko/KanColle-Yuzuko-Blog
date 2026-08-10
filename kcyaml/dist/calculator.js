import { Decimal } from 'decimal.js';
function getItemCategory(item) {
    if (item.typeId !== undefined && item.typeId > 0) {
        return item.typeId;
    }
    if (item.type && item.type.length >= 3) {
        return item.type[2];
    }
    return item.itype ?? 0;
}
/**
 * 装備の対空改修ボーナス (☆加算値)
 */
function getAaRefitBonus(category, rf, item) {
    if (!rf || rf <= 0)
        return new Decimal(0);
    // 艦戦(6), 水戦(45), 陸戦(26), 局戦(48)
    if ([6, 45, 26, 48].includes(category)) {
        return new Decimal(0.2).mul(rf);
    }
    // 対空値を持つ艦爆 (爆戦など)
    if (category === 7 && (item.taiku ?? 0) > 0) {
        return new Decimal(0.25).mul(rf);
    }
    // 陸攻(25)
    if (category === 25) {
        return new Decimal(0.5).mul(Decimal.sqrt(rf));
    }
    return new Decimal(0);
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
    const aaBonusDec = getAaRefitBonus(category, rf ?? 0, item);
    const totalAaDec = new Decimal(rawAa).add(aaBonusDec);
    const profBonus = getProficiencyBonus(category, mas ?? 0);
    const fpDec = totalAaDec.mul(Decimal.sqrt(slotCapacity)).add(profBonus);
    return fpDec.floor().toNumber();
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
 * 艦娘の素索敵値を計算 (作戦室/Jervis/シミュレーター公式)
 */
function getShipRawSaku(shipObj, masterData) {
    if (!shipObj || !shipObj.id)
        return new Decimal(0);
    const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
    const level = shipObj.lv || 1;
    if (!masterShip)
        return new Decimal(0);
    const minScout = masterShip.minScout ?? 0;
    const maxScout = masterShip.maxScout ?? 0;
    if (maxScout === 0)
        return new Decimal(0);
    if (level === 99) {
        return new Decimal(maxScout);
    }
    const diff = maxScout - minScout;
    const val = new Decimal(diff).mul(level).div(99).add(minScout);
    return val.floor();
}
/**
 * 改修による索敵加算ボーナス (bonusScout)
 */
function getBonusScout(category, rf) {
    if (!rf || rf <= 0)
        return new Decimal(0);
    const sqRf = Decimal.sqrt(rf);
    if (category === 12)
        return new Decimal(1.25).mul(sqRf); // 小型電探
    if (category === 13)
        return new Decimal(1.4).mul(sqRf); // 大型電探
    if (category === 10)
        return new Decimal(1.2).mul(sqRf); // 水上偵察機
    if (category === 11)
        return new Decimal(1.15).mul(sqRf); // 水上爆撃機
    if (category === 9)
        return new Decimal(1.2).mul(sqRf); // 艦上偵察機
    return new Decimal(0);
}
/**
 * 装備の索敵係数
 */
function getItemScoutCoefficient(category) {
    if (category === 8)
        return new Decimal(0.8); // 艦攻
    if (category === 9)
        return new Decimal(1.0); // 艦偵
    if (category === 10)
        return new Decimal(1.2); // 水偵
    if (category === 11)
        return new Decimal(1.1); // 水爆
    return new Decimal(0.6); // その他全装備
}
/**
 * 33式分岐点係数の索敵スコアを計算 (C1, C2, C3, C4)
 */
export function calculateFleetSaku33(ships, hqlv = 120, masterData) {
    let equipScoreTotalDec = new Decimal(0);
    let shipRawSakuSqrtTotalDec = new Decimal(0);
    let shipCount = 0;
    for (const shipObj of ships) {
        if (!shipObj || !shipObj.id)
            continue;
        shipCount++;
        const rawSakuDec = getShipRawSaku(shipObj, masterData);
        shipRawSakuSqrtTotalDec = shipRawSakuSqrtTotalDec.add(Decimal.sqrt(rawSakuDec));
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
                const bonusScoutDec = getBonusScout(category, rf);
                const coeffDec = getItemScoutCoefficient(category);
                const scoreDec = new Decimal(rawItemSaku).add(bonusScoutDec).mul(coeffDec);
                equipScoreTotalDec = equipScoreTotalDec.add(scoreDec);
            }
        }
    }
    const hqMod = Math.ceil(0.4 * hqlv);
    const fleetCountMod = 2 * (6 - Math.min(shipCount, 6));
    const baseScoreDec = shipRawSakuSqrtTotalDec.sub(hqMod).add(fleetCountMod);
    const calcCn = (cn) => {
        const totalDec = equipScoreTotalDec.mul(cn).add(baseScoreDec);
        // 作戦室 (kc-web / Jervis) 公式仕様: 小数点第3位以下切り捨て (Math.floor(score * 100) / 100)
        return totalDec.toDecimalPlaces(2, Decimal.ROUND_DOWN).toNumber();
    };
    return {
        c1: calcCn(1),
        c2: calcCn(2),
        c3: calcCn(3),
        c4: calcCn(4),
    };
}
