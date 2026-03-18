
## BUG-20260317-001: Chrome login loop / Domain-Wide Delegation automation failure
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** Chrome automation repeatedly encounters account-selection/sign-in loops at `accounts.google.com` when trying to access Admin Console, making programmatic configuration of Domain-Wide Delegation impossible.
**Ursache:** Google security prevents programmatic automation of account selection/login via standard automation tools (nodriver/playwright/AppleScript) for sensitive Admin Console access.
**Fix:** Manuelle Einrichtung (siehe `admin_console.md`).
**Datei:** `~/dev/docs/chrome/admin_console.md`

## BUG-20260317-002: Stripe onboarding blocked by fresh Google OAuth login in Playwright context
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** Stripe dashboard navigation to `/apikeys` redirects to Stripe login, then to Google identifier screen requiring full email/password entry; no persisted session is available in the automation context.
**Ursache:** Browser automation context does not reuse an already authenticated Stripe/Google profile session.
**Fix:** Use an authenticated persistent browser profile/session for Stripe onboarding runs (or run manual one-time login before automation steps).
**Datei:** `simone-webshop-01` onboarding workflow (Stripe web onboarding)

## BUG-20260317-003: Go test command executed from wrong module root
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `go test ./apps/api/internal/...` failed with `directory prefix ... does not contain main module`.
**Ursache:** Command was run from repository root while `go.mod` lives in `apps/api`.
**Fix:** Run tests from `apps/api` with package paths relative to that module, e.g. `go test ./internal/checkout/...`.
**Datei:** `apps/api` test execution workflow

## BUG-20260317-004: SPM fanout to HF Space fails with 403
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `sin-passwordmanager` sync to `delqhi/simone-webshop-api` returns `403 Forbidden` on `/api/spaces/.../secrets`.
**Ursache:** Stored `HUGGINGFACE_TOKEN` in SPM lacks required permissions (or wrong owner scope) for Space secret writes.
**Fix:** Replace `HUGGINGFACE_TOKEN` in SPM with a token that has write/admin access to `delqhi/simone-webshop-api`, then rerun secret sync.
**Datei:** `sin-passwordmanager` Hugging Face fanout target `delqhi/simone-webshop-api`

## BUG-20260317-005: Raw Node execution of TypeScript entrypoint fails
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `node a2a/team-shop/sin-shop-finance/src/cli.ts` fails with `ERR_UNKNOWN_FILE_EXTENSION`.
**Ursache:** Plain Node cannot execute `.ts` source files without a loader/transpilation step.
**Fix:** Build with `tsc` first and execute `dist/src/cli.js`.
**Datei:** `a2a/team-shop/sin-shop-finance/src/cli.ts`

## BUG-20260317-006: Browser workflow SSOT lacks specific Stripe/checkout invariants
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** NotebookLM confirms only generic browser workflow rules; no concrete `interaction_invariant` / `security_gate` / `halt_condition` is defined for Simone storefront checkout or Stripe dashboard onboarding.
**Ursache:** Master Google Doc currently lacks specific governed browser-flow definitions for these two flows.
**Fix:** Add explicit Stripe-onboarding and storefront-checkout browser workflow definitions to the SSOT, then rerun NotebookLM query before automation.
**Datei:** Master Google Doc / NotebookLM SSOT for `simone-webshop-01`

## BUG-20260317-007: Web typecheck fails when run before Next has generated `.next/types`
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `pnpm --filter @simone/web typecheck` failed with many `TS6053` errors because `.next/types/...` files were not yet present.
**Ursache:** Typecheck was run in parallel with the Next build, so generated route types were not available at typecheck start.
**Fix:** Run `pnpm --filter @simone/web build` first (or otherwise generate `.next/types`) before running `pnpm --filter @simone/web typecheck`.
**Datei:** `apps/web` build/typecheck workflow

## BUG-20260317-008: Web build fails because `critters` module is missing
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `pnpm --filter @simone/web build` failed during prerender of `/404` and `/500` with `Cannot find module 'critters'`.
**Ursache:** `apps/web/next.config.js` enabled `experimental.optimizeCss`, which pulled in a missing `critters` dependency path in this workspace.
**Fix:** Removed `experimental.optimizeCss` from `apps/web/next.config.js`; build and subsequent typecheck now pass.
**Datei:** `apps/web/next.config.js`

## BUG-20260317-009: zsh reserves `status` during shell smoke scripts
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** Bash smoke commands failed with `read-only variable: status` while capturing exit codes.
**Ursache:** The shell session runs under zsh semantics where `status` is a readonly special parameter.
**Fix:** Use a different variable name such as `exit_code` in inline shell scripts.
**Datei:** local shell smoke command snippets

## BUG-20260317-010: `pnpm start -- -p` forwards invalid Next args in apps/web
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `pnpm --filter @simone/web start -- -p 3100` resolved to `next start -- -p 3100` and Next treated `-p` as an invalid project directory.
**Ursache:** The package script is plain `next start`; extra args were forwarded with an extra `--` token.
**Fix:** Use `pnpm exec next start -p 3100` from `apps/web` for local smoke runs.
**Datei:** `apps/web` local smoke command workflow

## BUG-20260317-011: Expected SIN authd state file missing on local machine
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** Reading `~/.config/sin-solver/authd/state.json` failed with `FileNotFoundError` while checking for a reusable Hugging Face token.
**Ursache:** The local authd state file is absent at the path assumed by `scripts/deploy-hf-api.sh`.
**Fix:** Either restore the authd state file at the expected path or switch the deploy/sync workflow to another approved token source.
**Datei:** `scripts/deploy-hf-api.sh`

## BUG-20260317-012: Existing SPM Hugging Face target metadata is incomplete
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `sin-passwordmanager_sync_bound_secret` for an existing Hugging Face target returned `huggingface_space_target_incomplete`.
**Ursache:** At least one stored Hugging Face target binding uses incomplete params metadata (`space_id`/`repoId` mismatch or missing required fields).
**Fix:** Normalize old Hugging Face secret target bindings in SPM to the current schema before reuse.
**Datei:** `SIN-Passwordmanager` target binding catalog

## BUG-20260317-013: `spm:import:sops` can import encrypted ciphertext when decryption fails
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** After importing `secrets/agents.enc.env`, Stripe API verification used a stored value beginning with `ENC[...]` instead of a real secret key.
**Ursache:** `workers/spm-a2a/src/import-sops.mjs` fell back to reading the raw encrypted file whenever `sops -d` failed, so ciphertext could be written into SPM as if it were plaintext.
**Fix:** `workers/spm-a2a/src/import-sops.mjs` now supplies the default age key path and fails closed for `.enc.env` files when SOPS decryption still fails.
**Datei:** `workers/spm-a2a/src/import-sops.mjs`

## BUG-20260317-014: `spm:import:sops` omitted the default SOPS age key path
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** Direct import failed to decrypt `secrets/agents.enc.env` even though `scripts/secrets-run.sh` could expose the same secrets.
**Ursache:** `workers/spm-a2a/src/import-sops.mjs` did not pass the default `~/.config/sops/age/keys.txt` path into the SOPS subprocess.
**Fix:** `workers/spm-a2a/src/import-sops.mjs` now injects the same default `SOPS_AGE_KEY_FILE` path used by the repo helper scripts.
**Datei:** `workers/spm-a2a/src/import-sops.mjs`

## BUG-20260317-015: Stored Stripe secret key is syntactically valid but rejected by Stripe API
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** Stripe account lookup with the SPM-backed `STRIPE_SECRET_KEY` returns `Invalid API Key provided`.
**Ursache:** The encrypted repo secret currently contains an invalid, revoked, or placeholder Stripe secret key.
**Fix:** Replace `STRIPE_SECRET_KEY` in the governed secret source with a valid Stripe secret key, then re-import/sync before E2E or onboarding verification.
**Datei:** `secrets/agents.enc.env` / `STRIPE_SECRET_KEY`

## BUG-20260317-016: Temp token inspection can leak OAuth access tokens in plain tool output
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** Reading a temp JSON file created from `sin-authenticator token.issue` exposed a full Hugging Face OAuth access token in plain output.
**Ursache:** Debug inspection used a generic file-read step on a file that still contained the raw token payload.
**Fix:** Never inspect token payload files with generic read tools; parse/store/delete them in one step and only print boolean/redacted metadata.
**Datei:** local token-issue debug workflow

## BUG-20260317-017: Parallel `sin-authenticator` calls collide on embedded authd port
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** One parallel `sin-authenticator run-action` call failed with `listen EADDRINUSE: address already in use 127.0.0.1:44712`.
**Ursache:** Multiple embedded authd sessions can race for the same local port when `sin-authenticator` is invoked in parallel.
**Fix:** Serialize `sin-authenticator` calls or ensure a shared remote authd is already running before parallel usage.
**Datei:** `A2A-SIN-Authenticator` local invocation workflow

## BUG-20260317-018: `sin-authenticator token.issue` may emit output but not terminate promptly
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `sin-authenticator run-action '{"action":"token.issue",...}'` produced a valid token payload but the wrapper process did not exit before the outer command timeout.
**Ursache:** Embedded authd/runtime teardown appears incomplete after `token.issue` in the current wrapper flow.
**Fix:** Ensure `run-action` always shuts down the embedded authd session before process exit, or wrap issuance through a dedicated one-shot helper.
**Datei:** `A2A-SIN-Authenticator` run-action flow

## BUG-20260317-019: Sin-authenticator-issued HF token can read space metadata but cannot write space secrets
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** The Hugging Face token issued via `sin-authenticator` resolves `whoami` and `space runtime`, but secret writes to `delqhi/simone-webshop-api` still return `403 Forbidden`.
**Ursache:** The current Hugging Face account grant lacks the permission level required for Space secret mutation.
**Fix:** Re-authenticate/grant a Hugging Face token with the required write/admin repo scope, then rerun SPM fanout.
**Datei:** `sin-authenticator` Hugging Face auth grant / `delqhi/simone-webshop-api`

## BUG-20260317-020: Cloudflare deploy secret set is incomplete for worker publish
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `scripts/deploy-cloudflare-worker.sh` exits with `No usable Cloudflare auth found` even when run through decrypted repo secrets.
**Ursache:** The available secret set exposes `CLOUDFLARE_API_KEY` but not a matching `CLOUDFLARE_EMAIL`/`CF_EMAIL`, and no usable Wrangler OAuth token was discovered.
**Fix:** Add `CLOUDFLARE_API_TOKEN`, or pair `CLOUDFLARE_API_KEY` with the matching email, or restore a valid Wrangler login before deploy.
**Datei:** `scripts/deploy-cloudflare-worker.sh` auth inputs

## BUG-20260317-021: Local Hugging Face CLI auth points at a different account than sin-authenticator
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `hf auth whoami` resolves to `ZOEsolar123`, while `sin-authenticator` resolves the active governed HF account as `delqhi`.
**Ursache:** Local Hugging Face CLI token state is not aligned with the `sin-authenticator` broker account.
**Fix:** Align the local HF CLI login with the governed `delqhi` account or avoid mixing CLI token state with `sin-authenticator`-issued credentials.
**Datei:** local Hugging Face auth state (`~/.cache/huggingface/token` vs `sin-authenticator`)

## BUG-20260317-022: Deploy helper leaves `apps/api/.git-hf` mirror that breaks repo guards
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `pnpm run guard:lines` and `pnpm run guard:complexity` report dozens of violations under `apps/api/.git-hf/...`.
**Ursache:** `scripts/deploy-hf-api.sh` stages a full mirror into `apps/api/.git-hf` and leaves it in the workspace after deploy attempts.
**Fix:** Removed the stale `.git-hf` artifact before rerunning guards; `guard:complexity` now passes again.
**Datei:** `scripts/deploy-hf-api.sh` / `apps/api/.git-hf`

## BUG-20260317-023: Line guard still fails on real file `apps/api/cmd/migrate/main.go`
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** After excluding `.git-hf` noise, `pnpm run guard:lines` still reports `apps/api/cmd/migrate/main.go: 307 lines (rule 150)`.
**Ursache:** The real migrate entrypoint exceeded the current line-count guard budget and was not baseline-pinned for this rule.
**Fix:** Split the migrate command into `main.go`, `db_ops.go`, and `migrations_fs.go`; `guard:lines` and `test:api:native` now pass.
**Datei:** `apps/api/cmd/migrate/main.go`

## BUG-20260317-024: HF OAuth callback state can expire before user completes reauth
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** Hugging Face reauth page returned `Login fehlgeschlagen / State is invalid or expired`.
**Ursache:** The authd-backed `login.start` callback window expired before the browser flow completed, likely because the waiting process was no longer active.
**Fix:** Start a fresh reauth flow and keep the authd/login process alive until callback completes.
**Datei:** `sin-authenticator` Hugging Face reauth flow

## BUG-20260317-025: HF OAuth write-repos grant still cannot mutate Space secrets
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** After successful reauth, `sin-authenticator` account state shows `write-repos`, but `add_space_secret` for `delqhi/simone-webshop-api` still returns `403 Forbidden`.
**Ursache:** The current OAuth-based HF grant is still insufficient for Space secret mutation, or the space requires a different token/permission model than the authd-issued OAuth access token.
**Fix:** Use a Hugging Face personal access token with confirmed write/admin capability for `delqhi/simone-webshop-api`, or otherwise upgrade the account permission model before retrying fanout.
**Datei:** Hugging Face auth grant / `delqhi/simone-webshop-api` secret fanout

## BUG-20260317-026: HF browser-token workaround is blocked by project SSOT governance
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** User requested browser automation (`webauto-nodriver`) to fix Hugging Face token handling, but NotebookLM confirms no specific `interaction_invariant` / `security_gate` / `halt_condition` exists for Hugging Face login, token management, or secret fanout flows in this project.
**Ursache:** The project SSOT defines only generic browser governance and explicitly requires per-flow browser definitions before such workflows may run.
**Fix:** Add Hugging Face login/token/secret-fanout browser flow definitions to the Master Google Doc and re-query NotebookLM before attempting browser automation.
**Datei:** Simone project SSOT / browser governance

## BUG-20260317-009: OpenCode MCP config points `sin-authenticator` to missing build artifact
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** `~/.config/opencode/opencode.json` points `mcp.sin-authenticator.command[1]` to `/Users/jeremy/dev/SIN-Solver/a2a/team-infratructur/A2A-SIN-Authenticator/dist/src/cli.js`, but that file does not exist.
**Ursache:** Config referenced a built CLI artifact directly instead of the repo wrapper that can build/launch the agent.
**Fix:** Updated `~/.config/opencode/opencode.json` to use `/Users/jeremy/dev/SIN-Solver/bin/sin-authenticator serve-mcp`.
**Datei:** `~/.config/opencode/opencode.json`

## BUG-20260317-010: JSON LSP tooling unavailable because `biome` is not installed
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** JSON LSP operations fail with `LSP server 'biome' is configured but NOT INSTALLED` / `Command not found: biome`.
**Ursache:** OpenCode was configured to use the Biome LSP for JSON-family files, but the `biome` executable was not available on PATH.
**Fix:** Installed `@biomejs/biome` globally, linked `biome` into `~/.local/bin`, and re-verified JSON LSP with `lsp_diagnostics` on `~/.config/opencode/opencode.json` and `~/.config/opencode/mcp.json`.
**Datei:** OpenCode JSON LSP environment

## BUG-20260317-011: `sin-authenticator serve-mcp` exits immediately
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** After switching OpenCode MCP config to `/Users/jeremy/dev/SIN-Solver/bin/sin-authenticator serve-mcp`, the command appeared to exit immediately with code `0` instead of keeping the MCP server alive.
**Ursache:** False positive during smoke test: stdio MCP exits when stdin is already closed. The original check did not hold stdin open.
**Fix:** Re-tested with stdin kept open; `bin/sin-authenticator serve-mcp` stays alive as expected under the MCP contract.
**Datei:** `~/.config/opencode/opencode.json`, `A2A-SIN-Authenticator/src/cli.ts`

## BUG-20260317-013: Glob/Grep search tools time out on workspace root
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `glob` and `grep` tool calls against `.` timed out after 60s while searching for `sin-authenticator`.
**Ursache:** Unknown; likely large workspace or tool timeout limit.
**Fix:** Narrow search path or pattern; consider chunked searches per repo when needed.
**Datei:** OpenCode tool runtime

## BUG-20260317-014: Glob tool errors on missing cache entries
**Aufgetreten:** 2026-03-17  **Status:** 🔴 OFFEN
**Symptom:** `glob` reports rg errors for missing cache files under `.opencode-runtime-unlimited/.cache/.bun/install/cache/...` and missing venv binaries during workspace search.
**Ursache:** Workspace contains stale cache or venv paths referenced by the search backend.
**Fix:** Ignore missing cache paths or prune stale entries before running global searches.
**Datei:** OpenCode tool runtime

## BUG-20260317-015: Root repo commit blocked by stale `.git/index.lock`
**Aufgetreten:** 2026-03-17  **Status:** ✅ GEFIXT
**Symptom:** Root-repo commits fail with `fatal: Unable to create '/Users/jeremy/.git/index.lock': File exists.`
**Ursache:** A stale root-repo lock file remained for hours while only read-only `git ls-files` processes were active.
**Fix:** Verified the lock age / active processes, removed the stale `/Users/jeremy/.git/index.lock`, and re-ran the blocked commits successfully.
**Datei:** `/Users/jeremy/.git/index.lock`
