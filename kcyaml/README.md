# kcyaml (艦これDeck Builder JSON to Markdown YAML Converter) / kcyaml

艦これのDeck Builder形式JSONをMarkdown YAMLおよび編成画像に変換するCLIツール / CLI tool for converting KanColle Deck Builder format JSON into Markdown YAML and fleet images

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE.MIT)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat-square&logo=nodedotjs&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-Supported-black?style=flat-square&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)
![OS](https://img.shields.io/badge/OS-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)

[日本語](#日本語) | [English](#english)

---

## 日本語

`kcyaml` は、「艦隊これくしょん -艦これ-」の各種編成シミュレーター（制空権シミュレーター、Deck Builder 等）から出力された JSON データを読み込み、Markdown 形式の YAML コードブロックおよび 256 色軽量化 PNG 編成画像へ変換・保存するコマンドラインツールです。

### 主な機能

- **Deck Builder JSON のパースおよび YAML 変換**:
  - クリップボードまたは指定した JSON ファイルから艦隊（第1〜第4艦隊）および基地航空隊（第1〜第3基地）の情報を解析します。
  - 艦娘のレベル・装備・補強増設スロット・装備改修値（`☆N`）を保持したまま、視認性の高い Markdown 構造へ整形します。（※熟練度 `mas` は自動除外されます）
- **システムブラウザ自動探知による編成画像生成 (`-g`)**:
  - 重い Chromium の事前ダウンロードを行わず、OS 内にインストールされている標準ブラウザ（Google Chrome、Microsoft Edge、Brave 等）を自動検出してバックグラウンド制御します。
  - 制空権シミュレーターと完全に互換性のあるデザインテーマ (`official`, `dark`, `light`, `74lc` 等) で画像を即時描画します。
- **256色カラーパレット量子化および超軽量化**:
  - 生成された PNG 画像は `sharp` ライブラリによって 256 色パレット化およびメタデータ除去が行われ、高画質なままファイルサイズを大幅に削減します。
- **OS標準ファイル保存ダイアログの起動**:
  - 保存先の選択時に、OS（Windows: エクスプローラー / macOS: Finder / Linux: GTKダイアログ）のネイティブ保存ダイアログを表示して保存場所を指定できます。
- **外部設定ファイル (`config.json`) と自動フォールバック保護**:
  - リモートアセットの取得 URL やログ表示設定を外部ファイルでカスタマイズ可能です。
  - アセット通信に障害が発生した場合は、自動的に安全なデフォルト設定へ切り替えて再描画を試みる自動フォールバック機能を備えています。

### 動作環境・動作要件

- **ランタイム**: Node.js v18.0.0 以上 (または Bun 環境)
- **対応OS**: Windows 11 / 10、macOS、Linux
- **必要ブラウザ (編成画像生成機能 `-g` 利用時)**:
  - 以下のいずれかのブラウザが OS にインストールされている必要があります。
    - **Windows**: Microsoft Edge または Google Chrome
    - **macOS**: Google Chrome、Microsoft Edge、または Brave
    - **Linux**: Chromium または Google Chrome

### インストール方法

```bash
# リポジトリのクローンとビルド
git clone https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog.git
cd kcyaml
npm install
npm run build

# グローバルコマンドとして登録
npm link
```

---

### 使用方法とコマンド例

#### 1. クリップボードからの変換 (標準実行)
Web上のシミュレーターで「Deck Builder形式でコピー」を実行した後、以下を入力します。

```bash
kcyaml -f 1 2
```

#### 2. JSON ファイル入力と編成画像(PNG)の同時生成
```bash
kcyaml -f 1 2 -i 例.json -g -o
```

#### 3. ダイアログをスキップして自動保存
```bash
kcyaml -f 1 2 -i 例.json -g --no-dialog -o
```

#### 4. デフォルト設定ファイル `config.json` の生成
```bash
kcyaml --init-config
```

---

### コマンドラインオプション詳細

| オプション | 短縮 | 型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- | :--- |
| `--fleet <numbers...>` | `-f` | numbers | `1` | 変換対象の艦隊番号 (例: `-f 1 2 3`) |
| `--air <numbers...>` | `-a` | numbers | なし | 変換対象の基地航空隊番号 (例: `-a 1 2`) |
| `--title <string>` | `-t` | string | なし | YAML構造の親キータイトル名 |
| `--fleet-title <string>` | `--ft` | string | なし | 艦隊専用の親キータイトル名 |
| `--air-title <string>` | `--at` | string | なし | 基地航空隊専用の親キータイトル名 |
| `--input <path>` | `-i` | path | クリップボード | 入力 JSON ファイルのパス |
| `--output [path]` | `-o` | path | なし | テキスト保存先 (引数なし時は自動保存フォルダへ保存) |
| `--image` | `-g` | flag | `false` | 編成画像 (PNG) を自動出力する |
| `--image-theme <theme>` | なし | string | `official` | 画像表示テーマ (`official`, `dark`, `light`, `74lc` 等) |
| `--image-output <path>` | なし | path | なし | 生成画像の保存先ファイルパス指定 |
| `--no-dialog` | なし | flag | `false` | OS のファイルエクスプローラー保存ダイアログ表示をスキップする |
| `--init-config` | なし | flag | `false` | デフォルトの `config.json` テンプレートをプロジェクトルートに初期生成する |
| `--config <path>` | なし | path | なし | カスタム `config.json` 設定ファイルのパス指定 |
| `--dry-run` | なし | flag | `false` | クリップボードへの書き込みを行わず標準出力へのみ出力する |
| `-r, --refresh` | `-r` | flag | `false` | 艦娘・装備マスタデータをリモートから強制再取得・更新する |
| `--validate` | なし | flag | `false` | 入力データの構造整合性および未知の ID チェックを実行する |

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

#### YAML 出力例
```yaml
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

---

### LICENSE

このプロジェクトのライセンスはMITです。詳しくは[LICENSE.MIT](LICENSE.MIT)をお読みください。また、サードパーティライセンスは[NOTICE.md](NOTICE.md)に表記してあります。

---

## English

`kcyaml` is a command-line tool designed to parse Deck Builder format JSON data exported from Kantai Collection (KanColle) fleet simulators, converting it into Markdown YAML codeblocks and 256-color optimized PNG fleet organization images.

### Key Features

- **Deck Builder JSON Parsing & YAML Conversion**:
  - Parses fleet (Fleets 1 to 4) and land-based air base (Bases 1 to 3) data from either the system clipboard or local JSON files.
  - Formats output into clean Markdown structures while preserving ship levels, equipment, expansion slots, and equipment improvement levels (`☆N`). (Note: Aircraft proficiency `mas` is automatically excluded).
- **Fleet Image Generation via System Browser Detection (`-g`)**:
  - Automatically detects and controls system browsers (Google Chrome, Microsoft Edge, Brave, etc.) installed on the OS in headless mode without downloading extra Chromium binaries.
  - Instantly renders high-quality fleet composition images using themes fully compatible with simulators (`official`, `dark`, `light`, `74lc`, etc.).
- **256-Color Palette Quantization & Optimization**:
  - Generated PNG images are processed via `sharp` for 256-color palette quantization and metadata stripping, significantly reducing file sizes while maintaining visual quality.
- **Native OS File Save Dialog**:
  - Displays native OS file explorer save dialogs (Windows Explorer / macOS Finder / Linux GTK) when selecting output file paths.
- **External Configuration (`config.json`) & Automatic Fallback Protection**:
  - Customizes remote asset URLs, debug logging toggles, and default themes.
  - Includes an automatic fallback mechanism that switches to safe default rendering parameters if remote asset retrieval fails or times out.

### System Requirements

- **Runtime**: Node.js v18.0.0 or higher (or Bun environment)
- **Supported OS**: Windows 11 / 10, macOS, Linux
- **Required Browsers (for image generation `-g`)**:
  - One of the following browsers must be installed on your OS:
    - **Windows**: Microsoft Edge or Google Chrome
    - **macOS**: Google Chrome, Microsoft Edge, or Brave
    - **Linux**: Chromium or Google Chrome

### Installation

```bash
# Clone repository and build
git clone https://github.com/DovahkiinYuzuko/KanColle-Yuzuko-Blog.git
cd kcyaml
npm install
npm run build

# Link globally
npm link
```

---

### Usage & Command Examples

#### 1. Conversion from Clipboard (Standard Execution)
Copy Deck Builder JSON from your web simulator, then run:

```bash
kcyaml -f 1 2
```

#### 2. Conversion from JSON File with Image (PNG) Generation
```bash
kcyaml -f 1 2 -i input.json -g -o
```

#### 3. Skip Save Dialog and Auto-Save
```bash
kcyaml -f 1 2 -i input.json -g --no-dialog -o
```

#### 4. Generate Default Configuration (`config.json`)
```bash
kcyaml --init-config
```

---

### Command Line Options Details

| Option | Short | Type | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `--fleet <numbers...>` | `-f` | numbers | `1` | Fleet numbers to convert (e.g., `-f 1 2 3`) |
| `--air <numbers...>` | `-a` | numbers | None | Land-based air base numbers to convert (e.g., `-a 1 2`) |
| `--title <string>` | `-t` | string | None | Parent key title name in YAML structure |
| `--fleet-title <string>` | `--ft` | string | None | Fleet-specific parent key title name |
| `--air-title <string>` | `--at` | string | None | Air base-specific parent key title name |
| `--input <path>` | `-i` | path | Clipboard | Input JSON file path |
| `--output [path]` | `-o` | path | None | Text output file path (auto-saves if specified without value) |
| `--image` | `-g` | flag | `false` | Generate fleet composition images (PNG) |
| `--image-theme <theme>` | None | string | `official` | Display theme (`official`, `dark`, `light`, `74lc`, etc.) |
| `--image-output <path>` | None | path | None | File path specification for output image |
| `--no-dialog` | None | flag | `false` | Skip native OS file explorer save dialog |
| `--init-config` | None | flag | `false` | Initialize default `config.json` template in project root |
| `--config <path>` | None | path | None | Custom `config.json` file path specification |
| `--dry-run` | None | flag | `false` | Output to stdout only without writing to clipboard |
| `-r, --refresh` | `-r` | flag | `false` | Force refetch and update master data from remote repository |
| `--validate` | None | flag | `false` | Perform data structure integrity and unknown ID validation |

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

#### YAML Output Example
```yaml
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

---

### LICENSE

This project is licensed under the MIT License. For details, please read [LICENSE.MIT](LICENSE.MIT). Third-party licenses are documented in [NOTICE.md](NOTICE.md).
