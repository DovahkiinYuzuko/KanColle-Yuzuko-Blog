---
source_file: "kctemp/src/services/configService.js"
language: "JavaScript"
type: "Service"
description: "Handles reading and writing of configuration settings to config.json."
tags: ["@Config"]
related:
  exports:
    - "kctemp/src/fsm/states.js"
    - "kctemp/src/index.js"
  imports: []
---

# [JavaScript]configService

## Overview
Manages loading, updating, and persisting configuration options (e.g. `lastOutputDir`, `defaultRepeatCount`) for the kctemp tool.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    configService["[JavaScript]configService"] --> FileSystem["Node.js fs/promises"]
```

### Impact Scope
* Directly influences output directory default values in interactive prompts.

## Exported Functions

### (Function) `loadConfig`
* **Description:** Reads configuration from `config.json` or returns default configuration on missing/corrupted file.
* **Arguments:** None
* **Returns:** `Promise<object>`

### (Function) `saveConfig`
* **Description:** Persists updated configuration object into `config.json`.
* **Arguments:**
  * `newConfig` (`object`): Updated configuration key-value pairs.
* **Returns:** `Promise<void>`
