# MANDATE 0.9: CODING STANDARDS ENFORCEMENT

**TypeScript Strict Mode is MANDATORY.**

- `"strict": true` in all tsconfig.json
- NO `any` types without justification
- NO untracked `@ts-ignore` or `@ts-expect-error` directives
- Every suppression directive must carry a ticket reference and explicit justification
- Use JSDoc/TSDoc for public APIs, non-obvious contracts, and behavior that needs durable explanation
- Prefer self-explanatory code first; add comments only for non-obvious intent, constraints, invariants, edge cases, or temporary workarounds

---

**Source:** ~/.config/opencode/Agents.md (Line 972-982)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
