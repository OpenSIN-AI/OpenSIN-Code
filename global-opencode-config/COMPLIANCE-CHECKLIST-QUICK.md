# ⚡ COMPLIANCE CHECKLIST - QUICK REFERENCE

**Version:** 1.0.0 | **For Daily Use** | **Print and Keep Handy**

---

## 🚨 THE 7 ABSOLUTE NON-NEGOTIABLES

**Check these BEFORE and AFTER every task:**

```
┌─────────────────────────────────────────────────────────────┐
│  ✅ 1. TODO System Active          [ ]                     │
│  ✅ 2. Read lastchanges.md         [ ]                     │
│  ✅ 3. Read BLUEPRINT.md           [ ]                     │
│  ✅ 4. Git Add + Commit + Push     [ ]                     │
│  ✅ 5. Update Documentation        [ ]                     │
│  ✅ 6. No Blind Deletion            [ ]                     │
│  ✅ 7. Tests Pass Before Commit    [ ]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 PRE-WORK (Before Starting)

### Read These Files
- [ ] `lastchanges.md` - What was last changed
- [ ] `BLUEPRINT.md` - Architecture overview  
- [ ] `AGENTS.md` (local) - Project rules
- [ ] `userprompts.md` - User intentions

### Initialize
- [ ] Create TODO list with `todowrite()`
- [ ] Define task ID: `{TASK-001}-{path}-{status}`
- [ ] Log to lastchanges.md: `{todo};{task-id}-{path}-{status}`

---

## 🔨 WHILE WORKING

### Code Rules
- [ ] **NO mocks** - Only real code
- [ ] **NO blind deletion** - Research first
- [ ] **Use modern tools**: rg (not grep), fd (not find), sd (not sed), bat (not cat)
- [ ] **KI executes** - Never ask user to run commands

### Swarm Delegation
- [ ] Delegate **minimum 3 tasks** (ideally 5+)
- [ ] Use `delegate_task()` with `run_in_background=true`
- [ ] Never work alone

### Error Handling
- [ ] Create ticket: `troubleshooting/ts-ticket-XX.md`
- [ ] Document: Problem, Root Cause, Solution, Commands
- [ ] Reference in main file

---

## ✅ AFTER COMPLETING

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Visual check in browser (if UI)

### Documentation Updates
- [ ] Append to `lastchanges.md` (never overwrite)
- [ ] Append to `userprompts.md` (never overwrite)
- [ ] Update `README.md` if changed
- [ ] Add screenshots/images/videos to docs, READMEs, and issues
- [ ] Update `/docs/` files if needed
- [ ] Update local `AGENTS.md` if architecture changed

### Status Footer (REQUIRED)
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 STATUS UPDATE

Updated:       ☑️ lastchanges.md 
               ☑️ userprompts.md
               ☑️ readme.md
               ☑️ TASKS.md
               ☑️ /docs/

FORTSCHRITT:   ████████░░ 80% (Code)  
               ██████░░░░ 60% (Tests)
               ░░░░░░░░░░  0% (Deploy)

last-commit:   2026-01-29 HH:MM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 GIT WORKFLOW

### Every Change:
```bash
git add -A
git commit -m "type(scope): description"
git push origin main
```

### Commit Types:
- `feat:` - New feature
- `fix:` - Bug fix  
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Restructure
- `test:` - Tests
- `chore:` - Maintenance

### Rules:
- [ ] Tests pass BEFORE committing
- [ ] Push after EVERY completed task
- [ ] Never lose work - GitHub preserves everything

---

## 🔐 SECURITY

### Secrets
- [ ] Document in `~/dev/environments-jeremy.md`
- [ ] NEVER delete secrets (mark DEPRECATED)
- [ ] NEVER commit secrets to git
- [ ] Use `.gitignore` for sensitive files

### Code Security
- [ ] Input validation present
- [ ] No hardcoded credentials
- [ ] OWASP Top 10 checked
- [ ] CORS configured correctly

---

## 💻 CODE QUALITY

### TypeScript
- [ ] `"strict": true` enabled
- [ ] No `any` types
- [ ] No `@ts-ignore`
- [ ] JSDoc/TSDoc on public or non-obvious APIs

### General
- [ ] Self-review completed
- [ ] Comments for non-obvious intent, constraints, edge cases, or workarounds
- [ ] No build warnings
- [ ] < 500 lines per module

---

## 🆘 EMERGENCY CHECKLIST

### If You Made a Mistake:
1. **DON'T PANIC**
2. Check if committed: `git log --oneline -3`
3. If committed: `git revert HEAD` (safe rollback)
4. If not committed: `git checkout -- .` (discard changes)
5. Document in troubleshooting/ts-ticket-XX.md
6. Fix and recommit

### If Unsure About a Rule:
1. STOP - Don't guess
2. Check `~/.config/opencode/AGENTS.md`
3. Ask for clarification if needed
4. Document the uncertainty

---

## 📊 PROGRESS TRACKING

### Update TODOs Continuously:
```javascript
todowrite([
  { id: "task-01", content: "MAIN", status: "completed" },
  { id: "task-01-a", content: "Sub", status: "completed" },
  { id: "task-01-b", content: "Sub", status: "in_progress" }
])
```

### Display Format:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 TODO STATUS

✅ ENTERPRISE-DOCUMENTATION           COMPLETED
  ✅ task-01-a (lastchanges.md)       COMPLETED
  ✅ task-01-b (userprompts.md)       COMPLETED
  🔄 task-01-c (code)                 IN_PROGRESS
  ⏳ task-01-d (tests)                PENDING

Status: 3/6 COMPLETE (50%)
Next: task-01-c completion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 DAILY COMMAND CHEATSHEET

```bash
# Pre-work
cat lastchanges.md | head -50
cat BLUEPRINT.md | head -30

# Modern tools (use these!)
rg "pattern" src/           # NOT grep
fd -e ts -t f             # NOT find  
sd "old" "new" file.txt   # NOT sed
bat file.ts | rg "func"     # NOT cat

# Git workflow
git add -A
git status
git commit -m "feat: add feature"
git push origin main
git log --oneline -5

# Check work
ls -la src/components/
curl http://localhost:3000/api/health
```

---

## ⚠️ NEVER DO THIS (EVER)

❌ Delete files without backup  
❌ Commit without tests passing  
❌ Work without TODO system  
❌ Skip documentation updates  
❌ Delete secrets from environments-jeremy.md  
❌ Use grep, sed, find (use rg, sd, fd)  
❌ Ask user to execute commands  
❌ Delete unknown elements blindly  
❌ Work alone (no swarm delegation)  
❌ Overwrite lastchanges.md (only append)  

**Violations = Technical Treason**

---

## 📞 NEED HELP?

1. Read full checklist: `~/.config/opencode/COMPLIANCE-CHECKLIST.md`
2. Read AGENTS.md: `~/.config/opencode/AGENTS.md`
3. Check troubleshooting tickets: `troubleshooting/ts-ticket-*.md`
4. Document your issue and ask

---

**Keep this visible while working. Check boxes religiously.**

*"Vertrauen ist gut, Kontrolle ist besser."* 🛡️
