---
source_file: "kctemp/bin/kctemp.js"
language: "JavaScript"
type: "CLI"
description: "Executable binary wrapper detecting Bun/Node.js runtime and launching src/index.js."
tags: ["@CLI"]
related:
  exports: []
  imports:
    - "kctemp/src/index.js"
---

# [JavaScript]kctemp

## Overview
Serves as the executable CLI binary wrapper (`bin/kctemp.js`) invoked globally or locally. Checks runtime availability and delegates execution to `src/index.js`.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    kctemp["[JavaScript]kctemp"] --> index["index.js"]
    kctemp --> Runtime["Bun or Node.js runtime"]
```

### Impact Scope
* Directly executed by user CLI invocations (`npx kctemp` or `kctemp`).

## Internal Variables

### (Variable) `isBun`
* **Type:** `boolean`
* **Description:** Indicates whether the current runtime environment is running under Bun.
