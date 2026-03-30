---
name: check-plan-done
description: "Unified plan-and-execute workflow. Check whether a viable plan already exists, create and review one if needed, then execute task by task until the done criteria pass. Synthesizes the strongest parts of omoc-plan-swarm, biometrics-plan, and biometrics-work."
license: MIT
compatibility: opencode
metadata:
  audience: all-agents
  workflow: check-plan-done
  trigger: plan-and-execute
---

# Check Plan Done

> Check -> Plan -> Review -> Do -> Verify

---

## Purpose

Use this skill when the user wants one workflow that can:
- check whether a good plan already exists
- create a plan if it does not
- review that plan before action
- execute the work task by task
- stop only when the done criteria actually pass

This skill is the merged successor to:
- `omoc-plan-swarm`
- `/biometrics-plan`
- `/biometrics-work`

It preserves the strong parts of those sources and removes the weak ones:
- keep the OMOC pipeline and fail-fast gates
- keep the BIOMETRICS approval handoff before execution
- keep the BIOMETRICS task-by-task execution discipline
- remove vague slogans, hidden dependencies, fictional agents, and unbounded loops

---

## Modes

Infer one of these modes before doing any work:

1. `plan-only`
   - user wants strategy, roadmap, architecture, or a plan only
2. `plan-and-execute`
   - user wants the work implemented, fixed, or finished
3. `resume-approved-plan`
   - there is already a current approved plan in session or explicit project context, and it still matches the request

If the mode is unclear, pick the safest reasonable default from the user request.
Only ask at the approval gate when the next action is destructive, irreversible, security-sensitive, or billing-sensitive.

---

## Core Rules

- Use real OpenCode tools only
- Keep planning bounded: 2 parallel research tasks, 1 synthesis task, 1 review task
- Keep prompts short and single-purpose
- Use session context by default; do not depend on fixed plan paths or external orchestrators
- Do not use fictional agents or undefined files as required dependencies
- Do not auto-commit as part of the core loop
- Derive validation from the actual stack and task; do not hardcode Go-only checks unless the project is Go
- Revise the plan at most once after critical review
- Continue execution until all done criteria pass or a real blocker remains

---

## Stage 0: Check

Before planning, answer these questions:

1. Is there already an approved plan in the current session or explicit task context?
2. Does that plan still match the current request?
3. Does it contain concrete tasks, risks, validation steps, and done criteria?

If the answer to all three is yes, skip to `Stage 4: Execute` in `resume-approved-plan` mode.
Otherwise, create a fresh plan.

---

## Stage 1: Research (parallel)

Run both tasks in parallel.

### Task A: Best-practice research

Use a focused research task to gather current implementation guidance.

```
task({
  subagent_type: "librarian",
  run_in_background: true,
  load_skills: [],
  description: "Best-practice research for: [TOPIC]",
  prompt: `
Research this implementation topic.

TOPIC: [insert task description]
DATE: [today's date]

Deliver:
1. Current best practices
2. Stable production-ready choices
3. Anti-patterns to avoid
4. Constraints that matter during execution

Output: concise markdown with concrete findings and sources when relevant.
No filler.
  `
})
```

### Task B: Codebase or local-context analysis

```
task({
  subagent_type: "explore",
  run_in_background: true,
  load_skills: [],
  description: "Context analysis for: [TOPIC]",
  prompt: `
Analyze the local codebase or project context for this task.

TASK: [insert task description]
PATH: [project path]

Deliver:
1. Current structure and relevant surfaces
2. Existing patterns to preserve
3. Gaps or debt that affect the task
4. Integration points that can break
5. Validation commands or checks already used by the project

Output: concise markdown with file references when applicable.
No filler.
  `
})
```

### Gate 1: Research quality

Do not proceed unless:
- both branches returned concrete substance
- the local analysis contains file or project references when applicable
- the research identifies both good patterns and failure risks

If one branch is weak, rerun only that branch once with a tighter prompt.

---

## Stage 2: Draft Plan

Synthesize one execution-ready plan.

```
task({
  category: "deep",
  load_skills: [],
  run_in_background: false,
  description: "Create plan for: [TOPIC]",
  prompt: `
Create an execution-ready plan from these findings.

TASK: [insert task description]
BEST PRACTICES: [paste research output]
LOCAL CONTEXT: [paste explore output]

Use this exact structure:

# Plan: [Title]
Mode: [plan-only | plan-and-execute | resume-approved-plan]
Created: [date]

## Summary
[what, why, expected result]

## Current State
[strengths, weaknesses, critical gaps]

## Decisions
[what to use, what to avoid, why]

## Phases
### Phase 1: [name] -- CRITICAL
- [ ] Task (effort: S/M/L, deps: ..., validation: ...)

### Phase 2: [name] -- HIGH
- [ ] Task (effort: S/M/L, deps: ..., validation: ...)

### Phase 3: [name] -- OPTIONAL
- [ ] Task (effort: S/M/L, deps: ..., validation: ...)

## Risks
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|

## Done Criteria
- [ ] Criterion

RULES:
- every task must be concrete and actionable
- every task must include validation
- Phase 1 must be the smallest critical path
- maximum 3 phases
  `
})
```

### Gate 2: Plan completeness

Do not proceed unless the plan includes:
- summary
- current state
- decisions
- concrete phased tasks
- validation per task
- risks
- done criteria

If anything is missing, fix the plan before review.

---

## Stage 3: Critical Review

Run one hard review, then integrate the feedback yourself.

```
task({
  category: "artistry",
  load_skills: [],
  run_in_background: false,
  description: "Critical review of plan for: [TOPIC]",
  prompt: `
Review this plan critically.

PLAN:
[paste plan]

Check:
1. Critical gaps
2. False assumptions
3. Priority errors
4. Scope realism
5. Technical soundness
6. New debt introduced by the plan

Output:

## Verdict: APPROVED / NEEDS REVISION

## Issues
### CRITICAL
- ...
### HIGH
- ...
### LOW
- ...

## Suggested Changes
[concrete rewrites]

Be direct. No praise. No filler.
  `
})
```

### Gate 3: Approval readiness

- If verdict is `APPROVED`, continue
- If verdict is `NEEDS REVISION`, revise once yourself and re-check locally
- If critical issues still remain after one revision, stop and present the plan with open issues

If the mode is `plan-only`, return the approved plan here and stop.

If execution is destructive, irreversible, security-sensitive, or billing-sensitive, ask one targeted approval question here before execution.

---

## Stage 4: Execute

Turn the approved plan into a live task loop.

Execution rules:
- execute one concrete task at a time
- keep the current task aligned with the approved phase order
- after each task, run the exact validation required by the plan or the project
- mark a task done only after validation passes
- if validation fails, fix it before moving on
- if blocked, use one focused background consultation only when truly needed
- do not claim success while done criteria are still open

Do not create an unbounded orchestration loop. Use a bounded task loop with clear pass/fail checkpoints.

---

## Stage 5: Verify Done

Before stopping, verify:
- every required task is completed or explicitly deferred
- every done criterion passes
- all critical validations passed
- any remaining risk or open issue is stated clearly

Return:
- what was completed
- what was validated
- what remains open, if anything

If the work is not actually done, continue the loop instead of giving a premature finish message.

---

## Anti-Patterns To Reject

- vague quality claims instead of measurable gates
- hidden dependencies on fixed files like `boulder.json`
- hardcoded stack assumptions like always running `go fmt` or `go vet`
- fictional agent names without a real tool mapping
- mandatory auto-commit in the core loop
- planning without review
- execution without done criteria
- infinite loops with no stop condition

---

## Practical Summary

The contract of this skill is simple:

1. check whether a usable approved plan already exists
2. if not, create one with bounded parallel research and hard review
3. only then execute task by task
4. verify every done criterion before stopping

That is what `/check-plan-done` means.
