# kcyaml

艦これのDeck Builder形式JSONをMarkdown YAMLおよび編成画像に変換するCLIツール / CLI tool for converting KanColle Deck Builder format JSON into Markdown YAML and fleet images

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE.MIT)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat-square&logo=nodedotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-Supported-black?style=flat-square&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)

[日本語](#日本語) | [English](#english)

---

## 日本語

`kcyaml` は、「艦隊これくしょん -艦これ-」の各種編成シミュレーター（制空権シミュレーター、Deck Builder 等）から出力された JSON データを読み込み、Markdown 形式の YAML コードブロックおよび 256 色軽量化 PNG 編成画像へ変換・保存するコマンドラインツールです。

> [!NOTE]
> 本ツールは **Windows 11** 環境にて開発および動作検証を実施しています。
> macOS および Linux 環境につきましてもクロスプラットフォーム対応の設計を行っておりますが、開発環境の制約上、実機での動作検証は未実施（動作未確認）となっております。

### 主な機能

- **対話型 TUI ウィザードモード (`kcyaml` / `kcyaml tui`)**:
  - オプション引数なしで起動すると、ステップバイステップの TUI ウィザードが起動します。
  - **自作 HFSM (階層型有限状態マシン)** により選択ターゲット（「単艦隊」「連合艦隊候補（第1・第2艦隊）」「基地航空隊のみ」等）を自動判定。「単艦隊」選択時は連合艦隊確認を自動スキップ、「基地のみ」選択時は連合艦隊や画像出力の質問を全自動スキップして爆速出力します。
  - 複数選択プロンプトに `(Space: 選択/解除 | Enter: 決定)` の操作ガイドを明示。
  - 変換結果は枠線なしのプレーンテキストで出力され、ターミナルからマウスでそのままドラッグコピペ可能です。
- **Deck Builder JSON のパースおよび YAML 変換**:
  - クリップボードまたは指定した JSON ファイルから艦隊（第1〜第4艦隊）および基地航空隊（第1〜第3基地）の情報を解析します。
  - 艦娘のレベル・装備・補強増設スロット・装備改修値（`☆N`）を保持したまま、視認性の高い Markdown 構造へ整形します。（※熟練度 `mas` は自動除外されます）
- **制空値および 33式分岐点係数 (1〜4) の自動算出**:
  - 艦娘・装備パラメータから制空値（艦載機熟練度ボーナス、水偵除外、基地航空隊対応）および33式索敵値（係数1, 2, 3, 4）を高精度に自動計算して Markdown 内に出力します。
  - 連合艦隊フォーマット指定時は、全体の合算制空値および合算33式係数テーブルを出力します。
- **システムブラウザ自動探知による編成画像生成 (`-g`)**:
  - 重い Chromium の事前ダウンロードを行わず、OS 内にインストールされている標準の Chromium 系ブラウザ（Google Chrome、Brave、Arc、Vivaldi、Microsoft Edge、Opera 等）を自動検出してバックグラウンド制御します。
  - 制空権シミュレーターと完全に互換性のあるデザインテーマ (`official`, `dark`, `light`, `74lc` 等) で画像を即時描画します。
- **256色カラーパレット量子化および超軽量化**:
  - 生成された PNG 画像は `sharp` ライブラリによって 256 色パレット化およびメタデータ除去が行われ、高画質なままファイルサイズを大幅に削減します。
- **OS標準ファイル保存ダイアログの起動**:
  - 保存先の選択時に、OS（Windows: エクスプローラー / macOS: Finder / Linux: GTKダイアログ）のネイティブ保存ダイアログを表示して保存場所を指定できます。
- **外部設定ファイル (`config.json`) と自動フォールバック保護**:
  - リモートアセットの取得 URL やログ表示設定を外部ファイルでカスタマイズ可能です。
  - アセット通信に障害が発生した場合は、自動的に安全なデフォルト設定へ切り替えて再描画を試みる自動フォールバック機能を備えています。

### 動作環境・動作要件

- **開発・検証環境**: Windows 11
- **対応ランタイム**: Node.js v18.0.0 以上 (または Bun 環境)
- **必要ブラウザ (編成画像生成機能 `-g` 利用時)**:
  - 画像生成エンジン (`puppeteer-core`) の制御仕様上、以下のいずれかの Chromium 系ブラウザが OS にインストールされている必要があります。
    - **Windows**: Google Chrome、Microsoft Edge、Brave、Vivaldi、または Opera
    - **macOS (動作未確認)**: Google Chrome、Brave、Arc、Vivaldi、Microsoft Edge、Opera、または Chromium
    - **Linux (動作未確認)**: Google Chrome、Brave、Chromium、Vivaldi、または Microsoft Edge
  - ※ Safari および Firefox は CDP (Chrome DevTools Protocol) 非対応のため、画像自動生成エンジンの制御対象外となります。

### インストール・実行方法

> [!WARNING]
> 本ツールはブログコンテンツと同一リポジトリで管理されているため、`npm install` によるサブディレクトリ単体のインストールは対応していません。
> [GitHub Releases](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases) から zip をダウンロードして利用してください。

1. [Releases ページ](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases) から最新の `kcyaml-vX.X.X.zip` をダウンロードします。
2. zip を任意のフォルダに解凍します。
3. 解凍したフォルダ内でターミナルを開き、以下を実行します。

```bash
npm install
npm run build
npm link
```

4. インストール完了後、`kcyaml` コマンドがグローバルに利用可能になります。

---

### 使用方法とコマンド例

#### 1. 対話型 TUI ウィザードでの実行 (初心者・オプション忘れ時推奨)
コマンド単体、または `tui` サブコマンドで対話型ウィザードが起動します。

```bash
kcyaml
# または
kcyaml tui
```

#### 2. クリップボードからの変換 (標準実行)
Web上のシミュレーターで「Deck Builder形式でコピー」を実行した後、以下を入力します。

```bash
kcyaml -f 1 2
```

#### 3. JSON ファイル入力と編成画像(PNG)の同時生成
```bash
kcyaml -f 1 2 -i 例.json -g -o
```

#### 4. ダイアログをスキップして自動保存
```bash
kcyaml -f 1 2 -i 例.json -g --no-dialog -o
```

#### 5. デフォルト設定ファイル `config.json` の生成
```bash
kcyaml --init-config
```

---

### コマンドラインオプション詳細

| オプション               | 短縮   | 型      | デフォルト値   | 説明                                                                      |
| :----------------------- | :----- | :------ | :------------- | :------------------------------------------------------------------------ |
| `tui`                    | なし   | command | なし           | 対話型 TUI ウィザードモードを起動する                                     |
| `--fleet <numbers...>`   | `-f`   | numbers | `1`            | 変換対象の艦隊番号 (例: `-f 1 2 3`)                                       |
| `--air <numbers...>`     | `-a`   | numbers | なし           | 変換対象の基地航空隊番号 (例: `-a 1 2`)                                   |
| `--title <string>`       | `-t`   | string  | なし           | YAML構造の親キータイトル名                                                |
| `--fleet-title <string>` | `--ft` | string  | なし           | 艦隊専用の親キータイトル名                                                |
| `--air-title <string>`   | `--at` | string  | なし           | 基地航空隊専用の親キータイトル名                                          |
| `--input <path>`         | `-i`   | path    | クリップボード | 入力 JSON ファイルのパス                                                  |
| `--output [path]`        | `-o`   | path    | なし           | テキスト保存先 (引数なし時は自動保存フォルダへ保存)                       |
| `--image`                | `-g`   | flag    | `false`        | 編成画像 (PNG) を自動出力する                                             |
| `--image-theme <theme>`  | なし   | string  | `official`     | 画像表示テーマ (`official`, `dark`, `light`, `74lc` 等)                   |
| `--image-output <path>`  | なし   | path    | なし           | 生成画像の保存先ファイルパス指定                                          |
| `--no-dialog`            | なし   | flag    | `false`        | OS のファイルエクスプローラー保存ダイアログ表示をスキップする             |
| `--init-config`          | なし   | flag    | `false`        | デフォルトの `config.json` テンプレートをプロジェクトルートに初期生成する |
| `--config <path>`        | なし   | path    | なし           | カスタム `config.json` 設定ファイルのパス指定                             |
| `--dry-run`              | なし   | flag    | `false`        | クリップボードへの書き込みを行わず標準出力へのみ出力する                  |
| `--rengo`                | `-r`   | flag    | `false`        | 連合艦隊フォーマットで出力する                                            |
| `--refresh`              | なし   | flag    | `false`        | 艦娘・装備マスタデータをリモートから強制再取得・更新する                  |
| `--validate`             | なし   | flag    | `false`        | 入力データの構造整合性および未知の ID チェックを実行する                  |
| `--exact-mas`            | なし   | flag    | `false`        | 実際の熟練度数値(mas)をそのまま使用して制空値を計算する                   |

---

### 設定ファイル (`config.json`) の仕様

プロジェクトルート直下の `config.json` で詳細な動作設定を調整できます。

```json
{
  "urls": {
    "start2Url": "https://raw.githubusercontent.com/Nishisonic/gkcoi/master/static/START2.json",
    "shipUrl": "https://raw.githubusercontent.com/Nishisonic/gkcoi/master",
    "masterUrl": "https://raw.githubusercontent.com/Nishisonic/gkcoi/master"
  },
  "logging": {
    "debug": true,
    "showBrowserLogs": true
  },
  "dialog": {
    "enabled": true
  },
  "image": {
    "defaultTheme": "official",
    "quality": 80,
    "palette": true
  },
  "output": {
    "defaultDir": "kcdata-output"
  }
}
```

---

### 出力フォーマット例

#### 単一艦隊 出力例

- **第1艦隊:**
```yaml
艦隊:
  - name: 羽黒改二
    level: 173
    equipments:
      - 20.3cm(2号)連装砲☆5
      - 20.3cm(3号)連装砲☆2
      - 42号対空電探
      - 零式水上観測機
      - 三式弾
```

- **制空値:** 235
- **33式分岐点係数:**

|番号|係数|
|:---:|---|
|1|35.63|
|2|74.03|
|3|112.43|
|4|150.83|

---

### LICENSE

このプロジェクトのライセンスはMITです。詳しくは[LICENSE.MIT](LICENSE.MIT)をお読みください。また、サードパーティライセンスは[NOTICE.md](NOTICE.md)に表記してあります。

---

## English

`kcyaml` is a command-line tool designed to parse Deck Builder format JSON data exported from Kantai Collection (KanColle) fleet simulators, converting it into Markdown YAML codeblocks and 256-color optimized PNG fleet organization images.

> [!NOTE]
> This tool is developed and verified primarily on **Windows 11**.
> While the architecture is designed to support cross-platform execution for macOS and Linux, actual testing on non-Windows platforms has not been performed due to hardware availability.

### Key Features

- **Interactive TUI Wizard Mode (`kcyaml` / `kcyaml tui`)**:
  - Running `kcyaml` without arguments launches an interactive step-by-step TUI wizard.
  - Powered by a custom **HFSM (Hierarchical Finite State Machine)** that evaluates selected targets. Selecting "Single Fleet" automatically skips Combined Fleet confirmation; selecting "Land-Based Air Base only" automatically skips irrelevant questions (e.g. Combined Fleet or Image output) for maximum speed.
  - Clear key guide `(Space: Select/Deselect | Enter: Confirm)` in multi-select prompts.
  - Formatted results output as raw plain text without borders/frames, allowing direct mouse drag-and-drop copying from the terminal.
- **Deck Builder JSON Parsing & YAML Conversion**:
  - Parses fleet (Fleets 1 to 4) and land-based air base (Bases 1 to 3) data from either the system clipboard or local JSON files.
  - Formats output into clean Markdown structures while preserving ship levels, equipment, expansion slots, and equipment improvement levels (`☆N`). (Note: Aircraft proficiency `mas` is automatically excluded).
- **Automated Fighter Power & Formula 33 Effective Search Power Calculation**:
  - Automatically calculates Fighter Power (with aircraft proficiency bonuses, recon plane exclusion, and air base support) and Formula 33 Effective Search Power tables (coefficients 1 to 4).
  - Outputs combined fighter power and combined Formula 33 tables when Combined Fleet formatting is enabled.
- **Fleet Image Generation via System Browser Detection (`-g`)**:
  - Automatically detects and controls system Chromium-based browsers (Google Chrome, Brave, Arc, Vivaldi, Microsoft Edge, Opera, etc.) installed on the OS in headless mode without downloading extra Chromium binaries.
  - Instantly renders high-quality fleet composition images using themes fully compatible with simulators (`official`, `dark`, `light`, `74lc`, etc.).
- **256-Color Palette Quantization & Optimization**:
  - Generated PNG images are processed via `sharp` for 256-color palette quantization and metadata stripping, significantly reducing file sizes while maintaining visual quality.
- **Native OS File Save Dialog**:
  - Displays native OS file explorer save dialogs (Windows Explorer / macOS Finder / Linux GTK) when selecting output file paths.
- **External Configuration (`config.json`) & Automatic Fallback Protection**:
  - Customizes remote asset URLs, debug logging toggles, and default themes.
  - Includes an automatic fallback mechanism that switches to safe default rendering parameters if remote asset retrieval fails or times out.

### System Requirements

- **Development & Tested OS**: Windows 11
- **Supported Runtime**: Node.js v18.0.0 or higher (or Bun environment)
- **Required Browsers (for image generation `-g`)**:
  - Due to automation engine (`puppeteer-core`) specifications, one of the following Chromium-based browsers must be installed on your OS:
    - **Windows**: Google Chrome, Microsoft Edge, Brave, Vivaldi, or Opera
    - **macOS (Unverified)**: Google Chrome, Brave, Arc, Vivaldi, Microsoft Edge, Opera, or Chromium
    - **Linux (Unverified)**: Google Chrome, Brave, Chromium, Vivaldi, or Microsoft Edge
  - *Note: Safari and Firefox are not supported for automated image generation as they do not support CDP (Chrome DevTools Protocol).*

### Installation

> [!WARNING]
> This tool is managed within the same repository as the blog content. Installing via `npm install` from a subdirectory is not supported.
> Please download the zip from [GitHub Releases](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases) instead.

1. Download the latest `kcyaml-vX.X.X.zip` from the [Releases page](https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog/releases).
2. Extract the zip to any folder.
3. Open a terminal inside the extracted folder and run:

```bash
npm install
npm run build
npm link
```

4. Once complete, the `kcyaml` command is available globally.

---

### Usage & Command Examples

#### 1. Interactive TUI Wizard Execution
Run without arguments or with `tui` subcommand:

```bash
kcyaml
# or
kcyaml tui
```

#### 2. Conversion from Clipboard (Standard Execution)
Copy Deck Builder JSON from your web simulator, then run:

```bash
kcyaml -f 1 2
```

#### 3. Conversion from JSON File with Image (PNG) Generation
```bash
kcyaml -f 1 2 -i input.json -g -o
```

#### 4. Skip Save Dialog and Auto-Save
```bash
kcyaml -f 1 2 -i input.json -g --no-dialog -o
```

#### 5. Generate Default Configuration (`config.json`)
```bash
kcyaml --init-config
```

---

### Command Line Options Details

| Option                   | Short  | Type    | Default    | Description                                                   |
| :----------------------- | :----- | :------ | :--------- | :------------------------------------------------------------ |
| `tui`                    | None   | command | None       | Launch interactive TUI wizard mode                            |
| `--fleet <numbers...>`   | `-f`   | numbers | `1`        | Fleet numbers to convert (e.g., `-f 1 2 3`)                   |
| `--air <numbers...>`     | `-a`   | numbers | None       | Land-based air base numbers to convert (e.g., `-a 1 2`)       |
| `--title <string>`       | `-t`   | string  | None       | Parent key title name in YAML structure                       |
| `--fleet-title <string>` | `--ft` | string  | None       | Fleet-specific parent key title name                          |
| `--air-title <string>`   | `--at` | string  | None       | Air base-specific parent key title name                       |
| `--input <path>`         | `-i`   | path    | Clipboard  | Input JSON file path                                          |
| `--output [path]`        | `-o`   | path    | None       | Text output file path (auto-saves if specified without value) |
| `--image`                | `-g`   | flag    | `false`    | Generate fleet composition images (PNG)                       |
| `--image-theme <theme>`  | None   | string  | `official` | Display theme (`official`, `dark`, `light`, `74lc`, etc.)     |
| `--image-output <path>`  | None   | path    | None       | File path specification for output image                      |
| `--no-dialog`            | None   | flag    | `false`    | Skip native OS file explorer save dialog                      |
| `--init-config`          | None   | flag    | `false`    | Initialize default `config.json` template in project root     |
| `--config <path>`        | None   | path    | None       | Custom `config.json` file path specification                  |
| `--dry-run`              | None   | flag    | `false`    | Output to stdout only without writing to clipboard            |
| `--rengo`                | `-r`   | flag    | `false`    | Format output as Combined Fleet layout                        |
| `--refresh`              | None   | flag    | `false`    | Force refetch and update master data from remote repository   |
| `--validate`             | None   | flag    | `false`    | Perform data structure integrity and unknown ID validation    |
| `--exact-mas`            | None   | flag    | `false`    | Use raw proficiency numbers (mas) directly for calculation    |

---

### Configuration File (`config.json`) Specifications

You can adjust fine-grained runtime behavior in `config.json` at the project root.

```json
{
  "urls": {
    "start2Url": "https://raw.githubusercontent.com/Nishisonic/gkcoi/master/static/START2.json",
    "shipUrl": "https://raw.githubusercontent.com/Nishisonic/gkcoi/master",
    "masterUrl": "https://raw.githubusercontent.com/Nishisonic/gkcoi/master"
  },
  "logging": {
    "debug": true,
    "showBrowserLogs": true
  },
  "dialog": {
    "enabled": true
  },
  "image": {
    "defaultTheme": "official",
    "quality": 80,
    "palette": true
  },
  "output": {
    "defaultDir": "kcdata-output"
  }
}
```

---

### Output Format Example

#### Single Fleet Output Example
- **第1艦隊:**
```yaml
艦隊:
  - name: 羽黒改二
    level: 173
    equipments:
      - 20.3cm(2号)連装砲☆5
      - 20.3cm(3号)連装砲☆2
      - 42号対空電探
      - 零式水上観測機
      - 三式弾
```

- **制空値:** 235
- **33式分岐点係数:**

|番号|係数|
|:---:|---|
|1|35.63|
|2|74.03|
|3|112.43|
|4|150.83|

---

### LICENSE

This project is licensed under the MIT License. For details, please read [LICENSE.MIT](LICENSE.MIT). Third-party licenses are documented in [NOTICE.md](NOTICE.md).
