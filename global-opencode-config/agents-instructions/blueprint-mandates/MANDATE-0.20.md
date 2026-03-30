# MANDATE 0.20: STATUS FOOTER PROTOCOL (V18.3 - 2026-01-28)

**EFFECTIVE:** 2026-01-28  
**SCOPE:** All AI coders, all chat sessions, all coding responses

**Every AI coder response that involves code changes MUST include a status footer.**

**Footer Template (MANDATORY):**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STATUS UPDATE

Updated:       ☑️ lastchanges.md 
               ☑️ userprompts.md
               ☑️ readme.md
               ☑️ TASKS.md
               ☑️ /docs/

FORTSCHRITT:   ████████░░ 80% (Code geschrieben)  
               ██████░░░░ 60% (Getestet & Verified) 
               ░░░░░░░░░░  0% (Deployment Ready)

Github:        [repo-url]
last-commit:   [timestamp]
Vercel:        [vercel-url] (if applicable)
last-deploy:   [timestamp]
OpenURL:       [public-url]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Progress Bar Legend:**
- `████████████` = 100% Complete
- `██████████░░` = ~83% Complete  
- `████████░░░░` = ~67% Complete
- `██████░░░░░░` = 50% Complete
- `████░░░░░░░░` = ~33% Complete
- `██░░░░░░░░░░` = ~17% Complete
- `░░░░░░░░░░░░` = 0% (Not Started)

**When to Include:**
- After ANY file modification
- After completing a task/subtask
- Before ending a coding session
- When asked for status update

**Required Fields:**
| Field | Description |
|-------|-------------|
| Updated | Checkboxes showing which docs were updated |
| FORTSCHRITT | 3-tier progress (Code → Test → Deploy) |
| Github | Repository URL if applicable |
| last-commit | ISO timestamp of last commit |
| Vercel/OpenURL | Deployment URLs if applicable |

**WHY THIS EXISTS:**
- Immediate visibility into project state
- Ensures documentation is updated alongside code
- Provides verifiable progress metrics
- Creates accountability checkpoint

---

**Source:** ~/.config/opencode/Agents.md (Line 1365-1426)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
