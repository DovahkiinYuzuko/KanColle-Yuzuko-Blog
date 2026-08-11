---
source_file: "src/tui.ts"
language: "TypeScript"
type: "TUI Interactive Mode Handler"
description: "Interactive wizard interface for kcyaml built with @clack/prompts."
tags: ["@KcYamlCLI"]
related:
  exports:
    - runTui
  imports:
    - "src/types.ts"
    - "src/cli.ts"
---

# `[TypeScript]tui.md`

## 概要
`@clack/prompts` を使用して、ユーザーと対話形式で変換オプション（艦隊番号、基地番号、入力ファイル、連合艦隊出力、画像出力等）を順次収集し、変換処理を実行するTUIインターフェースモジュール。

---

## 関数定義

### `runTui`
- **概要**: TUIモードのメインエントリポイント。対話プロンプトを開始して設定を構築し、標準の変換フローを呼び出す。
- **引数**: なし
- **戻り値**: `Promise<void>`
