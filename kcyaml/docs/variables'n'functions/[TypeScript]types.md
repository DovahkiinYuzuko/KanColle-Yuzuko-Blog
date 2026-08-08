---
source_file: "kcyaml/src/types.ts"
language: "TypeScript"
description: "TypeScript interfaces and types for Deck Builder JSON, Master Data, and CLI Options."
tags: [@KcYamlTypes]
exports:
  - `DeckBuilderData`
  - `MasterShip`
  - `MasterItem`
  - `ParsedFleet`
  - `ParsedAirBase`
  - `CliOptions`
imports: []
---

# Specification: `types.ts`

## Overview
`types.ts` は `kcyaml` 内部で扱う全データ構造（Deck Builder JSON、マスタデータ、中間型、CLIオプション）の型定義をまとめたモジュール。

## Variables and Functions

### `DeckBuilderData` (L35-39)
* **Type:** `interface`
* **Description:** Deck Builder JSON形式のルートデータインターフェース。

### `CliOptions` (L63-72)
* **Type:** `interface`
* **Description:** CLI コマンド引数・オプションのインターフェース。