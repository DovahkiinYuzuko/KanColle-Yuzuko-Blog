---
source_file: "kctemp/src/fsm/stateMachine.js"
language: "JavaScript"
type: "FSM"
description: "Core Finite State Machine engine managing steps, context, and state transitions."
tags: ["@FSM"]
related:
  exports:
    - "kctemp/src/index.js"
  imports: []
---

# [JavaScript]stateMachine

## Overview
Provides a generic, lightweight Finite State Machine (FSM) class that holds workflow context and executes state handlers.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    stateMachine["[JavaScript]stateMachine"] --> None["No External Dependencies"]
```

### Impact Scope
* Coordinates the lifecycle and navigation across all interactive CLI phases.

## Exported Classes

### (Class) `StateMachine`
* **Description:** Manages current state, context data, history, and transition execution.

#### (Method) `transitionTo`
* **Description:** Switches the machine to a new state and executes its handler.
* **Arguments:**
  * `nextState` (`string`): Target state name.
* **Returns:** `Promise<void>`

#### (Method) `run`
* **Description:** Starts state machine execution from the initial state until reaching a terminal state.
* **Arguments:** None
* **Returns:** `Promise<void>`
