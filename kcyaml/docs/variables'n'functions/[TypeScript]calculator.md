---
source_file: "kcyaml/src/calculator.ts"
language: "TypeScript"
description: "Calculates Fighter Power (Air Superiority), Formula 33 Effective Search Power, and Ship Fit Bonuses for KanColle fleets."
tags: [@KcYamlCalculator]
exports:
  - calculateSlotFighterPower
  - calculateFleetFighterPower
  - calculateFleetSaku33
  - calculateShipFitBonus
  - enrichShipForGkcoi
imports:
  - "kcyaml/src/types.ts"
---

# `src/calculator.ts` 仕様書

## 関数一覧

### (Function) `calculateSlotFighterPower`
* **説明:** 装備ID、改修値、熟練度、搭載数から1スロット分の制空値を計算します。水上偵察機(category 10)および艦上偵察機(category 9)は対空値が存在しても制空値計算対象外(0)として処理します。デフォルトで熟練度はMAX(7)として計算し、`exactMas` が true の場合のみ実測値を使用します。
* **引数:**
  * `itemId`: `number | undefined`
  * `rf`: `number | undefined`
  * `mas`: `number | undefined`
  * `slotCapacity`: `number`
  * `masterData`: `MasterData`
  * `exactMas`: `boolean | undefined`
* **戻り値:** `number`

### (Function) `calculateFleetFighterPower`
* **説明:** 艦隊全体の合計制空値を算出します。
* **引数:**
  * `ships`: `DeckBuilderShip[]`
  * `masterData`: `MasterData`
  * `exactMas`: `boolean | undefined`
* **戻り値:** `number`

### (Function) `calculateFleetSaku33`
* **説明:** 艦隊および司令部レベルから33式分岐点係数 (1, 2, 3, 4) の索敵スコアを `Decimal` 高精度演算で算出します。単一艦隊 (`DeckBuilderShip[]`) または連合艦隊などの複数艦隊 (`DeckBuilderShip[][]`) に対応します。
* **引数:**
  * `ships`: `DeckBuilderShip[] | DeckBuilderShip[][]`
  * `hqlv`: `number`
  * `masterData`: `MasterData`
* **戻り値:** `{ c1: number; c2: number; c3: number; c4: number }`

### (Function) `calculateShipFitBonus`
* **説明:** 艦娘および装備の組み合わせから、装備単体ボーナス・水上電探等との相互シナジーボーナス・★改修ボーナスを動的に計算して返却します。
* **引数:**
  * `shipObj`: `DeckBuilderShip`
  * `masterData`: `MasterData`
* **戻り値:** `FitBonusStat`

### (Function) `enrichShipForGkcoi`
* **説明:** gkcoi による画像生成向けに、DeckBuilder 形式の艦娘オブジェクトに欠落している戦闘ステータス（火力、雷装、対空、装甲、回避、索敵、運、耐久、対潜）をマスタデータ、装備、および装備フィットボーナスから計算して補完・付与します。
* **引数:**
  * `shipObj`: `DeckBuilderShip`
  * `masterData`: `MasterData`
* **戻り値:** `DeckBuilderShip`

