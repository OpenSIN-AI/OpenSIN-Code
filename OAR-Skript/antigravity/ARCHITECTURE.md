# openAntigravity-auth-rotator — Architecture

> ⛔ FROZEN STATE — 2026-03-16 — DO NOT MODIFY core flow without documented reason
> All critical invariants are the result of hard-won bug fixes (RBUG-001…RBUG-064).
> Changing anything here will break the rotation.

---

## Actual Code Path (main.py)

```
main.py → dispatch() → rotate_account()   [core/main_rotate.py]
    │
    ├─ 0. PRE-CLEANUP  _cleanup_old_rotator_users(keep=credentials.json user)
    │       → lists ALL "Rotator" users in workspace domain
    │       → deletes EVERYTHING except current active user
    │       → runs even if rotation FAILS → no orphans ever
    │
    ├─ 1. _rotate_create_user()            [core/main_rotate_user.py]
    │       → create_workspace_user()      [core/workspace_create.py]
    │       → disable_login_challenge()    [core/workspace_challenge.py]
    │
    ├─ 2. _rotate_run_oauth(email, pw)     [core/main_rotate_oauth.py]
    │       → _run_login()                 [core/login/login_async.py]
    │           → connect_tab()            [core/login/login_chrome.py]
    │               profile: /tmp/openAntigravity_login_profile_7654
    │               browser: nodriver uc.start() — native macOS Chrome ARM64
    │           → browser.get(..., new_tab=True) → eigener OAuth-Tab
    │               step01_navigate  (OAuth URL with openid email profile cloud-platform)
    │               step02_email     (local-part only + optional "Anderes Konto verwenden")
    │               step03_password  (CDP dispatchKeyEvent per char — NOT send_keys)
    │               step03b_tos      (DOM click → CDP click → Tab x11 + Enter fallback)
    │               step04_otp       (iMessage OTP if prompted)
    │               step05_consent   (consent/callback → capture auth code)
    │
    ├─ 3. _rotate_exchange_tokens()        [core/main_rotate_tokens.py]
    │       → exchange auth code → access_token + refresh_token + email
    │
    ├─ 3b. provision_managed_project()     [core/token_onboard.py]
    │       → POST onboardUser (polls until done=true, 15 retries)
    │       → returns managedProjectId (e.g. "amazing-effect-kp51c")
    │       → loadCodeAssist returns 400 for new users — use onboardUser ONLY
    │
    ├─ 4. _rotate_inject_and_cleanup()     [core/main_rotate_inject.py]
    │       → inject_new_account()         [core/accounts.py]
    │           → REPLACES ALL accounts with 1 new one (no dedup)
    │           → sets activeIndex=0
    │       → inject_opencode_google_auth() → ~/.local/share/opencode/auth.json
    │
    └─ 5. POST-CLEANUP _cleanup_old_rotator_users(keep=new email)
            → second safety net: clean workspace after successful rotation
```

---

## Critical Invariants — DO NOT CHANGE

### 1. OAuth Scope (step01_navigate.py)
Must include `openid email profile cloud-platform` — ALL FOUR.
- `openid email profile` → userinfo returns email field
- `cloud-platform` → Antigravity managed project access
**Removing ANY scope → email="" → dedup bug → account accumulation**

### 2. Password Fill (step03_fill.py / step03_password.py)
MUST use CDP `dispatchKeyEvent` per character — **NOT** `send_keys`.
- `send_keys` fails on `/v3/signin/challenge/pwd` (field appears filled but value is empty)
- Must click field to focus, Ctrl+A to clear, then type char-by-char
- Must verify `field.value.length > 0` after typing, retry once if 0

### 2b. Email Fill (step02_fill.py)
For `zukunftsorientierte-energie.de` hosted login, step 02 must type only the local part (`rotator-...`) when Google already renders the fixed domain suffix.
- Full email is not always expected in the field
- Step must not advance until a visible password field or `/challenge/pwd` is reached

### 2c. New Workspace Welcome Page (gaplustos)
The `https://accounts.google.com/speedbump/gaplustos` page is mandatory for fresh users and must be handled in this exact order:
- direct DOM click on `Verstanden`
- fallback CDP mouse click on the same button
- final fallback keyboard `Tab` × 11 then `Enter`
- do not replace this with service-account shortcuts or app-password workarounds

### 3. User Delete Timing
Delete happens at **START of NEXT rotation** (ws00 / pre-cleanup), NOT at end of current.
- Deleting user while their OAuth token is in use → Google immediately invalidates ALL tokens
- Pattern: new rotation starts → delete previous user → create new user → login

### 4. Account Replace (accounts_inject.py)
`inject_new_account()` MUST replace ALL existing accounts with only 1 new one.
- No dedup by email → empty string "" would match on every failed run
- `storage["accounts"] = [new_account]` — always exactly 1

### 5. Chrome Close (login_async.py)
`close_debug_chrome()` in `try/finally` — ALWAYS runs, even on login failure.
- Chrome profile: `/tmp/openAntigravity_login_profile_7654`
- The dedicated debug Chrome on port `7654` must be killed after popup-dismiss / token capture so the flow does not keep clicking in the background
- Without finally: Chrome process stays alive as orphan

### 6. Full Orphan Sweep (main_cleanup_users.py)
`_cleanup_old_rotator_users()` called TWICE:
- Before rotation (keep credentials.json user) — cleans failed-run orphans
- After rotation (keep new email) — final cleanup
- Also rewrites local account storage down to exactly one kept account

### 7. auth.json Isolation
`inject_opencode_google_auth()` must ONLY touch the `google` key:
```python
auth.pop("google", None)  # ← ONLY remove google key
auth["google"] = {...}    # ← ONLY set google key
# NEVER: auth = {...}  ← would delete openai key (kills opencodex-auth-rotator)
```

### 8. managedProjectId via onboardUser (token_onboard.py)
`managedProjectId` MUST be fetched via `onboardUser` endpoint — **NOT** `loadCodeAssist`.
- `loadCodeAssist` returns 400 for brand-new Workspace users → always empty string
- `onboardUser` provisions a GCP managed project → async, poll until `done=true`
- Without `managedProjectId`: plugin reports "invalid refresh tokens" for all Gemini models
- Without `managedProjectId`: Gemini 3.1 Pro endpoint routing fails completely
**NEVER use loadCodeAssist to set managedProjectId for new rotation users**

### 9. Claude -> Gemini-API Mini-Fallback (watcher_loop.py)
Watcher now has a dedicated lightweight fallback before full rotation:
- if logs show Claude rate-limit and Gemini fallback is OFF -> enable Gemini API fallback
- restart OpenCode sessions with `gemini-api/gemini-3.1-pro-preview`
- on the next successful full rotation -> disable Gemini API fallback again
- do not write a top-level `provider.gemini-api.apiKey` ever again

### 10. OpenCode Session Restart Timing (RBUG-060)
Sessions are NOT part of the default rotator path anymore.
- Sequence ends at workspace-create → OAuth → token-inject/auth-update → cleanup
- No terminal closing/opening, no agent switching, no implicit `mach weiter`
- `OPENANTIGRAVITY_RESTART_OPENCODE=1` is only an explicit debug opt-in for helper code paths, not the normal rotation / LaunchAgent flow
- LaunchAgent responsibility is trigger-only

### 11. Chrome Sync Dialog After Callback (RBUG-061)
"In Chrome anmelden?" dialog MUST be dismissed before browser.stop().
- Dialog appears AFTER OAuth redirect to localhost (after code capture) — NOT before
- It is not required for token capture itself; `localhost:51121/...code=...` already means success
- Preferred choice is `Chrome ohne Konto verwenden`
- On the nativeapp popup page, do NOT run generic background button clicks; dismiss the Chrome dialog first, then close the debug Chrome session
- A Google app-password does not help with this prompt or the OAuth flow

---

## File Map

| File | Role |
|------|------|
| `core/main_rotate.py` | Rotation orchestrator — calls all sub-steps |
| `core/token_onboard.py` | provision_managed_project() via onboardUser — sets managedProjectId |
| `core/login/login_async.py` | Browser login flow (try/finally Chrome close) |
| `core/login/login_chrome.py` | nodriver Chrome start (`/tmp/openAntigravity_login_profile_7654`, dedicated port 7654 cleanup) |
| `core/login/step01_navigate.py` | OAuth URL with all 4 scopes |
| `core/login/step03_fill.py` | CDP dispatchKeyEvent password fill |
| `core/login/step03b_workspace_tos.py` | Click "Verstanden" ToS button |
| `core/accounts.py` | inject_new_account — replace-all logic |
| `core/main_cleanup_users.py` | Full rotator-* sweep |
| `core/gemini_config.py` | Safe Gemini fallback toggle (`options.apiKey` only) |
| `core/gemini_fallback.py` | Claude rate-limit -> Gemini API fallback activation |
| `core/opencode_restart.py` | Restart OpenCode sessions, optional `-m provider/model` |
| `core/workspace_list.py` | list_rotator_users via Admin API |
| `core/main_rotate_user.py` | create + disable challenge |

## What is NOT Used by main.py

> ⚠️ These exist in the repo but are NOT called by main.py:
> - `orchestrator/runner.py` — separate experimental path
> - `orchestrator/steps_rotate.py` — step list for runner.py only
> - `steps/chrome/chrome01_open.py` — CDP port 9223, `logs/rotation_profile`
> - `steps/chrome/chrome02_close.py` — `pgrep rotation_profile`
> - `steps/login/login_all.py` — orchestrator login wrapper
>
> main.py uses `core/login/login_async.py` → nodriver directly.


1. **NO `asyncio.run()`** -- nodriver owns its event loop. Always use `uc.loop().run_until_complete(coro)`.
2. **Atomic writes only** -- always write to `.tmp` then `os.replace(tmp, target)`.
3. **No `subprocess(shell=True)`** -- always pass list of args.
4. **Shims stay thin** -- shim files are 3-5 line re-exports; callers need zero changes.
5. **1 file = 1 job, <= 20 lines** -- the micro-process law.

## Bug Registry

| ID        | File                       | Description                                               | Status   |
|-----------|----------------------------|-----------------------------------------------------------|----------|
| RBUG-001  | core/login/run.py          | Used `asyncio.run()` -- nodriver has own event loop       | FIXED    |
| RBUG-002  | core/utils.py notify()     | Unescaped `"` and `'` crashed osascript                  | FIXED    |
| RBUG-003  | main.py                    | `from core.browser_login import ...` -- module never existed | FIXED |
| RBUG-047  | steps/workspace/ws00_delete_prev.py | Deleted user while token active → immediate invalidation | FIXED |
| RBUG-048  | core/login/step01_navigate.py | Missing `openid email profile` scopes → email="" | FIXED |
| RBUG-049  | core/accounts_inject.py    | Dedup on email="" → account accumulation on failures     | FIXED    |
| RBUG-050  | core/login/step03_fill.py  | `send_keys` fails on `/v3/signin/challenge/pwd`          | FIXED    |
| RBUG-055  | steps/workspace/ws00_delete_prev.py | Only deleted 1 prev account, not all orphans  | FIXED    |
| RBUG-056  | core/login/login_async.py  | Missing `browser.stop()` in finally → Chrome orphan      | FIXED    |
| RBUG-057  | core/main_rotate.py        | `managedProjectId` always empty (used loadCodeAssist→400)| FIXED    |
| RBUG-058  | core/watcher_loop.py       | Gemini Flash fallback phase in watcher → removed         | FIXED    |
| RBUG-059  | tools/resize_img.py        | Vertex AI rejects images >8000px → `imgfix` tool added   | WORKAROUND |
| RBUG-060  | orchestrator/steps_rotate.py | Sessions killed before auth — oc01b moved to last step  | FIXED    |
| RBUG-061  | steps/login/login_all.py   | Chrome sync dialog not dismissed → added step 08 post-consent | FIXED |
| RBUG-062  | multiple files             | Flash/model-switch dead code not purged after RBUG-058 — 345 lines deleted | FIXED |

## Directory Tree

```
core/
  utils_log.py           log(msg, level); LOG_DIR/LOG_FILE constants      <=15
  utils_notify.py        notify(title, msg) with escaped quotes            <=10
  utils_password.py      generate_password(length)                         <=8
  utils_chrome.py        quit_chrome() kills Chrome + removes Singleton    <=14
  utils_patch.py         apply_nodriver_py314_patch()                      <=12
  utils.py               SHIM: re-exports above                            <=5

  config_path.py         CONFIG_DIR, CONFIG_PATH constants                 <=6
  config_load.py         load_config(), config_exists(), get()             <=15
  config_save.py         save_config(), update_config()                    <=12
  config.py              SHIM                                               <=5

  accounts_path.py       ACCOUNTS_PATH, OPENCODE_AUTH_PATH, EMPTY_STORAGE <=12
  accounts_load.py       load_accounts()                                   <=16
  accounts_save.py       save_accounts()                                   <=16
  accounts_opencode.py   inject_opencode_google_auth()                     <=18
  accounts_inject.py     inject_new_account()                              <=20
  accounts_backup.py     backup_accounts()                                 <=12
  accounts_emails.py     get_all_emails()                                  <=5
  accounts.py            SHIM                                               <=8

  token_consts.py        all Antigravity API constants                     <=15
  token_exchange_req.py  HTTP POST to Google token endpoint                <=15
  token_userinfo.py      fetch_email(access_token)                         <=15
  token_exchange_code.py exchange_code_for_tokens()                        <=12
  token_project_req.py   HTTP loop over LOAD_ENDPOINTS                     <=15
  token_project.py       fetch_project_id()                                <=8
  token_helpers.py       build_stored_refresh_token(), compute_token_expiry<=7
  token_exchange.py      SHIM                                               <=5

  gcp_run.py             _run() subprocess helper                          <=12
  gcp_project.py         get_or_create_project()                           <=18
  gcp_apis.py            enable_apis(), set_billing_project()              <=12
  gcp_guide.py           guide_manual_oauth_setup()                        <=20
  gcp_setup.py           run_setup()                                       <=14
  gcp_cli.py             SHIM                                               <=5

  plugin_paths.py        path/name constants                               <=8
  plugin_in_config.py    _is_in_config(), _is_in_cache()                  <=14
  plugin_add.py          _add_to_config()                                  <=16
  plugin_prompt.py       _prompt_run_opencode_once(), _abort_missing_config<=16
  plugin_check.py        check_plugin_installed(), assert_plugin_installed <=20

  workspace_service.py   _build_service(), _get_domain()                  <=18
  workspace_create.py    create_workspace_user()                           <=18
  workspace_update.py    disable_login_challenge()                         <=10
  workspace_delete.py    delete_workspace_user()                           <=10
  workspace_list.py      list_rotator_users()                              <=10
  workspace_api.py       SHIM                                               <=6

  sms_reader.py          _load_reader(), OTP_PATTERN, GOOGLE_SENDERS       <=14
  sms_poll.py            _poll_once()                                       <=18
  sms_otp.py             wait_for_sms_otp() polling loop                   <=16

  watcher_config.py      all watcher constants/patterns                    <=20
  watcher_log_scan.py    _check_log_file(), _scan_logs()                   <=20
  watcher_accounts_check.py  _check_accounts_blocked()                     <=18
  watcher_guardian_token.py  _refresh_google_token()                       <=14
  watcher_guardian_write.py  _write_google_auth()                          <=13
  watcher_guardian.py    guard_google_auth()                               <=18
  watcher_loop.py        run_loop(state, callback, interval)               <=20
  watcher.py             Watcher class + LOCK_FILE export                  <=12

  main_ensure.py         _ensure_setup()                                   <=8
  main_rotate_user.py    _rotate_create_user()                             <=12
  main_rotate_oauth.py   _rotate_run_oauth()                               <=11
  main_rotate_tokens.py  _rotate_exchange_tokens()                         <=14
  main_rotate_inject.py  _rotate_inject_and_cleanup()                      <=10
  main_rotate.py         rotate_account() orchestrator                     <=20
  main_cleanup_users.py  _cleanup_old_rotator_users()                      <=12
  main_cmd_status.py     cmd_status()                                       <=8
  main_cmd_cleanup.py    cmd_cleanup()                                      <=16
  main_args.py           _build_parser()                                   <=12
  main_dispatch.py       dispatch(args)                                    <=20

  login/
    login_chrome.py      connect_tab() async; dedicated temp Chrome        <=18
    login_screenshot.py  screenshot_path(), wait_and_screenshot()          <=12
    shared.py            SHIM                                               <=3
    step01_pkce.py       _pkce_pair()                                       <=9
    step01_url.py        build_auth_url()                                   <=14
    step01_run.py        run(tab, state, challenge)                         <=8
    step01_navigate.py   SHIM                                               <=4
    step02_fill.py       fill_email()                                       <=18
    step02_email.py      run(tab, email)                                    <=4
    step03_fill.py       fill_password()                                    <=18
    step03_password.py   run(tab, password)                                 <=4
    step03b_scroll.py    _scroll_bottom()                                   <=8
    step03b_click.py     _try_click_accept() JS+CDP                         <=20
    step03b_run.py       run(tab) ToS loop                                  <=18
    step03b_workspace_tos.py  SHIM                                          <=4
    step04_imessage.py   _get_otp_from_imessage()                          <=18
    step04_otp.py        run(tab) OTP handler                              <=20
    step05_find_btn.py   _find_button_coords()                             <=12
    step05_cdp_click.py  _cdp_click(tab, x, y)                             <=9
    step05_consent.py    run(tab) consent loop                             <=20
    login_async.py       _run_login() async function                       <=18
    run.py               oauth_login() sync wrapper using uc.loop()        <=8

main.py                  parse + dispatch                                  <=8
```

---

## Atomic Architecture + Visual Truth Protocol

Every file in `shared/`, `validate/`, `steps/`, and `orchestrator/` follows the
**Atomic Architecture** mandate: ONE action per file, ≤15 lines, standalone runnable.

### Directory Layout

```
shared/
  chrome_port.py      CDP_PORT constant, write_port(), read_port()
  chrome_connect.py   connect() -> uc.Browser via CDP (no new Chrome)
  screenshot.py       save(tab, name) -> logs/screenshots/<name>.png

validate/
  recorder_start.py   start(step_name) -> subprocess.Popen (screencapture -v -x)
  recorder_stop.py    stop(proc) -> sends SIGINT, kills on timeout
  nim_check.py        check(video_path, task_desc) -> NVIDIA NIM cosmos-reason2-8b

steps/
  chrome/
    chrome01_open.py  uc.start() with master_profile + CDP port; write_port()
    chrome02_close.py connect() + browser.close()
  login/
    login01_navigate.py      PKCE pair + build_auth_url() + browser.get(url)
    login02_fill_email.py    fill_email() from logs/credentials.json
    login03_click_next.py    screenshot confirm after Next click
    login04_fill_password.py fill_password() from logs/credentials.json
    login05_click_signin.py  run_otp() (handles OTP or skips)
    login06_click_consent.py run_consent() -> saves logs/auth_code.txt
    login07_capture_code.py  verify logs/auth_code.txt exists and non-empty
  token/
    token01_exchange.py      exchange_code_for_tokens(code, verifier) -> logs/tokens.json
    token02_userinfo.py      fetch_email(access_token) -> updates logs/tokens.json
    token03_save_account.py  inject_new_account() -> antigravity-accounts.json
    token04_inject.py        inject_opencode_google_auth() -> ~/.local/share/opencode/auth.json
  workspace/
    ws01_auth.py             _build_service() smoke-check
    ws02_create.py           create_workspace_user() -> logs/credentials.json
    ws03_disable_challenge.py disable_login_challenge(email)
    ws04_delete.py           delete_workspace_user(email)
    ws05_list.py             list_rotator_users() -> stdout

orchestrator/
  runner.py      Generic VTP step runner — handles chrome01 as Popen bg, rest as run   <=20
  run_login.py   Login-only flow → delegates to runner.run(STEPS)                      <=7
  run_rotate.py  Full rotation flow → delegates to runner.run(STEPS_ROTATE)            <=7
  steps_list.py  Login-only step list (chrome01 → login01-07 → token01-04 → chrome02)  <=15
  steps_rotate.py Full rotation step list (ws01-03 → chrome → login → token → ws04)   <=19

.env.example   NVIDIA_API_KEY placeholder
```

### State Files (logs/)

| File | Written by | Read by |
|---|---|---|
| logs/chrome_cdp_port.txt | chrome01_open | chrome_connect |
| logs/credentials.json | ws02_create | login02, login04 |
| logs/pkce_verifier.txt | login01_navigate | token01_exchange |
| logs/auth_code.txt | login06_click_consent | token01_exchange |
| logs/tokens.json | token01_exchange | token02, token03, token04 |
| logs/screenshots/*.png | shared/screenshot | human review |
| logs/recordings/*.mp4 | validate/recorder_start | validate/nim_check |

### Invariants
- NEVER asyncio.run() -- always uc.loop().run_until_complete()
- NVIDIA_API_KEY only from environment variable, never hardcoded
- Chrome persistence via ./logs/master_profile (shared user_data_dir)
- Screen recording via screencapture -v -x (no ffmpeg)
