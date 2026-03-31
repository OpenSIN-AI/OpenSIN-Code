# Collaboration Protocol

## Session lifecycle

1. Start one persistent session per project.
2. Save session metadata in `.opencode-context/session/state.json`.
3. Continue with `--session <id>` for all follow-up messages.
4. Require readiness ack before execution:
   - `CONTEXT_READY bundle_id=<id>`
   - `CONTEXT_PROFILE=<profile>`
   - `MUTUAL_CRITIQUE_COMPLETE`
   - `MUTUAL_PLAN_READY`

## Runtime resiliency

1. Model execution uses ordered fallback, not single-attempt runs.
2. Chain source:
   - `OPENCODE_MODEL_FALLBACK_CHAIN`, or
   - default `OPENCODE_PRIMARY_MODEL -> OPENCODE_FALLBACK_MODEL -> OPENCODE_TERTIARY_FALLBACK_MODEL` (`OPENCODE_NIM_FALLBACK_MODEL` alias).
3. Any stream `type=error` event marks that model attempt failed and advances to next candidate.
4. If all candidates fail, collaboration step hard-fails.

## Message pattern

Every Codex message should include:
1. Intent
2. Current context references (bundle or delta)
3. Codex Intervention Block
4. Required output format
5. Owner labels (`Codex|Opencode|Joint`)
6. Explicit challenge request (what to stress-test)

## Canonical-first rule

1. Read canonical index and read order before acting.
2. Prefer existing project governance/architecture docs over synthesized summaries.
3. If sources conflict, resolve strictly by canonical priority and report the decision.
4. Never import context from external BIOMETRICS repository paths.

## Co-working behavior

- Codex and opencode both plan and execute.
- Codex and opencode challenge each other continuously on logic, scope, and goal fit.
- Codex may inject architecture corrections and alternative strategies proactively.
- Opencode keeps delegated results integrated in one coherent response.
- No direct execution starts until both sides finish prompt-audit and objective validation.
- Challenge loop per sprint is mandatory:
  - `report -> counter_critique -> decision(accept|rework|escalate) -> next step`
- Every substantial response must include:
  - `prompt_logic_review`
  - `objective_refinement`
  - `opencode_critique_of_codex`
  - `codex_challenge_requested`
  - `conflicts_resolved_with_priority`
  - `plan_status`
  - `work_done`
  - `delegated_subtasks`
  - `risks_or_blockers`
  - `next_steps`
