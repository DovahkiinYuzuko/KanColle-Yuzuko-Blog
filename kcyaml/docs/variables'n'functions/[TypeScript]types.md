---
source_file: "kcyaml/src/types.ts"
language: "TypeScript"
description: "Core interfaces and type definitions for DeckBuilder JSON, Master Data, CLI Options, and KcYamlConfig."
tags: [@KcYamlTypes]
exports:
  - MasterShip
  - MasterItem
  - MasterData
  - DeckBuilderData
  - ParsedData
  - CliOptions
  - KcYamlConfig
imports: []
---

# `types.ts` Specification

## Interfaces

### `KcYamlConfig`
* **Description:** Represents external configuration schema loaded from `config.json`.

### `CliOptions`
* **Description:** Command line flags and options parsed by Commander.