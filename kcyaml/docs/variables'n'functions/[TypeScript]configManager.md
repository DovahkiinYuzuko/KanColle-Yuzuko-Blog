---
source_file: "kcyaml/src/configManager.ts"
language: "TypeScript"
description: "Manages config.json loading, fallback defaults merging, and template initialization for kcyaml."
tags: [@KcYamlConfigManager]
exports:
  - loadAppConfig
  - initConfigFile
  - DEFAULT_CONFIG
imports:
  - "kcyaml/src/types.ts"
---

# `configManager.ts` Specification

## Constants

### `DEFAULT_CONFIG`
* **Description:** Default fallback configuration values used when `config.json` is missing or partially specified.

## Functions

### `loadAppConfig`
* **Description:** Reads `config.json` from the project root if available, and deep-merges it with `DEFAULT_CONFIG`.
* **Return Value:** `KcYamlConfig`

### `initConfigFile`
* **Description:** Generates a default template `config.json` in the project root directory.
* **Return Value:** `string` (Path to created config file)
