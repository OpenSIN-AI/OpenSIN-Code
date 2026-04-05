# Shell Strategy Skill

Prevents interactive shell hangs in non-TTY environments.

## Problem

Commands like `vim`, `top`, `git add -p` require interactive input and will hang indefinitely in automated contexts.

## Solution

This skill provides:

1. **Detection** — `isInteractiveCommand()` checks if a command will hang
2. **Auto-fix** — `makeNonInteractive()` converts commands to safe alternatives
3. **Instructions** — Comprehensive guide for LLMs on safe command usage

## Usage

```typescript
import { isInteractiveCommand, makeNonInteractive } from '@opensin/sdk';

isInteractiveCommand('git add -p');     // true
isInteractiveCommand('git add .');      // false

makeNonInteractive('git log');          // 'git --no-pager log'
makeNonInteractive('npm init');         // 'npm init -y'
makeNonInteractive('top');              // 'top -b -n 1'
```

## Safe Alternatives Quick Reference

| Interactive | Non-Interactive |
|-------------|-----------------|
| `git add -p` | `git add .` |
| `npm init` | `npm init -y` |
| `docker login` | `echo "$PASS" \| docker login -u $USER --password-stdin` |
| `ssh-keygen` | `ssh-keygen -t ed25519 -f key -N ""` |
| `vim file` | `sed -i 's/old/new/g' file` |
| `top` | `top -b -n 1` |
| `man ls` | `ls --help` |
