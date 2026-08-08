import {
  DeckBuilderData,
  MasterData,
  ParsedData,
  ParsedFleet,
  ParsedShip,
  ParsedAirBase,
  CliOptions,
} from './types.js';

const MODE_MAP: Record<number, string> = {
  1: '出撃',
  2: '防空',
  3: '退避',
  4: '待機',
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

  if (options.fleet && Array.isArray(options.fleet)) {
    for (const num of options.fleet) {
      const fleetKey = `f${num}`;
      const fleetObj = rawData[fleetKey];
      if (!fleetObj || typeof fleetObj !== 'object') continue;

      const ships: ParsedShip[] = [];

      for (let sIdx = 1; sIdx <= 7; sIdx++) {
        const shipKey = `s${sIdx}`;
        const shipObj = fleetObj[shipKey];
        if (!shipObj || !shipObj.id) continue;

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
      if (!airObj || typeof airObj !== 'object') continue;

      const modeNum = airObj.mode || 1;
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
