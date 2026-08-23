---
source_file: "kctemp/src/locales/ja.js"
language: "JavaScript"
type: "Locale"
description: "Centralized Japanese message and prompt text definitions for kctemp."
tags: ["@Locale"]
related:
  exports:
    - "kctemp/src/prompts/uiPrompts.js"
    - "kctemp/src/fsm/states.js"
    - "kctemp/src/index.js"
  imports: []
---

# [JavaScript]ja

## Overview
Provides centralized Japanese messages, prompt labels, and error text for the kctemp CLI application.

## Dependencies & Impact Scope
### Dependency Diagram
```mermaid
graph TD
    ja["[JavaScript]ja"] --> None["No Dependencies"]
```

### Impact Scope
* Used across UI prompts, state handlers, and application logging.

## Exported Variables

### (Variable) `messages`
* **Type:** `object`
* **Description:** Hierarchical dictionary containing categorized UI text, prompts, and formatted error messages.
