# 🚀 COMPLIANCE CHECKLIST - MASTER REFERENCE

**Version:** 1.0.0 | **Created:** 2026-01-29 | **Source:** AGENTS.md V19.2

> ⚠️ **CRITICAL:** This checklist MUST be verified after EVERY task. Violations = Technical Treason.

---

## 📋 TABLE OF CONTENTS

1. [Quick Reference (Daily Use)](#quick-reference-daily-use)
2. [Pre-Execution Checklist](#pre-execution-checklist)
3. [During Execution Checklist](#during-execution-checklist)
4. [Post-Execution Checklist](#post-execution-checklist)
5. [Git Workflow Checklist](#git-workflow-checklist)
6. [Documentation Checklist](#documentation-checklist)
7. [Code Quality Checklist](#code-quality-checklist)
8. [Security Checklist](#security-checklist)
9. [Mandate Reference Index](#mandate-reference-index)

---

## ⚡ QUICK REFERENCE (DAILY USE)

### The "BIG 7" - Never Skip These

```
┌─────────────────────────────────────────────────────────────┐
│  🚨 ABSOLUTE NON-NEGOTIABLES - VERIFY BEFORE EVERY TASK     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✅ 1. TODO System Active          [ ] YES  [ ] NO          │
│  ✅ 2. Read lastchanges.md         [ ] YES  [ ] NO          │
│  ✅ 3. Read BLUEPRINT.md           [ ] YES  [ ] NO          │
│  ✅ 4. Git Add + Commit + Push     [ ] YES  [ ] NO          │
│  ✅ 5. Update Documentation        [ ] YES  [ ] NO          │
│  ✅ 6. No Blind Deletion            [ ] YES  [ ] NO          │
│  ✅ 7. Tests Pass Before Commit    [ ] YES  [ ] NO          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Status Command (Copy & Paste After Every Task)

```bash
# Run this after completing any work:
echo "=== COMPLIANCE VERIFICATION ===" && \
git add -A && \
git status && \
echo "=== TODO CHECK ===" && \
echo "☐ lastchanges.md updated" && \
echo "☐ userprompts.md updated" && \
echo "☐ README.md updated" && \
echo "☐ TASKS.md updated" && \
echo "☐ /docs/ updated" && \
echo "=== READY TO COMMIT ==="
```

---

## 📖 PRE-EXECUTION CHECKLIST

### Phase 1: Context Acquisition (MANDATORY)

**Reference:** @~/.config/opencode/AGENTS.md#RULE-2

#### Project Context
- [ ] **Read lastchanges.md** | Understand what was last changed
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Location: `/projectname/lastchanges.md` or `/projectname/projektname-lastchanges.md`
  
- [ ] **Read conductor.py** | Understand orchestration logic
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Location: Project root or `/app/conductor.py`
  
- [ ] **Read BLUEPRINT.md** | Understand project architecture
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.3
  - Location: Project root `/BLUEPRINT.md`
  
- [ ] **Read tasks-system** | Understand task tracking
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Location: `.tasks/tasks-system.json`
  
- [ ] **Read last 2 Sessions** | Session continuity
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Use `session_read` for context

#### Local Project Knowledge
- [ ] **Read local AGENTS.md** | Project-specific rules
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.22
  - Location: `/projectname/AGENTS.md`
  
- [ ] **Read userprompts.md** | User intention log
  - Reference: @~/.config/opencode/AGENTS.md#RULE--1.5
  - Location: `/projectname/userprompts.md`

### Phase 2: Research & Best Practices 2026

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.24

- [ ] **Web Search Best Practices 2026** | Research current patterns
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Use `websearch_web_search_exa()` tool
  
- [ ] **GitHub Grep Production Examples** | Find real-world code
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Use `grep_app_searchGitHub()` tool
  
- [ ] **Context7 Official Documentation** | Check latest docs
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Use `context7_query-docs()` tool
  
- [ ] **Code Review Analysis** | Identify improvement opportunities
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2

### Phase 3: Internal Documentation

**Reference:** @~/.config/opencode/AGENTS.md#RULE-2

- [ ] **Read ~/dev/ Docs** | Relevant project documentation
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Location: `/dev/projectname/Docs/`
  
- [ ] **Read Elite Guides** | Best practice guides
  - Reference: @~/.config/opencode/AGENTS.md#RULE-2
  - Location: `/dev/sin-code/Guides/`
  
- [ ] **Check Troubleshooting Tickets** | Known issues
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.6
  - Location: `/troubleshooting/ts-ticket-*.md`

### Phase 4: TODO System Setup

**Reference:** @~/.config/opencode/AGENTS.md#RULE--3

- [ ] **Initialize TODO List** | Create task hierarchy
  ```javascript
  todowrite([
    { id: "task-01", content: "MAIN TASK", status: "in_progress" },
    { id: "task-01-a", content: "Sub-Task A", status: "pending" },
    { id: "task-01-b", content: "Sub-Task B", status: "pending" }
  ])
  ```
  
- [ ] **Define Task ID** | Unique identifier for tracking
  - Format: `{task-id}-{path/file}-{status}`
  - Example: `TASK-001-src/auth/login.ts-IN_PROGRESS`
  
- [ ] **Log Arbeitsbereich (Workspace)** | Track working area
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.29
  - Format: `{todo};{task-id}-{path}-{status}`
  - Log to: `lastchanges.md` AND `userprompts.md`

### Phase 5: Docker/MCP Context (If Applicable)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.33

- [ ] **Read CONTAINER-REGISTRY.md** | Container definitions
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - Location: `/dev/SIN-Solver/CONTAINER-REGISTRY.md`
  
- [ ] **Read ARCHITECTURE-MODULAR.md** | Modular architecture
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - Location: `/dev/SIN-Solver/ARCHITECTURE-MODULAR.md`
  
- [ ] **Check MCP Wrappers** | Existing wrapper patterns
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - Location: `/dev/SIN-Solver/mcp-wrappers/`

---

## 🔨 DURING EXECUTION CHECKLIST

### Swarm Delegation (PARALLEL EXECUTION)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.1

- [ ] **Delegate Minimum 5 Tasks** | Parallel agent execution
  - Reference: @~/.config/opencode/AGENTS.md#RULE--3
  - Minimum 3 agents, ideally 5+ agents
  
- [ ] **Use Swarm Cluster Mode** | No agent works alone
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.1
  
- [ ] **Spawn Background Tasks** | Parallel exploration
  - Reference: @~/.config/opencode/AGENTS.md#RULE--3
  - Use `run_in_background=true` for exploration

### Code Implementation Rules

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.2

- [ ] **NO Mocks, ONLY Reality** | Real code only
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.2
  - ❌ NO simulations, NO placeholders
  
- [ ] **Real API Calls** | Hit real endpoints
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.2
  
- [ ] **Real Database Operations** | Use actual databases
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.2
  
- [ ] **Real File Operations** | Write actual files
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.2

### Immutability Rules (CRITICAL)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.0

- [ ] **NEVER Delete Lines** | Only additive changes
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.0
  - ❌ NO deletion without backup
  
- [ ] **Verify File Integrity** | Before every save
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.0
  - Check full file from first to last line
  
- [ ] **Preserve Chronological Order** | Append-only
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.0
  - Never truncate or "clean up" by removing

### Blind Deletion Prevention

**Reference:** @~/.config/opencode/AGENTS.md#RULE--5

- [ ] **Research Unknown Elements** | Don't delete blindly
  - Reference: @~/.config/opencode/AGENTS.md#RULE--5
  - ❌ "Das kenne ich nicht, also lösche ich es"
  
- [ ] **Document Before Deleting** | Understand purpose first
  - Reference: @~/.config/opencode/AGENTS.md#RULE--5
  - Read README, Deployment-Status, lastchanges.md
  
- [ ] **Team Alignment** | For architecture changes
  - Reference: @~/.config/opencode/AGENTS.md#RULE--5

### Autonomous Execution

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE--1

- [ ] **KI Executes Commands** | NEVER ask user
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE--1
  - ❌ NO "Bitte führen Sie aus..."
  
- [ ] **Use sudo When Needed** | Password: admin
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE--1
  - Format: `echo 'admin' | sudo -S <command>`
  
- [ ] **Direct Implementation** | No manual steps
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE--1
  - ❌ NO "Kopieren Sie dies..."

### Modern CLI Toolchain (2026)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.19

- [ ] **Use ripgrep (rg)** | NOT grep
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.19
  - ✅ `rg "pattern" src/`
  - ❌ `grep -r "pattern" src/`
  
- [ ] **Use fd** | NOT find
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.19
  - ✅ `fd -e ts -t f`
  - ❌ `find . -name "*.ts" -type f`
  
- [ ] **Use sd** | NOT sed
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.19
  - ✅ `sd "old" "new" file.txt`
  - ❌ `sed -i 's/old/new/g' file.txt`
  
- [ ] **Use bat** | NOT cat
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.19
  - ✅ `bat main.ts | rg "function"`
  - ❌ `cat main.ts | grep "function"`

### Error Handling

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.6

- [ ] **Create Ticket for Errors** | ts-ticket-XX.md
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.6
  - Location: `[PROJECT-ROOT]/troubleshooting/ts-ticket-[XX].md`
  
- [ ] **Ticket Content Complete** | Full error documentation
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.6
  - Problem Statement, Root Cause, Resolution, Commands, References
  
- [ ] **Reference in Main File** | Link to ticket
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.6
  - Format: `**Reference Ticket:** @/[project]/troubleshooting/ts-ticket-[XX].md`

### Container Naming (If Docker Work)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.33

- [ ] **Use Correct Naming Convention** | {category}-{number}-{name}
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - ✅ `agent-01-n8n-manager`
  - ❌ `sin-zimmer-01-n8n`
  
- [ ] **Service Name = Container Name** | Identical in docker-compose.yml
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  
- [ ] **Use Service Names** | NOT hardcoded IPs
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - ❌ `172.20.0.x`

### MCP Wrapper Rules (If MCP Work)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.33

- [ ] **Docker Container = HTTP API** | NOT native MCP
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  
- [ ] **Create stdio Wrapper** | For OpenCode integration
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - Location: `/mcp-wrappers/[name]-mcp-wrapper.js`
  
- [ ] **Use Type: "local"** | In opencode.json
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.33
  - ❌ NOT `type: "remote"`

---

## ✅ POST-EXECUTION CHECKLIST

### Task Completion Verification

**Reference:** @~/.config/opencode/AGENTS.md#RULE--3

- [ ] **Mark TODOs Complete** | Update status immediately
  - Reference: @~/.config/opencode/AGENTS.md#RULE--3
  - Use `todowrite()` with status: "completed"
  
- [ ] **Verify Sub-Tasks** | All dependencies done
  - Reference: @~/.config/opencode/AGENTS.md#RULE--3
  - Check parent and child tasks
  
- [ ] **Self-Verification** | Don't trust blindly
  - Reference: @~/.config/opencode/AGENTS.md#RULE--3
  - `ls -la [created files]`
  - `curl [API endpoints]`

### Testing Requirements

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Unit Tests Pass** | All new functions covered
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Integration Tests Pass** | API endpoints working
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **E2E Tests Pass** | User flows complete
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Edge Cases Covered** | Boundary conditions tested
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  - Test: 0, null, undefined, "", [], {}

### Browser Verification (If UI Work)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Visual UI Check** | Open in browser
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Responsive Testing** | Mobile/desktop compatibility
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Cross-Browser Testing** | Chrome, Firefox, Safari
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25

### Performance Verification

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Load Testing** | 100+ concurrent requests
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Response Time < 200ms** | P95 threshold
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **No Memory Leaks** | Stability verified
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Bundle Size Optimized** | Where applicable
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25

### Status Footer (MANDATORY)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.20

- [ ] **Include Status Footer** | After EVERY code change
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.20
  
- [ ] **Update Checkboxes** | All docs marked
  ```
  Updated:       ☑️ lastchanges.md 
                 ☑️ userprompts.md
                 ☑️ readme.md
                 ☑️ TASKS.md
                 ☑️ /docs/
  ```
  
- [ ] **Progress Bars** | 3-tier progress
  ```
  FORTSCHRITT:   ████████░░ 80% (Code geschrieben)  
                 ██████░░░░ 60% (Getestet & Verified) 
                 ░░░░░░░░░░  0% (Deployment Ready)
  ```

---

## 🔄 GIT WORKFLOW CHECKLIST

### Pre-Commit Checks

**Reference:** @~/.config/opencode/AGENTS.md#RULE--6

- [ ] **Tests Pass** | Before any commit
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  - If tests fail → Fix → Test again → THEN commit
  
- [ ] **Documentation Updated** | All required files
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  
- [ ] **No Blind Deletions** | Verify all changes
  - Reference: @~/.config/opencode/AGENTS.md#RULE--5

### Commit Process

**Reference:** @~/.config/opencode/AGENTS.md#RULE--6

- [ ] **Stage All Changes** | `git add -A`
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  
- [ ] **Conventional Commit Message** | Proper format
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.10
  - Format: `<type>(<scope>): <description>`
  - Types: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
  - Example: `feat(auth): implement Antigravity OAuth flow`
  
- [ ] **Commit Created** | `git commit -m "type: message"`
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6

### Push Requirements

**Reference:** @~/.config/opencode/AGENTS.md#RULE--6

- [ ] **Push to Origin** | `git push origin main`
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  - ✅ REQUIRED after EVERY completed task
  - ✅ REQUIRED after tests pass
  
- [ ] **Verify Remote** | Check push succeeded
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  - `git log --oneline -5`
  - `git status` (should show "nothing to commit")

### Git Safety Rules

**Reference:** @~/.config/opencode/AGENTS.md#RULE--6

- [ ] **GitHub = Safety** | All work preserved
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  - "In GitHub ist IMMER alles gesichert"
  
- [ ] **Never Lose Work** | Rollback possible
  - Reference: @~/.config/opencode/AGENTS.md#RULE--6
  - "Bei Fehlern: Einfach zurückrollen zu letztem funktionierenden Commit"

### GitHub Templates (If New Repository)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.32

- [ ] **Bug Report Template** | `.github/ISSUE_TEMPLATE/bug_report.md`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **Feature Request Template** | `.github/ISSUE_TEMPLATE/feature_request.md`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **PR Template** | `.github/PULL_REQUEST_TEMPLATE.md`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **CI Workflow** | `.github/workflows/ci.yml`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  - Lint, TypeCheck, Test, Build
  
- [ ] **Dependabot Config** | `.github/dependabot.yml`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **CODEOWNERS File** | `.github/CODEOWNERS`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **CONTRIBUTING.md** | Contribution guidelines
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **CODE_OF_CONDUCT.md** | Community standards
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32
  
- [ ] **LICENSE File** | MIT/Apache/etc.
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.32

---

## 📝 DOCUMENTATION CHECKLIST

### lastchanges.md Updates

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.23

- [ ] **Append New Entry** | Never overwrite
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.23
  - Format: `## [YYYY-MM-DD HH:MM] - [AGENT/TASK-ID]`
  
- [ ] **Include Observations** | New findings
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.23
  
- [ ] **Document Errors** | With solutions
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.23
  
- [ ] **List Next Steps** | Open tasks
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.23
  
- [ ] **Log Arbeitsbereich** | Working area status
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.29

### userprompts.md Updates

**Reference:** @~/.config/opencode/AGENTS.md#RULE--1.5

- [ ] **Append Session Log** | Never overwrite old sessions
  - Reference: @~/.config/opencode/AGENTS.md#RULE--1.5
  - Format: `## SESSION [Datum] [ID] - [Thema]`
  
- [ ] **Kollektive Analyse** | User + KI findings
  - Reference: @~/.config/opencode/AGENTS.md#RULE--1.5
  
- [ ] **Resultierende Mission** | Distilled task
  - Reference: @~/.config/opencode/AGENTS.md#RULE--1.5
  
- [ ] **Iterations-Check** | Alignment verification
  - Reference: @~/.config/opencode/AGENTS.md#RULE--1.5

### README.md Updates

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.16

- [ ] **Document360 Standard** | 6 sections
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.16
  1. Introduction (What/Who/Why)
  2. Quick Start (5-min setup)
  3. API Reference (link to /docs/dev/)
  4. Tutorials (link to /docs/non-dev/)
  5. Troubleshooting
  6. Changelog & Support

### /docs/ Directory Structure

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.16

- [ ] **non-dev/** | User guides, tutorials, FAQs
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.16
  
- [ ] **dev/** | API ref, auth, architecture, setup
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.16
  
- [ ] **project/** | Deployment, changelog, roadmap
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.16
  
- [ ] **postman/** | Hoppscotch/Postman collections
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.16

### AGENTS.md Updates (Local Project)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.22

- [ ] **Update Local AGENTS.md** | Project knowledge
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.22
  - Tech Stack, Architecture, Conventions, API Standards, Special Rules
  
- [ ] **Document Architecture Changes** | Keep current
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.22

### 26-Pillar Documentation (For Modules)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.5

- [ ] **500+ Lines Per Pillar** | Comprehensive coverage
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.5
  - Location: `Docs/[module-name]/01-[name]-overview.md` through `26-[name]-appendix.md`

### DOCS.md (Constitution)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.16

- [ ] **Create DOCS.md** | Documentation index
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.16
  - Defines documentation rules
  - Acts as Table of Contents for /docs/

### SLASH.md (If Applicable)

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.18

- [ ] **Document Slash Commands** | AI controllability
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.18
  - All mutable entities changeable via API or Slash Command
  - Format: `/cmd [action] [target] --param value`

---

## 💻 CODE QUALITY CHECKLIST

### TypeScript Standards

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.9

- [ ] **Strict Mode Enabled** | `"strict": true`
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.9
  
- [ ] **No `any` Types** | Without justification
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.9
  
- [ ] **No untracked `@ts-ignore`** | Only with ticket + explicit justification
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.9
  
- [ ] **No `@ts-expect-error`** | Without ticket reference
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.9
  
- [ ] **JSDoc/TSDoc** | Public APIs and non-obvious contracts documented
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.9
  
- [ ] **Key Exports Documented** | Public API and surprising behavior clear
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.9

### Error Handling

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Try-Catch Blocks** | All risky operations
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Descriptive Error Messages** | Clear context
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **No Empty Catch Blocks** | FORBIDDEN
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **Logging for Debugging** | All critical paths
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25

### Code Structure

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.14

- [ ] **Modular Architecture** | < 500 lines per module
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.14
  
- [ ] **Composable Components** | Reusable design
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.14
  
- [ ] **Test-Driven Development** | Tests before code
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.14

### Clean Code Principles

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Self-Review Performed** | Before claiming done
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  - "Ich habe eine Selbstüberprüfung durchgeführt"
  
- [ ] **Code Comments** | Non-obvious intent, constraints, edge cases, or workarounds
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **No New Warnings** | Clean build
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25

### Conventional Commits

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.10

- [ ] **feat:** | New feature
- [ ] **fix:** | Bug fix
- [ ] **docs:** | Documentation only
- [ ] **style:** | Formatting (no code change)
- [ ] **refactor:** | Code restructuring
- [ ] **test:** | Adding/updating tests
- [ ] **chore:** | Maintenance tasks

---

## 🔐 SECURITY CHECKLIST

### Secrets Management

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.21

- [ ] **Document ALL Secrets** | In environments-jeremy.md
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.21
  - Location: `~/dev/environments-jeremy.md`
  - Account, Username, Password, API Key, Endpoint, Ports, Projects, Status
  
- [ ] **NEVER Delete Secrets** | Only add (append-only)
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.21
  - Mark as DEPRECATED instead of deleting
  
- [ ] **NEVER Commit Secrets** | To git
  - Reference: @~/.config/opencode/AGENTS.md#Security Mandates
  - Use `.gitignore` for sensitive files

### File Permissions

**Reference:** @~/.config/opencode/AGENTS.md#Security Mandates

- [ ] **Secure Config Files** | chmod 600
  - Reference: @~/.config/opencode/AGENTS.md#Security Mandates
  - `chmod 600 ~/.config/opencode/antigravity-accounts.json`
  - `chmod 600 ~/.config/opencode/opencode.json`

### Input Validation

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Validate All Inputs** | Sanitize user data
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **OWASP Top 10 Check** | Security audit
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **SQL Injection Prevention** | Parameterized queries
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **XSS Prevention** | Output encoding
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25

### Authentication/Authorization

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Auth Implemented** | Where required
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **CORS Configured** | Correctly
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25

### Security Audit

**Reference:** @~/.config/opencode/AGENTS.md#MANDATE-0.25

- [ ] **Secret-Leakage Check** | No keys in code
  - Reference: @~/.config/opencode/AGENTS.md#MANDATE-0.25
  
- [ ] **No Hardcoded Credentials** | Use environment variables
  - Reference: @~/.config/opencode/AGENTS.md#Security Mandates

---

## 📚 MANDATE REFERENCE INDEX

### Supreme Laws (RULE -X)

| ID | Name | Line | Description |
|----|------|------|-------------|
| RULE -6 | Git Commit + Push | @AGENTS.md#7 | Mandatory after every task |
| RULE -5 | No Blind Deletion | @AGENTS.md#52 | Research before deleting |
| RULE -3 | TODO + Swarm | @AGENTS.md#101 | Always use TODO system |
| RULE -2 | 5-Phase Workflow | @AGENTS.md#311 | Context → Research → Docs → Plan → Delegate |
| RULE -1.5 | User Prompts Log | @AGENTS.md#268 | Memory anchor for sessions |

### Core Mandates (MANDATE 0.X)

| ID | Name | Line | Description |
|----|------|------|-------------|
| MANDATE 0.0 | Immutability | @AGENTS.md#537 | Never delete, only add |
| MANDATE 0.1 | Swarm System | @AGENTS.md#548 | 5+ agents minimum |
| MANDATE 0.2 | Reality Only | @AGENTS.md#579 | No mocks/simulations |
| MANDATE 0.3 | Blueprint | @AGENTS.md#590 | Project blueprint required |
| MANDATE 0.4 | Docker | @AGENTS.md#599 | Local image preservation |
| MANDATE 0.5 | 26-Pillar Docs | @AGENTS.md#618 | Comprehensive documentation |
| MANDATE 0.6 | Ticket System | @AGENTS.md#654 | ts-ticket-XX.md for errors |
| MANDATE 0.7 | Safe Migration | @AGENTS.md#679 | Backup before changes |
| MANDATE 0.8 | Source of Truth | @AGENTS.md#692 | Config hierarchy |
| MANDATE 0.9 | TypeScript | @AGENTS.md#704 | Strict mode required |
| MANDATE 0.10 | Commits | @AGENTS.md#714 | Conventional commits |
| MANDATE 0.11 | Serena MCP | @AGENTS.md#731 | Orchestration tool |
| MANDATE 0.12 | Free First | @AGENTS.md#739 | Prefer free solutions |
| MANDATE 0.13 | CEO Workspace | @AGENTS.md#750 | File organization |
| MANDATE 0.14 | 1M Lines Goal | @AGENTS.md#788 | Codebase ambition |
| MANDATE 0.15 | AI Screenshots | @AGENTS.md#815 | Auto-cleanup system |
| MANDATE 0.16 | Trinity Docs | @AGENTS.md#846 | /docs/ structure |
| MANDATE 0.17 | OpenHands | @AGENTS.md#876 | Universal coding layer |
| MANDATE 0.18 | Slash Commands | @AGENTS.md#905 | AI controllability |
| MANDATE 0.19 | Modern CLI | @AGENTS.md#918 | ripgrep, fd, sd, bat |
| MANDATE 0.20 | Status Footer | @AGENTS.md#1025 | Progress reporting |
| MANDATE 0.21 | Secrets Registry | @AGENTS.md#1080 | environments-jeremy.md |
| MANDATE 0.22 | Local AGENTS.md | @AGENTS.md#1144 | Project knowledge |
| MANDATE 0.23 | lastchanges.md | @AGENTS.md#1195 | Photographic memory |
| MANDATE 0.24 | Best Practices | @AGENTS.md#1250 | Continuous research |
| MANDATE 0.25 | Self-Critique | @AGENTS.md#1316 | CEO mindset |
| MANDATE 0.26 | Phase Planning | @AGENTS.md#1399 | Error anticipation |
| MANDATE 0.27 | Knowledge Base | @AGENTS.md#1464 | Docker knowledge |
| MANDATE 0.28 | Market Analysis | @AGENTS.md#1513 | Competitive position |
| MANDATE 0.29 | Workspace Tracking | @AGENTS.md#1560 | Collision avoidance |
| MANDATE 0.30 | OpenCode Preservation | @AGENTS.md#1616 | Never reinstall |
| MANDATE 0.31 | ALL-MCP Directory | @AGENTS.md#1673 | MCP documentation |
| MANDATE 0.32 | GitHub Templates | @AGENTS.md#2049 | Repository standards |
| MANDATE 0.33 | MCP Wrappers | @AGENTS.md#2476 | Docker as MCP |

---

## 🎯 DAILY WORKFLOW TEMPLATE

Copy this template for every work session:

```markdown
## WORK SESSION [YYYY-MM-DD HH:MM]

### Pre-Execution
- [ ] Read lastchanges.md
- [ ] Read BLUEPRINT.md
- [ ] Read local AGENTS.md
- [ ] Initialize TODO list
- [ ] Research Best Practices 2026

### During Execution
- [ ] Delegate minimum 5 tasks (swarm)
- [ ] Use TODO system continuously
- [ ] NO blind deletions
- [ ] Use modern CLI tools (rg, fd, sd, bat)
- [ ] Create ticket for any errors

### Post-Execution
- [ ] All tests pass
- [ ] Update lastchanges.md (append)
- [ ] Update userprompts.md (append)
- [ ] Update README.md if needed
- [ ] Update /docs/ if needed
- [ ] Update local AGENTS.md if needed
- [ ] Include status footer

### Git Workflow
- [ ] git add -A
- [ ] Conventional commit message
- [ ] git push origin main
- [ ] Verify push succeeded

### Security
- [ ] No secrets in code
- [ ] Document secrets in environments-jeremy.md
- [ ] Input validation present
- [ ] No hardcoded credentials

### Verification
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Code quality verified
- [ ] All checkboxes ticked

STATUS: ☐ COMPLETE ☐ IN PROGRESS ☐ BLOCKED
```

---

## ⚠️ VIOLATION CONSEQUENCES

**TECHNICAL TREASON (Immediate Escalation):**
- Deleting content without backup
- Skipping TODO system
- Working alone (no swarm delegation)
- Committing without tests passing
- Pushing secrets to git
- Blind deletion of unknown elements

**WARNING (Fix Immediately):**
- Forgetting to update lastchanges.md
- Missing status footer
- Using legacy tools (grep, sed, find)
- Incomplete documentation
- Missing JSDoc comments

---

## 📞 ESCALATION PROTOCOL

If unsure about ANY rule:

1. **STOP** - Do not proceed
2. **READ** - Check AGENTS.md for clarification
3. **DOCUMENT** - Create ticket in troubleshooting/
4. **ASK** - Request user guidance if needed
5. **VERIFY** - Double-check before continuing

---

**Document Statistics:**
- Total Rules: 150+ checkboxes
- Mandates: 33 (RULE -6 to MANDATE 0.33)
- Categories: 7 major sections
- Quick Reference: 7 non-negotiables
- Last Updated: 2026-01-29

**Remember:** This checklist is your shield against Technical Treason. Use it religiously. 🛡️

---

*"Omniscience is not a goal; it is our technical starting point."*
