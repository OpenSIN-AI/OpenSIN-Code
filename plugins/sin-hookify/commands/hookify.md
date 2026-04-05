---
description: Create hookify rules from natural language instructions
argument-hint: [rule description]
allowed-tools: [Write, Read, Edit]
---

# /hookify

Create hook rules from natural language instructions.

## Usage

```
/hookify Warn me when I use rm -rf commands
/hookify Don't use console.log in TypeScript files
/hookify Block all npm publish commands
```

## What this does

Analyzes your request and creates a `.opensin/hookify.*.local.md` rule file.

## Rules take effect immediately

No restart needed! Rules are evaluated on the very next tool use.

## Examples

### Block dangerous commands
```
/hookify Block rm -rf, dd, and mkfs commands
```
Creates a rule with `action: block` for bash events.

### Warn about debug code
```
/hookify Warn when console.log or debugger is added
```
Creates a rule with `action: warn` for file events.

### Require tests before stopping
```
/hookify Block stopping if no tests were run
```
Creates a rule with `action: block` for stop events.
