---
source_file: "kcyaml/src/browserDetector.ts"
language: "TypeScript"
description: "Detects system default and installed Chromium-based browsers across Windows, macOS, and Linux."
tags: [@KcYamlBrowserDetector]
exports:
  - detectSystemBrowserPath
imports: []
---

# `browserDetector.ts` Specification

## Functions

### `detectSystemBrowserPath`
* **Description:** Queries OS registry / system settings to retrieve default HTTP browser path, or falls back to standard installation paths (Edge / Chrome / Chromium) for headless rendering.
* **Return Value:** `string | null` (Executable path of the detected browser, or null if not found)
