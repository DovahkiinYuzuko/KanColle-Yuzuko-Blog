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
* **Description:** 艦隊・基地航空隊構造およびタイトル名を受け取り、Markdown（YAMLコードブロック含む）文字列を生成する。

### `buildYamlOutput` (L79-112)
* **Type:** `function`
* **Description:** `.yaml` ファイル出力用に、Markdown装飾を除外した純粋な YAML 文字列を生成する。