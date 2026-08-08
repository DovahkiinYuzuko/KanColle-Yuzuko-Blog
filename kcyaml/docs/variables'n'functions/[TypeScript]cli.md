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
`cli.ts` は `commander` を利用して CLI オプションを解析し、クリップボードまたはファイルからの入力取得、変換ロジックの呼び出し、出力制御を担当する。

## Variables and Functions

### `runCli` (L9-92)
* **Type:** `function`
* **Description:** CLI処理のメインエントリーポイント。引数を解析して変換・出力のパイプラインを実行する。

### `getInputText`
* **Type:** `function`
* **Description:** オプション `-i` のファイルパス、または指定がない場合はクリップボードから JSON テキストを取得する。