---
source_file: "kctemp/src/index.js"
language: "JavaScript"
type: "CLI"
description: "Application main entrypoint that initializes the state machine and runs the CLI."
tags: ["@CLI"]
related:
  exports:
    - "kctemp/bin/kctemp.js"
  imports:
    - "kctemp/src/fsm/stateMachine.js"
    - "kctemp/src/fsm/states.js"
---

# [JavaScript]index

## Overview
Bootstraps the `kctemp` CLI application, sets up initial FSM context, and initiates execution.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    index["[JavaScript]index"] --> stateMachine["stateMachine"]
    index --> states["states"]
```

### Impact Scope
* Serves as the core entrypoint invoked by `bin/kctemp.js` or `node src/index.js`.

## Exported Functions

### (Function) `main` (L4-16)
* **Description:** Initializes StateMachine with initial state `SELECT_TEMPLATE` and executes the run loop.
* **Arguments:** None
* **Returns:** `Promise<void>`