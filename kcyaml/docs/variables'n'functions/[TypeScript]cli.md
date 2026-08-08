---
source_file: "kcyaml/src/cli.ts"
language: "TypeScript"
description: "Parses command line flags using Commander and coordinates reading input and outputting Markdown YAML."
tags: [@KcYamlCLI]
exports:
  - `runCli`
imports:
  - "kcyaml/src/types.ts"
  - "kcyaml/src/masterData.ts"
  - "kcyaml/src/parser.ts"
  - "kcyaml/src/formatter.ts"
---

# Specification: `cli.ts`

## Overview
`cli.ts` は `commander` を利用して CLI オプションを解析し、クリップボードまたはファイルからの入力取得、変換ロジックの呼び出し、出力制御、OS通知の送信、および `-o` オプショナル指定時の `kcdata-output/` フォルダ自動生成を担当する。

## Variables and Functions

### `runCli`
* **Type:** `function`
* **Description:** CLI処理のメインエントリーポイント。引数を解析して変換・出力のパイプラインを実行する。

### `sendOsNotification`
* **Type:** `function`
* **Description:** クリップボードコピー成功時に OS（Windows/Mac/Linux）の通知バナーを送信する。

### `getFormattedTimestamp`
* **Type:** `function`
* **Description:** `-o` のみ指定時の自動保存ファイル名用に `YYYYMMDD_HHMMSS` 形式のタイムスタンプ文字列を返却する。