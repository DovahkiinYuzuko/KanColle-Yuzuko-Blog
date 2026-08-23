---
source_file: "kctemp/bin/kctemp.js"
language: "JavaScript"
type: "CLI"
description: "Executable binary wrapper launching src/index.js."
tags: ["@CLI"]
related:
  exports: []
  imports:
    - "kctemp/src/index.js"
---

# [JavaScript]kctemp

## Overview
Serves as the executable CLI binary wrapper (`bin/kctemp.js`) invoked globally or locally. Delegates execution directly to `src/index.js`.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    kctemp["[JavaScript]kctemp"] --> index["index.js"]
```

### Impact Scope
* Directly executed by user CLI invocations (`npx kctemp` or `kctemp`).

