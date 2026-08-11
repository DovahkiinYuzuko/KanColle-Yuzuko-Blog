---
source_file: "src/calculator.ts"
language: "TypeScript"
description: "Calculates Fighter Power (Air Superiority) and Formula 33 Effective Search Power for KanColle fleets."
tags: [@KcYamlCalculator]
exports:
  - calculateSlotFighterPower
  - calculateFleetFighterPower
  - calculateFleetSaku33
imports:
  - "src/types.ts"
---

# `src/calculator.ts` 仕様書

## 関数一覧

### (Function) `calculateSlotFighterPower`
* **説明:** 装備ID、改修値、熟練度、搭載数から1スロット分の制空値を計算します。水上偵察機(category 10)および艦上偵察機(category 9)は対空値が存在しても制空値計算対象外(0)として処理します。
* **引数:**
  * `itemId`: `number | undefined`
  * `rf`: `number | undefined`
  * `mas`: `number | undefined`
  * `slotCapacity`: `number`
  * `masterData`: `MasterData`
* **戻り値:** `number`

### (Function) `calculateFleetFighterPower`
* **説明:** 艦隊全体の合計制空値を算出します。
* **引数:**
  * `ships`: `DeckBuilderShip[]`
  * `masterData`: `MasterData`
* **戻り値:** `number`

### (Function) `calculateFleetSaku33`
* **説明:** 艦隊および司令部レベルから33式分岐点係数 (1, 2, 3, 4) の索敵スコアを算出します。
* **引数:**
  * `ships`: `DeckBuilderShip[]`
  * `hqlv`: `number`
  * `masterData`: `MasterData`
* **戻り値:** `{ c1: number; c2: number; c3: number; c4: number }`
