---
source_file: "kcyaml/src/imageGenerator.ts"
language: "TypeScript"
description: "Generates 256-color optimized fleet organization PNG images using gkcoi and sharp."
tags: [@KcYamlImageGenerator]
exports:
  - generateFleetImage
imports:
  - "kcyaml/src/types.ts"
---

# `imageGenerator.ts` Specification

## Functions

### `generateFleetImage`
* **Description:** Generates fleet composition PNG image from DeckBuilder data with 256-color optimization and metadata removal.
* **Parameters:**
  * `deckData`: `DeckBuilder` object containing fleet formation.
  * `theme`: `string` - Theme for image (default: `"official"`).
* **Return:** `Promise<Buffer>` - 256-color optimized PNG image buffer.
