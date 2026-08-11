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
  * `exactMas?: boolean`: If true, uses exact `mas` (proficiency) values from JSON instead of default MAX (7) calculation.
  * `rengo?: boolean`: If true, formats multiple fleets into Combined Fleet (連合艦隊) layout.

### `ParsedData`
* **Description:** Parsed fleet and air base structures.
  * `combinedFighterPower?: number`: Sum of Fighter Power across all combined fleets.
  * `combinedSaku33?: { c1: number; c2: number; c3: number; c4: number }`: Combined Formula 33 Effective Search Power across all combined fleets.