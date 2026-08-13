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

### `MasterShip`
* **Description:** Represents master ship parameters for stats calculation and image generation.
  * `firepower?: number`: Modernization MAX firepower.
  * `torpedo?: number`: Modernization MAX torpedo.
  * `antiAir?: number`: Modernization MAX anti-air.
  * `armor?: number`: Modernization MAX armor.
  * `hp?: number`: Base ship HP.
  * `luck?: number`: Base ship Luck.
  * `minScout?: number`: Lv1 base LoS.
  * `maxScout?: number`: Lv99 max LoS.
  * `minAvoid?: number`: Lv1 base evasion.
  * `maxAvoid?: number`: Lv99 max evasion.
  * `minAsw?: number`: Lv1 base ASW.
  * `maxAsw?: number`: Lv99 max ASW.

### `MasterItem`
* **Description:** Represents master slotitem parameters for stats calculation and image generation.
  * `firepower?: number`: Item firepower.
  * `torpedo?: number`: Item torpedo.
  * `taiku?: number`: Item anti-air.
  * `armor?: number`: Item armor.
  * `asw?: number`: Item ASW.
  * `evasion?: number`: Item evasion.
  * `saku?: number`: Item scout/LoS.

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