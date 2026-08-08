---
source_file: "kcyaml/src/cli.ts"
language: "TypeScript"
description: "Parses command line flags using Commander, merges config.json settings, supports --init-config, and coordinates Markdown YAML and fleet image output."
tags: [@KcYamlCLI]
exports:
  - runCli
imports:
  - "kcyaml/src/types.ts"
  - "kcyaml/src/masterData.ts"
  - "kcyaml/src/parser.ts"
  - "kcyaml/src/formatter.ts"
  - "kcyaml/src/imageGenerator.ts"
  - "kcyaml/src/fileDialog.ts"
  - "kcyaml/src/configManager.ts"
---

# `cli.ts` Specification

## Functions

### `runCli`
* **Description:** Main CLI entrypoint. Parses Commander flags, merges with `config.json` settings, handles `--init-config`, and coordinates YAML/image output pipelines.

### `sendOsNotification`
* **Description:** Sends native OS notification on successful clipboard copy or file export.

### `getFormattedTimestamp`
* **Description:** Returns current timestamp formatted as `YYYYMMDD_HHMMSS`.