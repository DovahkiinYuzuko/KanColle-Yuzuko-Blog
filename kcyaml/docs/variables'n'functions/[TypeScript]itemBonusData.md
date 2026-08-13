---
title: "[TypeScript] itemBonusData.ts"
category: variables'n'functions
tags:
  - "@typescript"
  - "@bonus"
  - "@calculator"
---

# `itemBonusData.ts` 仕様書

## 概要
制空権シミュレータ (kc-web) の `ItemBonus` クラスおよび `bonusData` 定義の完全な移植。

## エクスポート型・定数

### `ItemBonusStatus`
- 装備ボーナスステータス型。

### `Bonus`
- 装備ボーナスルール型。

### `Bonuses`
- 装備種別・IDとボーナスルールのセット。

### `ItemBonus`
- `public static readonly bonusData: Bonuses[]`
  全装備のフィットボーナス・シナジーボーナスマスタ配列。
- `public static getTotalBonus(bonuses: ItemBonusStatus[]): ItemBonusStatus`
  ボーナス配列を合算するメソッド。
