---
source_file: "kctemp/src/services/astService.js"
language: "JavaScript"
type: "Service"
description: "Parses Markdown into AST, filters/repeats sections, replaces variables safely via single-pass token replacement, and serializes back to Markdown."
tags: ["@AST"]
related:
  exports:
    - "kctemp/src/fsm/states.js"
  imports: []
---

# [JavaScript]astService

## Overview
Provides AST manipulation functionality via `unified`, `remark-parse`, and `remark-stringify` to parse markdown, extract hierarchical sections, duplicate repeated blocks, substitute variables safely using single-pass token matching to prevent secondary substitution bugs, and serialize clean markdown output.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    astService["[JavaScript]astService"] --> Unified["unified, remark-parse, remark-stringify, unist-util-visit"]
```

### Impact Scope
* Directly governs the output Markdown structural integrity and content generation.

## Exported Functions

### (Function) `parseMarkdownToAst` (L6-9)
* **Description:** Parses a Markdown string into an MDAST syntax tree.
* **Arguments:**
  * `markdownText` (`string`): Raw markdown string.
* **Returns:** `object`

### (Function) `extractSections` (L29-68)
* **Description:** Parses MDAST root and extracts a flat array of heading metadata (headings and associated content node boundaries).
* **Arguments:**
  * `tree` (`object`): MDAST root node.
* **Returns:** `Array<{id: string, depth: number, title: string, startNodeIndex: number, endNodeIndex: number}>`

### (Function) `buildSectionTree` (L70-108)
* **Description:** Constructs a nested section hierarchy tree from MDAST root children.
* **Arguments:**
  * `tree` (`object`): MDAST root node.
* **Returns:** `object`

### (Function) `generateMarkdown` (L205-234)
* **Description:** Builds a target AST based on selected sections, repeat configs, and variable mappings (preserving literal replacement patterns and ensuring selected descendants are rendered even if parent is unselected, executing single-pass token replacement to avoid multi-pass replacement hazards), then serializes it to Markdown text.
* **Arguments:**
  * `rawMarkdown` (`string`): Original template markdown.
  * `selectedSectionIds` (`string[]`): Array of selected section identifiers.
  * `repeatConfigs` (`object`): Dictionary mapping section IDs to repetition counts.
  * `globalVariables` (`object`): Key-value pairs for global replacements.
  * `repeatVariables` (`object`): Key-value pairs indexed by repeat block and index.
* **Returns:** `string`
