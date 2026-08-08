---
source_file: "kcyaml/index.js"
language: "JavaScript"
description: "CLI launcher entrypoint that checks Bun version dynamically and switches runtime."
tags: [@KcYamlLauncher]
exports: []
imports:
  - "kcyaml/src/cli.ts"
---

# Specification: `index.js`

## Overview
`index.js` は `kcyaml` コマンドの単一エントリーポイントであり、`bun -v` で Bun の利用可能性を判定し、`bun` または `node` で CLI メイン処理を起動する。

## Variables and Functions

### `checkBunVersion`
* **Type:** `function`
* **Description:** `bun -v` を実行し Bun が利用可能か判別してバージョン文字列を返す。

### `main`
* **Type:** `function`
* **Description:** 実行環境に応じて `bun` または `node` で CLI モジュールを読み込み実行する。
