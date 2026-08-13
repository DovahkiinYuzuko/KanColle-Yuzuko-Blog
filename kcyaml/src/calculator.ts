import { Decimal } from 'decimal.js';
import { DeckBuilderShip, MasterData, MasterItem } from './types.js';

function getItemCategory(item: MasterItem): number {
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
function getAaRefitBonus(category: number, rf: number, item: MasterItem): Decimal {
  if (!rf || rf <= 0) return new Decimal(0);

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
 * 熟練度 (mas) による内部熟練度経験値および固定制空ボーナス
 * 制空権シミュレータ (kc-web) 公式計算方式
 */
function getProficiencyBonusDecimal(category: number, mas: number): { internalProf: Decimal; fixedBonus: number } {
  if (!mas || mas <= 0) {
    return { internalProf: new Decimal(0), fixedBonus: 0 };
  }

  const m = Math.min(mas, 7);
  const isFighter = [6, 45, 26, 48].includes(category);
  const isSeaplaneBomber = category === 11;
  const isAttackerOrBomber = [8, 7, 25].includes(category);

  if (isFighter) {
    const internalProfTable = [0, 10, 25, 40, 55, 70, 85, 120];
    const table = [0, 0, 1, 4, 7, 12, 12, 22];
    return { internalProf: new Decimal(internalProfTable[m] || 0), fixedBonus: table[m] || 0 };
  }
  if (isSeaplaneBomber) {
    const internalProfTable = [0, 10, 25, 40, 55, 70, 85, 120];
    const table = [0, 0, 0, 0, 0, 1, 1, 6];
    return { internalProf: new Decimal(internalProfTable[m] || 0), fixedBonus: table[m] || 0 };
  }
  if (isAttackerOrBomber) {
    // 艦攻 / 艦爆 / 陸攻: MAX時の内部熟練度は 100 (sqrt(100/10) = sqrt(10) ≈ 3.162)
    const internalProfTable = [0, 10, 25, 40, 55, 70, 85, 100];
    return { internalProf: new Decimal(internalProfTable[m] || 0), fixedBonus: 0 };
  }

  return { internalProf: new Decimal(0), fixedBonus: 0 };
}

/**
 * 1スロットの制空値を計算
 */
export function calculateSlotFighterPower(
  itemId: number | undefined,
  rf: number | undefined,
  mas: number | undefined,
  slotCapacity: number,
  masterData: MasterData,
  exactMas: boolean = false
): number {
  if (!itemId || itemId <= 0 || slotCapacity <= 0) return 0;

  const item = masterData.items[itemId] || masterData.items[String(itemId)];
  if (!item) return 0;

  const category = getItemCategory(item);
  const rawAa = item.taiku ?? 0;

  // 航空戦時の制空値計算対象装備カテゴリ (6:艦戦, 7:艦爆, 8:艦攻, 11:水爆, 25:陸攻, 26:陸戦, 45:水戦, 48:局戦)
  // 水上偵察機(10)および艦上偵察機(9)は対空値が存在しても制空値計算対象外(0)
  const isAirEquip = [6, 7, 8, 11, 25, 26, 45, 48].includes(category);

  if (!isAirEquip) {
    return 0;
  }

  const aaBonusDec = getAaRefitBonus(category, rf ?? 0, item);
  const totalAaDec = new Decimal(rawAa).add(aaBonusDec);

  // 制空権シミュレータ (kc-web) 互換仕様:
  // exactMas オプションが指定されていない場合は、デフォルトで熟練度 MAX (7) とみなして計算する
  const effectiveMas = exactMas ? (mas ?? 0) : 7;
  const { internalProf, fixedBonus } = getProficiencyBonusDecimal(category, effectiveMas);

  const fpAaDec = totalAaDec.mul(Decimal.sqrt(slotCapacity));
  const profSqrtDec = internalProf.gt(0) ? Decimal.sqrt(internalProf.div(10)) : new Decimal(0);

  const slotFpDec = fpAaDec.add(profSqrtDec).floor().add(fixedBonus);
  return slotFpDec.toNumber();
}

/**
 * 艦隊の合計制空値を計算
 */
export function calculateFleetFighterPower(
  ships: DeckBuilderShip[],
  masterData: MasterData,
  exactMas: boolean = false
): number {
  let total = 0;

  for (const shipObj of ships) {
    if (!shipObj || !shipObj.id) continue;
    const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
    const maxeq = masterShip?.maxeq || [];

    if (shipObj.items && typeof shipObj.items === 'object') {
      const keys = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6'];
      for (let idx = 0; idx < keys.length; idx++) {
        const itemObj = shipObj.items[keys[idx]];
        if (itemObj && itemObj.id) {
          const cap = maxeq[idx] ?? 0;
          total += calculateSlotFighterPower(itemObj.id, itemObj.rf, itemObj.mas, cap, masterData, exactMas);
        }
      }
    }
  }

  return total;
}

/**
 * 艦娘の素索敵値を計算 (作戦室/Jervis/シミュレーター公式)
 */
function getShipRawSaku(shipObj: DeckBuilderShip, masterData: MasterData): Decimal {
  if (!shipObj || !shipObj.id) return new Decimal(0);
  const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
  const level = shipObj.lv || 1;

  if (!masterShip) return new Decimal(0);

  const minScout = masterShip.minScout ?? 0;
  const maxScout = masterShip.maxScout ?? 0;

  if (maxScout === 0) return new Decimal(0);

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
function getBonusScout(category: number, rf: number): Decimal {
  if (!rf || rf <= 0) return new Decimal(0);
  const sqRf = Decimal.sqrt(rf);

  if (category === 12) return new Decimal(1.25).mul(sqRf); // 小型電探
  if (category === 13) return new Decimal(1.4).mul(sqRf);  // 大型電探
  if (category === 10) return new Decimal(1.2).mul(sqRf);  // 水上偵察機
  if (category === 11) return new Decimal(1.15).mul(sqRf); // 水上爆撃機
  if (category === 9)  return new Decimal(1.2).mul(sqRf);  // 艦上偵察機

  return new Decimal(0);
}

/**
 * 装備の索敵係数
 */
function getItemScoutCoefficient(category: number): Decimal {
  if (category === 8)  return new Decimal(0.8); // 艦攻
  if (category === 9)  return new Decimal(1.0); // 艦偵
  if (category === 10) return new Decimal(1.2); // 水偵
  if (category === 11) return new Decimal(1.1); // 水爆

  return new Decimal(0.6); // その他全装備
}

/**
 * 33式分岐点係数の索敵スコアを計算 (C1, C2, C3, C4)
 * 単一艦隊 (DeckBuilderShip[]) または 複数艦隊/連合艦隊 (DeckBuilderShip[][]) に対応
 */
export function calculateFleetSaku33(
  shipsInput: DeckBuilderShip[] | DeckBuilderShip[][],
  hqlv: number = 120,
  masterData: MasterData
): { c1: number; c2: number; c3: number; c4: number } {
  let equipScoreTotalDec = new Decimal(0);
  let shipRawSakuSqrtTotalDec = new Decimal(0);
  let fleetCountMod = 0;

  const fleetList: DeckBuilderShip[][] = Array.isArray(shipsInput[0])
    ? (shipsInput as DeckBuilderShip[][])
    : [(shipsInput as DeckBuilderShip[])];

  for (const fleetShips of fleetList) {
    let validShipCountInFleet = 0;

    for (const shipObj of fleetShips) {
      if (!shipObj || !shipObj.id) continue;
      validShipCountInFleet++;

      const rawSakuDec = getShipRawSaku(shipObj, masterData);
      shipRawSakuSqrtTotalDec = shipRawSakuSqrtTotalDec.add(Decimal.sqrt(rawSakuDec));

      if (shipObj.items && typeof shipObj.items === 'object') {
        for (const key of Object.keys(shipObj.items)) {
          const itemObj = shipObj.items[key];
          if (!itemObj || !itemObj.id) continue;

          const masterItem = masterData.items[itemObj.id] || masterData.items[String(itemObj.id)];
          if (!masterItem) continue;

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

    fleetCountMod += 2 * (6 - Math.min(validShipCountInFleet, 6));
  }

  const hqMod = Math.ceil(0.4 * hqlv);
  const baseScoreDec = shipRawSakuSqrtTotalDec.sub(hqMod).add(fleetCountMod);

  const calcCn = (cn: number) => {
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

/**
 * 艦娘のLv成長ステータスを計算 (回避, 索敵, 対潜)
 * 先人の計算式 (制空権シミュレータ / 作戦室 Jervis / 艦これWiki 準拠)
 * 公式: Math.floor(min + (max - min) * lv / 99)
 */
function calculateShipGrowthStat(minVal: number, maxVal: number, lv: number): number {
  if (maxVal === 0 && minVal === 0) return 0;
  if (lv === 99) return maxVal;
  return Math.floor(minVal + ((maxVal - minVal) * lv) / 99);
}

/**
 * gkcoi 画像生成用に艦娘オブジェクトの戦闘ステータスを完全な状態に自動補完する。
 * 先人の計算式および丸め位置をそのまま適用。
 */
export function enrichShipForGkcoi(
  shipObj: DeckBuilderShip,
  masterData: MasterData
): DeckBuilderShip {
  if (!shipObj || !shipObj.id) return shipObj;

  const masterShip = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
  const lv = shipObj.lv || 1;

  // 1. 各装備のステータス合算
  let equipFp = 0;
  let equipTp = 0;
  let equipAa = 0;
  let equipAr = 0;
  let equipEv = 0;
  let equipLos = 0;
  let equipAsw = 0;

  if (shipObj.items && typeof shipObj.items === 'object') {
    for (const key of Object.keys(shipObj.items)) {
      const item = shipObj.items[key];
      if (!item || !item.id) continue;
      const mItem = masterData.items[item.id] || masterData.items[String(item.id)];
      if (mItem) {
        equipFp += mItem.firepower ?? (mItem as any).fire ?? 0;
        equipTp += mItem.torpedo ?? 0;
        equipAa += mItem.taiku ?? (mItem as any).antiAir ?? 0;
        equipAr += mItem.armor ?? 0;
        equipEv += mItem.evasion ?? (mItem as any).avoid ?? 0;
        equipLos += mItem.saku ?? (mItem as any).scout ?? 0;
        equipAsw += mItem.asw ?? 0;
      }
    }
  }

  // 2. 艦船の素ステータス算出 (近代化改修MAX前提)
  const baseHp = masterShip?.hp ?? 0;
  const baseLuck = masterShip?.luck ?? 0;
  const maxFp = masterShip?.firepower ?? (masterShip as any)?.fire ?? 0;
  const maxTp = masterShip?.torpedo ?? 0;
  const maxAa = masterShip?.antiAir ?? (masterShip as any)?.taiku ?? 0;
  const maxAr = masterShip?.armor ?? 0;

  const rawEv = calculateShipGrowthStat(masterShip?.minAvoid ?? (masterShip as any)?.min_avoid ?? 0, masterShip?.maxAvoid ?? (masterShip as any)?.avoid ?? 0, lv);
  const rawLos = calculateShipGrowthStat(masterShip?.minScout ?? (masterShip as any)?.min_scout ?? 0, masterShip?.maxScout ?? (masterShip as any)?.scout ?? 0, lv);
  const rawAsw = calculateShipGrowthStat(masterShip?.minAsw ?? (masterShip as any)?.min_asw ?? 0, masterShip?.maxAsw ?? (masterShip as any)?.asw ?? 0, lv);

  // 3. 補完値を設定 (入力JSONに明示的な有効値があるものは優先)
  const finalHp = shipObj.hp && shipObj.hp > 0 ? shipObj.hp : baseHp;
  const finalLuck = shipObj.luck !== undefined && shipObj.luck > 0 ? shipObj.luck : (baseLuck > 0 ? baseLuck : 0);

  const finalFp = shipObj.fp !== undefined ? shipObj.fp : (maxFp + equipFp);
  const finalTp = shipObj.tp !== undefined ? shipObj.tp : (maxTp + equipTp);
  const finalAa = shipObj.aa !== undefined ? shipObj.aa : (maxAa + equipAa);
  const finalAr = shipObj.ar !== undefined ? shipObj.ar : (maxAr + equipAr);
  const finalEv = shipObj.ev !== undefined ? shipObj.ev : (rawEv + equipEv);
  const finalLos = shipObj.los !== undefined ? shipObj.los : (rawLos + equipLos);
  const finalAsw = shipObj.asw !== undefined && shipObj.asw > 0 ? shipObj.asw : (rawAsw + equipAsw);

  return {
    ...shipObj,
    hp: finalHp,
    luck: finalLuck,
    fp: finalFp,
    tp: finalTp,
    aa: finalAa,
    ar: finalAr,
    ev: finalEv,
    los: finalLos,
    asw: finalAsw,
  };
}

