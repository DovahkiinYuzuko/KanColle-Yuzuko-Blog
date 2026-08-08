---
source_file: "kcyaml/src/parser.ts"
language: "TypeScript"
description: "Parses Deck Builder JSON format and transforms ID data to named fleet and air base structures."
tags: [@KcYamlParser]
exports:
  - `parseDeckBuilder`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `parser.ts`

## Overview
`parser.ts` は Deck Builder JSON をパースし、指定された艦隊・基地航空隊データを抽出。IDをマスタデータと照合して改修値 (`☆N`) 付与、熟練度破棄、空スロットの除外を行う。

## Variables and Functions

### `parseDeckBuilder`
* **Type:** `function`
* **Description:** Deck Builder JSON文字列および指定されたオプション番号に応じて変換後のオブジェクト表現を生成する。

### `formatItemName`
* **Type:** `function`
* **Description:** 装備IDから名称を取得し、改修値 `rf >= 1` の場合に `☆N` を結合する。