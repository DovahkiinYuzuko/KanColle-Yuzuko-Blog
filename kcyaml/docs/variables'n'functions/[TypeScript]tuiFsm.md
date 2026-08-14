---
source_file: "src/tuiFsm.ts"
language: "TypeScript"
type: "Hierarchical Finite State Machine for TUI"
description: "Lightweight HFSM state machine engine and context for kcyaml TUI interactive prompt branching."
tags: ["@KcYamlCLI"]
related:
  exports:
    - TuiState
    - TuiContext
    - TuiFsmEngine
  imports:
    - "src/types.ts"
---

# `[TypeScript]tuiFsm.md`

## 概要
TUI モードにおいて、選択されたターゲット（「基地航空隊のみ」「単艦隊」「連合艦隊候補（第1・第2艦隊）」等）に応じて問診の階層分岐・不要な質問の自動スキップを行う軽量な自作 HFSM (Hierarchical Finite State Machine) 状態遷移エンジン。

---

## 状態定義 (TuiState)

- `INPUT_SOURCE`: クリップボード or ファイル入力選択
- `TARGET_SELECTION`: 艦隊番号・基地航空隊番号選択
- `MODE_BRANCH`: 選択ターゲットに基づく親状態からサブ状態への分岐評価
  - サブ状態 `AIR_ONLY`: 基地のみ（連合艦隊・画像質問を自動スキップ）
  - サブ状態 `SINGLE_FLEET`: 単一艦隊または第1・第2艦隊を同時に含まない組み合わせ（連合艦隊質問を自動スキップ、熟練度・画像質問を評価）
  - サブ状態 `COMBINED_CANDIDATE`: 第1艦隊かつ第2艦隊を含む組み合わせ（連合艦隊・熟練度・画像質問をすべて評価）
- `THEME_SELECT`: 画像生成 YES 時のテーマ選択サブ状態
- `OUTPUT_SETTING`: ディスク保存確認
- `EXECUTION`: データ変換・ファイル出力・完了表示
- `CANCELLED`: 処理キャンセル・中断

---

## クラス ＆ インターフェース定義

### `TuiContext`
- **概要**: 状態遷移中に収集されたすべてのオプション、選択ターゲット、入力テキストを保持するデータコンテキスト。

### `TuiFsmEngine`
- **`currentState`**: 現在の状態 (`TuiState`)
- **`context`**: データコンテキスト (`TuiContext`)
- **`getState()`**: 現在の状態 (`TuiState`) を取得する。
- **`transitionTo(nextState: TuiState)`**: 状態を指定された状態に遷移させる。
- **`isCombinedCandidate()`**: `selectedFleets` に 1 と 2 の両方が含まれているかを判定する。
- **`evaluateTargetBranch()`**: `selectedFleets` と `selectedAir` の状態から `AIR_ONLY` / `SINGLE_FLEET` / `COMBINED_CANDIDATE` のいずれかのサブ状態を判定・遷移し、結果を返す。
- **`handleCancel()`**: 状態を `CANCELLED` に遷移させる。
- **`buildCliOptions(defaultTheme: string, defaultDialogEnabled: boolean)`**: コンテキストから `CliOptions` オブジェクトを構築する。
