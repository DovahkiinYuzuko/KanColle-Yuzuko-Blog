---
source_file: "kcyaml/src/parser.ts"
language: "TypeScript"
description: "Parses Deck Builder JSON format, transforms ID data, and validates structural/master ID integrity."
tags: [@KcYamlParser]
exports:
  - `parseDeckBuilder`
  - `validateDeckBuilder`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `parser.ts`

## Overview
`parser.ts` は Deck Builder JSON をパースし、指定された艦隊・基地航空隊データを抽出。さらに `--validate` 用に構造および未知のIDを検証する。

## Variables and Functions

### `parseDeckBuilder`
* **Type:** `function`
* **Description:** Deck Builder JSON文字列および指定されたオプション番号に応じて変換後のオブジェクト表現を生成する。

### `validateDeckBuilder`
* **Type:** `function`
* **Description:** 入力JSONの構文、基本キー、未登録艦娘/装備IDの健全性をチェックし検証レポートを返却する。

### `formatItemName`
* **Type:** `function`
* **Description:** 装備IDから名称を取得し、改修値 `rf >= 1` の場合に `☆N` を結合する。