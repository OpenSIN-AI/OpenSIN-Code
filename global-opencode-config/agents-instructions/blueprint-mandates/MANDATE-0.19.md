# MANDATE 0.19: MODERN CLI TOOLCHAIN (2026 STANDARD)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** All OpenCode agents, all bash operations, all CLI scripts  
**REFERENCE:** `/Users/jeremy/dev/sin-code/OpenCode/ALTERnative.md` (600+ lines)

#### Forbidden (Legacy) Tools
- ❌ `grep` → Use `ripgrep (rg)` — 60x faster
- ❌ `find` → Use `fd` or `fast-glob` — 15x faster
- ❌ `sed` → Use `sd` — 10x faster  
- ❌ `awk` → Use `ugrep` or `ripgrep` — 10x faster
- ❌ `cat/head/tail` → Use `bat` — Syntax highlighting + git integration
- ❌ `ls` → Use `exa` or `lsd` — 2x faster + colors

#### Mandatory (2026) Tools
- ✅ **ripgrep (rg)** - Code search, 60x faster than grep
- ✅ **fd** - File discovery, 15x faster than find
- ✅ **fast-glob** - Node.js globbing, 3-15x faster than glob
- ✅ **sd** - Stream editor, 10x faster than sed
- ✅ **tree-sitter** - AST parsing, syntax-aware, 99%+ accurate
- ✅ **bat** - File viewing with syntax highlighting and git diff
- ✅ **exa/lsd** - Directory listing with git integration
- ✅ **Deno/Bun** - Runtime, 5-10x startup faster than Node.js

#### Installation Requirements

**Local macOS:**
```bash
brew install ripgrep fd sd bat exa deno

# For npm projects
npm install -D @vscode/ripgrep fast-glob tree-sitter tree-sitter-typescript
```

**Docker (all agent containers):**
```dockerfile
RUN apt-get update && apt-get install -y \
    ripgrep \
    fd-find \
    sd \
    bat \
    exa \
    && rm -rf /var/lib/apt/lists/*
```

#### Performance Requirements

All CLI operations must meet these standards:
- **Search:** ripgrep exclusively (parallelized by default)
- **Globbing:** fast-glob or fd (automatic .gitignore support)
- **Replacement:** sd instead of sed
- **AST Operations:** tree-sitter for syntax-aware queries
- **Execution:** < 1 second for typical codebases

#### Code Standards

1. **NO `grep` in scripts** - Use `rg` instead
   ```bash
   # ❌ WRONG
   grep -r "pattern" src/
   
   # ✅ CORRECT
   rg "pattern" src/
   ```

2. **NO `find` for globbing** - Use `fd` instead
   ```bash
   # ❌ WRONG
   find . -name "*.ts" -type f
   
   # ✅ CORRECT
   fd -e ts -t f
   ```

3. **NO `sed` replacements** - Use `sd` instead
   ```bash
   # ❌ WRONG
   sed -i 's/old/new/g' file.txt
   
   # ✅ CORRECT
   sd "old" "new" file.txt
   ```

4. **NO `cat` for code viewing** - Use `bat` instead
   ```bash
   # ❌ WRONG
   cat main.ts | grep "function"
   
   # ✅ CORRECT
   bat main.ts | rg "function"
   ```

5. **AST-based refactoring must use tree-sitter** - NOT regex
   ```typescript
   // ✅ CORRECT: Syntax-aware queries
   import Parser from "tree-sitter";
   import TypeScript from "tree-sitter-typescript";
   
   const parser = new Parser();
   parser.setLanguage(TypeScript.typescript);
   const tree = parser.parse(sourceCode);
   ```

#### Fallback Chain

If a tool is unavailable:
1. Check local installation: `which rg`
2. Try npm wrapper: `@vscode/ripgrep`
3. Fall back to legacy tool with performance warning
4. Log issue to `troubleshooting/ts-ticket-XX.md`

#### Verification Checklist

- [ ] All agent Dockerfiles updated with new tools
- [ ] All bash scripts refactored to use modern tools
- [ ] Zero `grep -r` warnings in code review
- [ ] AST operations use tree-sitter (not regex parsing)
- [ ] Performance benchmarks confirm 5x+ improvement
- [ ] .gitignore respected automatically by all tools
- [ ] Container image sizes < 500MB (all tools included)
- [ ] Local development environment matches containers

#### Elite Guide

See `/Users/jeremy/dev/sin-code/OpenCode/ALTERnative.md` for:
- Detailed tool comparison tables
- Installation instructions for all platforms
- Performance benchmarks (5-60x improvements)
- OpenCode integration examples
- Docker setup guide
- Migration checklist

---

**Source:** ~/.config/opencode/Agents.md (Line 1233-1364)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
