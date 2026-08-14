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
    - "src/masterData.ts"
    - "src/calculator.ts"
---

# `[TypeScript]tui.md`

## 概要
`@clack/prompts` および自作の階層型有限状態マシン (`tuiFsm.ts`) を使用して、ユーザーと対話形式で変換オプションを収集するTUIモジュール。
選択されたターゲット（「基地航空隊のみ」「単艦隊」「連合艦隊候補」等）に応じて状態遷移を決定し、不要な質問（基地のみ指定時の連合艦隊確認や画像生成確認、単艦隊指定時の連合艦隊確認など）を自動スキップする。
変換結果の出力表示は `p.note` の枠囲みを廃止し、ターミナルからそのままドラッグコピー可能なプレーンテキスト形式で出力する。

---

## 関数定義

### `runTui` (L31-289)
- **概要**: TUIモードのメインエントリポイント。対話プロンプトを開始して設定を構築し、標準の変換フローを呼び出す。
- **引数**: なし
- **戻り値**: `Promise<void>`