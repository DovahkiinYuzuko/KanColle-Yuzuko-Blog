---
source_file: "kcyaml/src/masterData.ts"
language: "TypeScript"
description: "Fetches ships.json and items.json with 1.5s timeout and manages local disk cache."
tags: [@KcYamlMasterData]
exports:
  - `loadMasterData`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `masterData.ts`

## Overview
`masterData.ts` はリモートの `ships.json` / `items.json` を短時間タイムアウト（1.5秒）付きで取得し、キャッシュの維持および読み込みを行う。

## Variables and Functions

### `loadMasterData` (L81-101)
* **Type:** `function`
* **Description:** マスタデータを読み込む。1.5秒タイムアウト付きでリモート取得を試み、成功時はキャッシュ更新、失敗・タイムアウト時はローカルキャッシュを返却する。

### `fetchWithTimeout` (L11-23)
* **Type:** `function`
* **Description:** 指定されたミリ秒で AbortSignal を発生させて HTTP fetch を行うヘルパー関数。

### `getCachePath`
* **Type:** `function`
* **Description:** OSの一時ディレクトリ（`os.tmpdir()`）またはキャッシュフォルダ内の該当ファイルパスを返す。