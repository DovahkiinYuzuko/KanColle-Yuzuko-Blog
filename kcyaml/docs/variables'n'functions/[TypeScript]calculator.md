---
source_file: "kcyaml/src/calculator.ts"
language: "TypeScript"
description: "Calculates Fighter Power (Air Superiority), Formula 33 Effective Search Power, and Ship Fit Bonuses for KanColle fleets."
tags: [@KcYamlCalculator]
exports:
  - `calculateSlotFighterPower`
  - `calculateFleetFighterPower`
  - `calculateFleetSaku33`
  - `calculateShipFitBonus`
  - `enrichShipForGkcoi`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `calculator.ts`

## Overview
`calculator.ts` は艦隊の制空値（対空値・改修ボーナス・熟練度ボーナス）、33式分岐点係数索敵スコア（Decimal高精度演算）、装備フィットボーナス、および gkcoi 画像生成用のステータス補完を計算する。

## Variables and Functions

### `getItemCategory` (L5-13)
* **Type:** `function`
* **Description:** 装備マスタオブジェクトから装備カテゴリID (typeId / type[2] / itype) を抽出する。

### `getAaRefitBonus` (L18-35)
* **Type:** `function`
* **Description:** 装備カテゴリ、改修値 (rf)、対空値に応じた対空改修ボーナス（☆加算値）を `Decimal` で算出する。

### `getProficiencyBonusDecimal` (L41-68)
* **Type:** `function`
* **Description:** 熟練度 (mas) に応じた内部熟練度経験値および固定制空ボーナスを算出する（制空権シミュレータ kc-web 互換仕様）。

### `calculateSlotFighterPower` (L73-110)
* **Type:** `function`
* **Description:** 装備ID、改修値、熟練度、搭載数から1スロット分の制空値を計算する。水上偵察機(category 10)および艦上偵察機(category 9)は対空値が存在しても制空値計算対象外(0)として処理する。`exactMas` が true の場合のみ実測値を使用し、未指定時は熟練度MAX(7)として計算する。

### `calculateFleetFighterPower` (L115-140)
* **Type:** `function`
* **Description:** 艦隊全体の合計制空値を算出する。

### `getShipRawSaku` (L145-163)
* **Type:** `function`
* **Description:** 艦娘レベルとマスタデータ（初期索敵値・最大索敵値）から艦娘の素索敵値を計算する。

### `calculateFleetSaku33` (L197-259)
* **Type:** `function`
* **Description:** 艦隊および司令部レベルから33式分岐点係数 (1, 2, 3, 4) の索敵スコアを `Decimal` 高精度演算で算出する。単一艦隊 (`DeckBuilderShip[]`) または複数艦隊 (`DeckBuilderShip[][]`) に対応する。

### `calculateShipFitBonus` (L276-464)
* **Type:** `function`
* **Description:** 艦娘および装備の組み合わせから、装備単体ボーナス・水上電探等との相互シナジーボーナス・★改修ボーナスを動的に計算して返却する。

### `calculateShipGrowthStat` (L266-270)
* **Type:** `function`
* **Description:** レベルとマスタデータの初期値・最大値から艦船の成長ステータス（回避・索敵・対潜）を補間計算する。

### `enrichShipForGkcoi` (L470-544)
* **Type:** `function`
* **Description:** gkcoi による画像生成向けに、DeckBuilder 形式の艦娘オブジェクトに欠落している戦闘ステータス（火力、雷装、対空、装甲、回避、索敵、運、耐久、対潜）をマスタデータ、装備、および装備フィットボーナスから計算して補完・付与する。