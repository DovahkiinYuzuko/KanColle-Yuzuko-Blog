---
source_file: "kcyaml/src/fileDialog.ts"
language: "TypeScript"
description: "Launches cross-platform native save file dialog to select image output path."
tags: [@KcYamlFileDialog]
exports:
  - promptSaveFilePath
imports:
  - "kcyaml/src/types.ts"
---

# `fileDialog.ts` Specification

## Functions

### `promptSaveFilePath`
* **Description:** Launches native save file dialog for Windows, macOS, or Linux to get destination file path.
* **Parameters:**
  * `defaultName`: `string` - Default file name for the save dialog.
* **Return:** `Promise<string | null>` - Selected file path or null if canceled.
