import {
  DeckBuilderData,
  DeckBuilderShip,
  MasterData,
  ParsedData,
  ParsedFleet,
  ParsedShip,
  ParsedAirBase,
  CliOptions,
  ValidationReport,
  ValidationIssue,
} from './types.js';
import { calculateFleetFighterPower, calculateFleetSaku33 } from './calculator.js';

const MODE_MAP: Record<number, string> = {
  0: '待機',
  1: '出撃',
  2: '防空',
  3: '退避',
  4: '休息',
};

function formatItemName(id: number | undefined, rf: number | undefined, masterItems: MasterData['items']): string | null {
  if (!id || id <= 0) return null;

  const itemInfo = masterItems[id] || masterItems[String(id)];
  const name = itemInfo ? itemInfo.name : `Unknown Equipment (ID: ${id})`;

  if (rf && rf >= 1) {
    return `${name}☆${rf}`;
  }
  return name;
}

export function parseDeckBuilder(
  jsonText: string,
  options: CliOptions,
  masterData: MasterData
): ParsedData {
  let rawData: DeckBuilderData;
  try {
    rawData = JSON.parse(jsonText);
  } catch (err) {
    throw new Error('入力データのJSONパースに失敗しました。有効なDeck Builder形式テキストを指定してください。');
  }

  const result: ParsedData = {
    fleets: [],
    airBases: [],
  };

  const hqlv = rawData.hqlv || 120;

  if (options.fleet && Array.isArray(options.fleet)) {
    const rawShipsListPerFleet: DeckBuilderShip[][] = [];

    for (const num of options.fleet) {
      const fleetKey = `f${num}`;
      const fleetObj = rawData[fleetKey];
      if (!fleetObj || typeof fleetObj !== 'object') continue;

      const ships: ParsedShip[] = [];
      const rawShips: DeckBuilderShip[] = [];

      for (let sIdx = 1; sIdx <= 7; sIdx++) {
        const shipKey = `s${sIdx}`;
        const shipObj: DeckBuilderShip = fleetObj[shipKey];
        if (!shipObj || !shipObj.id) continue;

        rawShips.push(shipObj);

        const shipInfo = masterData.ships[shipObj.id] || masterData.ships[String(shipObj.id)];
        const shipName = shipInfo ? shipInfo.name : `Unknown Ship (ID: ${shipObj.id})`;
        const level = shipObj.lv || 1;

        const equipments: string[] = [];

        if (shipObj.items && typeof shipObj.items === 'object') {
          for (let iIdx = 1; iIdx <= 6; iIdx++) {
            const itemKey = `i${iIdx}`;
            const itemObj = shipObj.items[itemKey];
            if (itemObj) {
              const formatted = formatItemName(itemObj.id, itemObj.rf, masterData.items);
              if (formatted) equipments.push(formatted);
            }
          }

          const ixObj = shipObj.items.ix || (shipObj.items as any).slot_ex;
          if (ixObj) {
            const formatted = formatItemName(ixObj.id, ixObj.rf, masterData.items);
            if (formatted) equipments.push(formatted);
          }
        }

        ships.push({
          name: shipName,
          level,
          equipments,
          id: shipObj.id,
          rawShipObj: shipObj,
        });
      }

      if (ships.length > 0) {
        const fighterPower = calculateFleetFighterPower(rawShips, masterData, options.exactMas);
        const saku33 = calculateFleetSaku33(rawShips, hqlv, masterData);

        result.fleets.push({
          number: num,
          ships,
          fighterPower,
          saku33,
        });
        rawShipsListPerFleet.push(rawShips);
      }
    }

    if (options.rengo || result.fleets.length > 1) {
      result.combinedFighterPower = result.fleets[0]?.fighterPower ?? 0;
      let c1 = 0, c2 = 0, c3 = 0, c4 = 0;
      for (const f of result.fleets) {
        if (f.saku33) {
          c1 += f.saku33.c1;
          c2 += f.saku33.c2;
          c3 += f.saku33.c3;
          c4 += f.saku33.c4;
        }
      }
      result.combinedSaku33 = {
        c1: Number(c1.toFixed(2)),
        c2: Number(c2.toFixed(2)),
        c3: Number(c3.toFixed(2)),
        c4: Number(c4.toFixed(2)),
      };
    }
  }

  if (options.air && Array.isArray(options.air)) {
    for (const num of options.air) {
      const airKey = `a${num}`;
      const airObj = rawData[airKey];
      if (!airObj || typeof airObj !== 'object') continue;

      const modeNum = airObj.mode ?? 1;
      const modeStr = MODE_MAP[modeNum] || '出撃';
      const squadrons: string[] = [];

      if (airObj.items && typeof airObj.items === 'object') {
        for (let iIdx = 1; iIdx <= 4; iIdx++) {
          const itemKey = `i${iIdx}`;
          const itemObj = airObj.items[itemKey];
          if (itemObj) {
            const formatted = formatItemName(itemObj.id, itemObj.rf, masterData.items);
            if (formatted) squadrons.push(formatted);
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

export function validateDeckBuilder(
  jsonText: string,
  options: CliOptions,
  masterData: MasterData
): ValidationReport {
  const issues: ValidationIssue[] = [];

  let rawData: DeckBuilderData;
  try {
    rawData = JSON.parse(jsonText);
  } catch (err) {
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
        if (!shipObj || !shipObj.id) continue;

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
