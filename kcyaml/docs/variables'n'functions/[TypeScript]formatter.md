---
source_file: "kcyaml/src/formatter.ts"
language: "TypeScript"
description: "Generates Markdown or pure YAML formatted string from parsed fleet and air base structures."
tags: [@KcYamlFormatter]
exports:
  - `buildMarkdownOutput`
  - `buildYamlOutput`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `formatter.ts`

## Overview
`formatter.ts` はパース済みの艦隊・基地航空隊データを受け取り、Markdown形式または純粋なYAML形式の文字列を生成する。

## Variables and Functions

### `buildMarkdownOutput` (L26-77)
* **Type:** `function`
* **Description:** 艦隊・基地航空隊構造およびタイトル名を受け取り、Markdown（YAMLコードブロック含む）文字列を生成する。第1艦隊と第2艦隊の両方が存在し `options.rengo` が有効な場合、最上部に `連合艦隊` ヘッダーを出力し、各艦隊の個別制空値・33式表示を抑制した上で、全艦隊ブロックの直下に全体の合計制空値と33式分岐点係数テーブルを出力する。単一艦隊または第1・第2艦隊を含まない場合は通常艦隊形式で出力する。

### `buildYamlOutput` (L79-112)
* **Type:** `function`
* **Description:** `.yaml` ファイル出力用に、Markdown装飾を除外した純粋な YAML 文字列を生成する。