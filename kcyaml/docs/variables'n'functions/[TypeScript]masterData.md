---
source_file: "kcyaml/src/masterData.ts"
language: "TypeScript"
description: "Fetches START2.json with 1.5s timeout and manages local disk cache."
tags: [@KcYamlMasterData]
exports:
  - `loadMasterData`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `masterData.ts`

## Overview
`masterData.ts` はリモートの `START2.json` を短時間タイムアウト（1.5秒）付きで取得し、キャッシュの維持および読み込みを行う。

## Variables and Functions

### `loadMasterData`
* **Type:** `function`
* **Description:** マスタデータを読み込む。1.5秒タイムアウト付きでリモート取得を試み、成功時はキャッシュ更新、失敗・タイムアウト時はローカルキャッシュを返却する。

### `fetchWithTimeout`
* **Type:** `function`
* **Description:** 指定されたミリ秒で AbortSignal を発生させて HTTP fetch を行うヘルパー関数。

### `ensureCacheDir`
* **Type:** `function`
* **Description:** キャッシュ用ディレクトリが存在しない場合に作成する。

### `readCache`
* **Type:** `function`
* **Description:** ローカルキャッシュファイルを読み込む。

### `writeCache`
* **Type:** `function`
* **Description:** データオブジェクトをローカルキャッシュファイルに書き込む。

### `buildMasterMaps`
* **Type:** `function`
* **Description:** 取得した `master.json` または `START2.json` から艦娘ID・装備IDのマッピング辞書オブジェクト（火力・雷装・対空・装甲・回避・索敵・対潜・耐久・運等のステータスを含む）を構築する。