---
source_file: "src/calculator.ts"
language: "TypeScript"
description: "Calculates Fighter Power (Air Superiority) and Formula 33 Effective Search Power for KanColle fleets."
tags: [@KcYamlCalculator]
exports:
  - calculateSlotFighterPower
  - calculateFleetFighterPower
  - calculateFleetSaku33
  - enrichShipForGkcoi
imports:
  - "src/types.ts"
---

# `src/calculator.ts` 仕様書

## 関数一覧

### (Function) `calculateSlotFighterPower` (L72-109)
* **説明:** 装備ID、改修値、熟練度、搭載数から1スロット分の制空値を計算します。水上偵察機(category 10)および艦上偵察機(category 9)は対空値が存在しても制空値計算対象外(0)として処理します。デフォルトで熟練度はMAX(7)として計算し、`exactMas` が true の場合のみ実測値を使用します。
* **引数:**
  * `itemId`: `number | undefined`
  * `rf`: `number | undefined`
  * `mas`: `number | undefined`
  * `slotCapacity`: `number`
  * `masterData`: `MasterData`
  * `exactMas`: `boolean | undefined`
* **戻り値:** `number`

### (Function) `calculateFleetFighterPower` (L114-139)
* **説明:** 艦隊全体の合計制空値を算出します。
* **引数:**
  * `ships`: `DeckBuilderShip[]`
  * `masterData`: `MasterData`
  * `exactMas`: `boolean | undefined`
* **戻り値:** `number`

### (Function) `calculateFleetSaku33` (L196-258)
* **説明:** 艦隊および司令部レベルから33式分岐点係数 (1, 2, 3, 4) の索敵スコアを `Decimal` 高精度演算で算出します。単一艦隊 (`DeckBuilderShip[]`) または連合艦隊などの複数艦隊 (`DeckBuilderShip[][]`) に対応します。
* **引数:**
  * `ships`: `DeckBuilderShip[] | DeckBuilderShip[][]`
  * `hqlv`: `number`
  * `masterData`: `MasterData`
* **戻り値:** `{ c1: number; c2: number; c3: number; c4: number }`

### (Function) `enrichShipForGkcoi`
* **説明:** gkcoi による画像生成向けに、DeckBuilder 形式の艦娘オブジェクトに欠落している戦闘ステータス（火力、雷装、対空、装甲、回避、索敵、運、耐久、対潜）をマスタデータおよび装備から先人の計算式（Lv成長線形補間＋Math.floor、近代化改修MAX値、装備ステータス合算）に基づき補完・付与します。
* **引数:**
  * `shipObj`: `DeckBuilderShip`
  * `masterData`: `MasterData`
* **戻り値:** `DeckBuilderShip`
