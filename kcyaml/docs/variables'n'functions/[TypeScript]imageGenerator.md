---
source_file: "kcyaml/src/imageGenerator.ts"
language: "TypeScript"
description: "Generates fleet organization images using system headless browser (Edge/Chrome) via puppeteer-core, optimized to 256 colors with sharp."
tags: [@KcYamlImageGenerator]
exports:
  - generateFleetImage
imports:
  - "kcyaml/src/browserDetector.ts"
  - "kcyaml/src/configManager.ts"
---

# `imageGenerator.ts` Specification

## Functions

### `getGkcoiBrowserBundle`
* **Description:** Bundles `gkcoi` into an IIFE browser script using `esbuild.build` with dynamic path resolution (`import.meta.dirname` / `fileURLToPath(import.meta.url)`) to support portable resolution across environments.

### `generateFleetImage`
* **Description:** Launches detected system browser in headless mode via `puppeteer-core`, renders fleet composition image via `gkcoi`, extracts PNG buffer, and performs 256-color palette quantization using `sharp`.
* **Arguments:**
  * `deckBuilder`: `DeckBuilder` object containing fleet composition
  * `theme`: `string` (Theme name, default: `'official'`)
* **Return Value:** `Promise<Buffer>` (PNG image buffer optimized to 256-color palette)
