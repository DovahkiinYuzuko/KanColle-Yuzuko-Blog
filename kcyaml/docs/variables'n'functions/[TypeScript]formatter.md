---
source_file: "kcyaml/src/formatter.ts"
language: "TypeScript"
description: "Generates Markdown formatted string containing YAML codeblocks from parsed fleet and air base structures."
tags: [@KcYamlFormatter]
exports:
  - `buildMarkdownOutput`
imports:
  - "kcyaml/src/types.ts"
---

# Specification: `formatter.ts`

## Overview
`formatter.ts` はパース済みの艦隊・基地航空隊データを受け取り、MarkdownのYAMLコードブロック文字列を生成する。

## Variables and Functions

### `buildMarkdownOutput` (L3-72)
* **Type:** `function`
* **Description:** 艦隊・基地航空隊構造およびタイトル名を受け取り、仕様通りの Markdown 文字列を生成する。