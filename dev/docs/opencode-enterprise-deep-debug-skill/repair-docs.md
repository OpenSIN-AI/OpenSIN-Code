## BUG-001: Tool timeouts on broad search
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** Glob and grep searches at workspace root timed out after 60s.
**Ursache:** Searches executed at "." instead of narrowing to target project path.
**Fix:** Restrict glob/grep path to the project root and narrower include patterns. Re-verified on `~/dev/skills/opencode-enterprise-deep-debug-skill` with scoped `grep`, `glob`, and `rg`; all completed successfully without timeout.
**Datei:** N/A (tooling)
