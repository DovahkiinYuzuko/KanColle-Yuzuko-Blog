---
source_file: "kcyaml/src/types.ts"
language: "TypeScript"
description: "TypeScript interfaces and types for Deck Builder JSON, Master Data, CLI Options, and Validation."
tags: [@KcYamlTypes]
exports:
  - `DeckBuilderData`
  - `MasterShip`
  - `MasterItem`
  - `ParsedFleet`
  - `ParsedAirBase`
  - `CliOptions`
  - `ValidationIssue`
  - `ValidationReport`
imports: []
---

# Specification: `types.ts`

## Overview
`types.ts` は `kcyaml` 内部で扱う全データ構造（Deck Builder JSON、マスタデータ、中間型、CLIオプション、検証レポート）の型定義をまとめたモジュール。

## Variables and Functions

### `DeckBuilderData`
* **Type:** `interface`
* **Description:** Deck Builder JSON形式のルートデータインターフェース。

### `CliOptions`
* **Type:** `interface`
* **Description:** CLI コマンド引数・オプション（-o/--output, --validate, -g/--image, --image-theme, --image-output 等を含む）のインターフェース。


### `ValidationIssue`
* **Type:** `interface`
* **Description:** バリデーション時の警告・エラー情報を保持するインターフェース。

### `ValidationReport`
* **Type:** `interface`
* **Description:** 全体の検証結果および問題一覧を保持するインターフェース。