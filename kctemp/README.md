# kctemp

艦これイベント攻略記事用 Markdown テンプレート対話型生成 CLI ツール / Interactive CLI generator for KanColle event report Markdown templates

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square&logo=opensourceinitiative&logoColor=white)](./LICENSE.MIT)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat-square&logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM-yellow?style=flat-square&logo=javascript&logoColor=white)
![AST Engine](https://img.shields.io/badge/AST-Unified%20%2F%20Remark-blue?style=flat-square&logo=markdown&logoColor=white)

[日本語](#日本語) | [English](#english)

---

## 日本語

`kctemp` は、「艦隊これくしょん -艦これ-」のイベント攻略記事の執筆を支援するための Markdown テンプレート対話型生成 CLI ツールです。
テンプレートとなる Markdown ファイルを MDAST（Markdown 構文木）へパースし、対話型ウィザードを通じて必要なセクションの選択、個別マス等のリピート展開、変数置換を行い、整形された Markdown 記事ファイルを生成・保存します。

### 主な機能

- **対話型 FSM ウィザード**:
  - ステップバイステップのプロンプトで、テンプレート選択・セクション抽出・リピート回数設定・変数入力をスムーズに実行します。
  - トランポリンループ方式のステートマシンを採用し、安定した状態遷移を提供します。
- **AST（構文木）ベースのセクション抽出・フィルタリング**:
  - Unified / Remark を利用してテンプレートの見出し階層を解析し、必要なセクションのみを選択して出力できます。
- **安全な 1 パス変数置換**:
  - 置換値の中に別の変数名が含まれていても多重置換（二次置換）が発生しない安全なトークン置換エンジンを搭載しています。
- **セクション単位の個別リピート展開**:
  - 攻略マス（`{マス}`）等のセクションを指定した回数だけ自動複製し、セットごとの個別変数を入力できます。
- **ファイル重複解決と排他書き込み**:
  - 出力先に同名ファイルが存在する場合、自動連番付与または手動リネームを選択できます。`wx` フラグによる安全な排他制御を行います。

### 動作環境・動作要件

- **開発・検証環境**: Windows 11
- **対応ランタイム**: Node.js v18.0.0 以上 (または Bun 環境)

### インストール・セットアップ手順

> [!WARNING]
> 本ツールはブログコンテンツと同一リポジトリで管理されているため、`npm install` によるサブディレクトリ単体のインストールは対応していません。
> [GitHub Releases](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases) から zip をダウンロードして利用してください。

1. [Releases ページ](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases) から最新の `kctemp-vX.X.X.zip` をダウンロードします。
2. zip を任意のフォルダに解凍します。
3. 解凍したフォルダ内でターミナルを開き、以下を実行します。

```bash
npm install
npm link
```

4. インストール完了後、`kctemp` コマンドがグローバルに利用可能になります。

### 使用方法

```bash
kctemp
```

コマンドを実行すると対話型ウィザードが起動します。画面の案内に従って以下の項目を入力・選択してください。

1. **テンプレート選択**: 使用する Markdown テンプレートを選択（または直接パスを入力）
2. **セクション選択**: 出力対象とするセクションをスペースキーで選択
3. **リピート回数設定**: `{マス}` などの繰り返し対象セクションの出力セット数を指定
4. **変数入力**: 海域識別子（`En`）や担当者（`{人}`）などのプレースホルダーの値を入力
5. **保存先設定**: 出力先ディレクトリおよびファイル名を指定（重複時は自動連番またはリネーム）

### 出力仕様

- 生成されるファイルは Markdown 形式（`.md`）です。
- リピート指定されたセクションは、入力した個別変数が適用された状態で連続して出力されます。
- 選択から除外されたセクションは出力ファイルから安全に取り除かれます。

### LICENSE
[MIT](./LICENSE.MIT)

Third-Party → [NOTICE.md](./NOTICE.md)

---

## English

`kctemp` is an interactive CLI generator for KanColle event report Markdown templates.
It parses a Markdown template into an MDAST (Markdown Abstract Syntax Tree), allowing you to select sections, duplicate repeating blocks (e.g. battle nodes), and substitute variables through a guided interactive wizard to produce a clean, ready-to-use Markdown report file.

### Features

- **Interactive FSM Wizard**:
  - Guides you step-by-step through template selection, section extraction, repetition configuration, and variable substitution.
  - Built with a trampoline-loop Finite State Machine for reliable state management.
- **AST-Based Section Extraction and Filtering**:
  - Leverages Unified and Remark to parse heading hierarchies, allowing you to selectively render only the required sections.
- **Safe Single-Pass Variable Substitution**:
  - Utilizes a single-pass token replacement engine that prevents multi-pass substitution hazards even if replacement values contain other variable names.
- **Section-Level Repetition Expansion**:
  - Automatically duplicates repeatable sections (e.g. `{マス}` / battle nodes) for a specified count, prompting for separate variable sets per block.
- **File Collision Resolution and Exclusive Writing**:
  - Detects existing output files and provides automatic sequential renaming or manual input options, backed by `wx` exclusive write protection.

### Requirements

- **Development & Verification Environment**: Windows 11
- **Supported Runtimes**: Node.js v18.0.0 or higher (or Bun runtime)

### Installation & Setup

> [!WARNING]
> This tool is maintained within a monorepo alongside blog content. Direct subfolder installation via `npm install` is not supported.
> Please download the release zip from [GitHub Releases](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases).

1. Download the latest `kctemp-vX.X.X.zip` from the [Releases page](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases).
2. Extract the zip file to any directory.
3. Open a terminal in the extracted folder and run:

```bash
npm install
npm link
```

4. Once linked, the `kctemp` command becomes available globally.

### Usage

```bash
kctemp
```

Launching the command initiates the interactive wizard. Follow the on-screen prompts:

1. **Select Template**: Choose a template from the list or enter a custom file path.
2. **Select Sections**: Use Space to toggle sections to include in the output.
3. **Configure Repeats**: Specify repetition counts for expandable sections (such as `{マス}`).
4. **Input Variables**: Enter values for global and repeat-specific placeholders (e.g., `En`, `{人}`).
5. **Resolve Output**: Specify destination directory and filename (handles collisions with auto-numbering or rename options).

### Output Specification

- Generates standard Markdown files (`.md`).
- Repeated sections are rendered sequentially with their corresponding per-set variables applied.
- Excluded sections are cleanly removed from the final Markdown document.

### LICENSE
[MIT](./LICENSE.MIT)

Third-Party → [NOTICE.md](./NOTICE.md)
