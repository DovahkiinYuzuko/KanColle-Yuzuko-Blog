# kcyaml (艦これDeck Builder JSON to Markdown YAML Converter) / kcyaml

艦これのDeck Builder形式JSONをMarkdown YAMLおよび編成画像に変換するCLIツール / CLI tool for converting KanColle Deck Builder format JSON into Markdown YAML and fleet images

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square&logo=opensourceinitiative&logoColor=white)](LICENSE.MIT)
![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green?style=flat-square&logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript&logoColor=white)

[日本語](#日本語) | [English](#english)

---

## 日本語

`kcyaml` は、艦隊これくしょん -艦これ- の各種編成シミュレーター等で出力される Deck Builder 形式の JSON データをパースし、Markdown 形式の YAML コードブロックおよび 256 色軽量化 PNG 画像へ変換・出力する CLI ツールです。

### 主な機能

- **Deck Builder JSON の自動変換**: クリップボードまたはローカルの JSON ファイルから艦隊・基地航空隊の編成情報をパースし、Markdown YAML 形式で出力します。
- **編成画像の自動生成 (`-g`)**: OS にインストールされている標準ブラウザ（Google Chrome または Microsoft Edge）を自動探知してバックグラウンド制御し、制空権シミュレーター等と完全互換のある高品質な編成画像（PNG）を生成します。
- **256色軽量化・圧縮**: 生成された画像はカラーパレット化および不要メタデータの削除が行われ、超軽量 PNG として保存されます。
- **OS標準保存ダイアログの呼び出し**: 保存先の選択時に、Windows/macOS/Linux のネイティブエクスプローラーダイアログを自動起動して指定可能です。
- **外部設定ファイル (`config.json`) サポート**: アセット取得 URL、デバッグログの制御、デフォルトテーマなどを外部ファイルで管理できます。

### 動作要件

- Node.js v18 以上 (または Bun)
- OS にインストール済みの Google Chrome または Microsoft Edge (画像生成機能利用時)

### インストール方法

```bash
npm install
npm run build
npm link
```

### 使用方法

#### クリップボードからの変換
クリップボードに Deck Builder 形式の JSON をコピーした状態で以下を実行します。

```bash
kcyaml -f 1 2
```

#### JSON ファイルからの変換および編成画像の同時生成
```bash
kcyaml -f 1 2 -i input.json -g -o
```

#### コマンドラインオプション一覧

| オプション | 説明 | デフォルト値 |
| :--- | :--- | :--- |
| `-f, --fleet <numbers...>` | 変換対象の艦隊番号 (例: `-f 1 2`) | `1` |
| `-a, --air <numbers...>` | 変換対象の基地航空隊番号 (例: `-a 1 2`) | なし |
| `-t, --title <string>` | YAML 内の親キータイトル名 | なし |
| `-i, --input <path>` | 入力 JSON ファイルのパス (未指定時はクリップボード) | クリップボード |
| `-o, --output [path]` | テキスト出力ファイルパス (引数なしの場合は自動保存) | なし |
| `-g, --image` | 編成画像 (PNG) を自動出力する | `false` |
| `--image-theme <theme>` | 編成画像の表示テーマ (`official`, `dark`, `light`, `74lc` 等) | `official` |
| `--no-dialog` | OS エクスプローラー保存ダイアログの表示をスキップする | `false` |
| `--init-config` | デフォルトの `config.json` をプロジェクトルートに生成する | `false` |
| `-r, --refresh` | マスタデータをリモートから強制再取得・更新する | `false` |
| `--validate` | 入力データの整合性・未知の ID チェックを実行する | `false` |

### 設定ファイル (`config.json`)

`kcyaml --init-config` を実行することで、設定ファイルのテンプレートをプロジェクトルートに作成できます。

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

### LICENSE

このプロジェクトのライセンスはMITです。詳しくは[LICENSE.MIT](LICENSE.MIT)をお読みください。また、サードパーティライセンスは[NOTICE.md](NOTICE.md)に表記してあります。

---

## English

`kcyaml` is a CLI tool designed to parse Deck Builder format JSON data exported from Kantai Collection (KanColle) fleet simulators, converting it into Markdown YAML codeblocks and 256-color optimized PNG fleet organization images.

### Features

- **Automated Deck Builder JSON Conversion**: Parses fleet and land-based air base organization data from either the system clipboard or local JSON files into Markdown YAML format.
- **Fleet Image Generation (`-g`)**: Automatically detects and controls system browsers (Google Chrome or Microsoft Edge) in headless mode to render high-quality fleet composition images fully compatible with simulators.
- **256-Color Palette Quantization**: Generated images undergo color palette quantization and metadata stripping, producing ultra-lightweight PNG files.
- **Native OS Save File Dialog**: Automatically launches Windows/macOS/Linux native file explorer save dialogs when selecting output file paths.
- **External Configuration (`config.json`) Support**: Manages asset URLs, debug logging toggles, and default themes through an external configuration file.

### Requirements

- Node.js v18 or higher (or Bun)
- Google Chrome or Microsoft Edge installed on the OS (required for image generation)

### Installation

```bash
npm install
npm run build
npm link
```

### Usage

#### Converting from Clipboard
Copy Deck Builder format JSON to your clipboard and run:

```bash
kcyaml -f 1 2
```

#### Converting from JSON File with Image Output
```bash
kcyaml -f 1 2 -i input.json -g -o
```

#### Command Line Options

| Option | Description | Default |
| :--- | :--- | :--- |
| `-f, --fleet <numbers...>` | Fleet numbers to convert (e.g., `-f 1 2`) | `1` |
| `-a, --air <numbers...>` | Land-based air base numbers to convert (e.g., `-a 1 2`) | None |
| `-t, --title <string>` | Title string for the parent key in YAML | None |
| `-i, --input <path>` | Input JSON file path (reads from clipboard if omitted) | Clipboard |
| `-o, --output [path]` | Text output file path (auto-saves if specified without argument) | None |
| `-g, --image` | Generate fleet composition images (PNG) | `false` |
| `--image-theme <theme>` | Fleet image display theme (`official`, `dark`, `light`, `74lc`, etc.) | `official` |
| `--no-dialog` | Skip native OS file explorer save dialog | `false` |
| `--init-config` | Initialize default `config.json` in the project root | `false` |
| `-r, --refresh` | Force refetch and update master data from remote source | `false` |
| `--validate` | Perform data integrity and unknown ID validation | `false` |

### Configuration File (`config.json`)

Run `kcyaml --init-config` to generate a default configuration file template in the project root.

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

### LICENSE

This project is licensed under the MIT License. For details, please read [LICENSE.MIT](LICENSE.MIT). Third-party licenses are documented in [NOTICE.md](NOTICE.md).
