---
description: Add emoji stickers as reactions to code changes
argument-hint: [emoji] [--last-change] [--file FILE]
allowed-tools: [Read, Edit]
---

# /stickers

Add emoji stickers as reactions to code changes.

## Usage

```bash
/stickers 🎉
/stickers 🔥 --last-change
/stickers 💯 --file src/main.ts
```

## What this does

- Adds emoji comments to recently changed code
- Fun way to celebrate good code
- Can be used to mark important sections
- Supports all Unicode emojis

## Examples

```typescript
// 🎉 New feature added!
export function newFeature() { ... }

// 🔥 Hot fix
function criticalFix() { ... }

// 💯 Perfect implementation
function perfectCode() { ... }
```
