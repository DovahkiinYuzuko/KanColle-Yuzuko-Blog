---
source_file: "kcyaml/index.js"
language: "JavaScript"
description: "CLI launcher entrypoint that detects Bun in PATH and switches runtime dynamically."
tags: [@KcYamlLauncher]
exports: []
imports:
  - "kcyaml/src/cli.ts"
---

# Specification: `index.js`

## Overview
`index.js` は `kcyaml` コマンドの単一エントリーポイントであり、`PATH` 内の `bun` の有無を判定し、`bun` または `node` で CLI メイン処理を起動する。

## Variables and Functions

### `hasBun`
* **Type:** `boolean`
* **Description:** システム環境変数 `PATH` 内に `bun` が利用可能かを示す判定フラグ。

### `launch`
* **Type:** `function`
* **Description:** 実行環境に応じて `bun` または `node` で CLI モジュールを読み込み実行する。
