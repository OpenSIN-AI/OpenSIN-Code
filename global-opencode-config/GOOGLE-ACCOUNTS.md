# Google Account Matrix

Canonical, non-optional identity mapping for all SIN/OpenCode agents.

## Default rule

- Existing Google Docs / Drive documents owned by `zukunftsorientierte.energie@gmail.com` -> use the **OAuth user account** `zukunftsorientierte.energie@gmail.com`
- Google Admin / Workspace operations -> use the **OAuth admin account** `info@zukunftsorientierte-energie.de`
- Server-to-server Drive/Docs jobs -> use the **service account** `ki-agent@artificial-biometrics.iam.gserviceaccount.com` only when the file/folder is explicitly shared with it or created by it
- When Google Docs auth, quota, or permissions are broken -> generate a local `.docx` via `sin-document-forge` and place it in `/Users/jeremy/Google Drive/Geteilte Ablagen/OpenSolver-Repo in Organisation verschieben`

## Matrix

| Use case | Mandatory identity | Auth mode | Notes |
|---|---|---|---|
| Existing Google Docs in My Drive | `zukunftsorientierte.energie@gmail.com` | `oauth_user` | Best for tabs, child tabs, comments, existing folders |
| Existing Google Drive folders in personal Gmail Drive | `zukunftsorientierte.energie@gmail.com` | `oauth_user` | Service account cannot assume visibility |
| Google Admin Console / Workspace / DWD | `info@zukunftsorientierte-energie.de` | `oauth_user` | Must use the `Geschäftlich` Chrome profile |
| Shared folder explicitly granted to service account | `ki-agent@artificial-biometrics.iam.gserviceaccount.com` | `service_account` | Good for backend automation |
| High-speed document generation | `sin-document-forge` | `offline_local_generation` | Create DOCX locally, then sync/upload |
| Legacy IMAP/SMTP only | app password | `app_password` | Never for Docs/Drive APIs |

## Canonical identities

### 1. Google Docs / Drive primary operator

- **Email:** `zukunftsorientierte.energie@gmail.com`
- **Auth mode:** `oauth_user`
- **Chrome profile:** `Default`
- **Profile path:** `/Users/jeremy/Library/Application Support/Google/Chrome/Default`
- **Use for:** existing Docs, Drive, tab-aware editing, collaboration docs
- **Never use for:** Admin Console, Workspace administration

### 2. Workspace admin operator

- **Email:** `info@zukunftsorientierte-energie.de`
- **Auth mode:** `oauth_user`
- **Chrome profile:** `Geschäftlich`
- **Profile path:** `/Users/jeremy/Library/Application Support/Google/Chrome/Geschäftlich`
- **Use for:** Admin Console, DWD, Workspace user/config operations
- **Never use for:** default personal Docs editing unless explicitly intended

### 3. Service account operator

- **Email:** `ki-agent@artificial-biometrics.iam.gserviceaccount.com`
- **Auth mode:** `service_account`
- **Credential file:** `/Users/jeremy/.config/opencode/auth/google/zukunftsorientierte.energie@gmail.com.json`
- **Use for:** server-to-server jobs, files/folders explicitly shared with the service account, automation without browser state
- **Never use for:** assuming access to user-owned Docs in My Drive
- **Important:** service-account Drive quota is separate and can fail even if the human Gmail account still has free space

### 4. Offline DOCX fallback

- **Tool:** `sin-document-forge`
- **MCP:** `sin-document-forge`
- **Output folder:** `/Users/jeremy/Google Drive/Geteilte Ablagen/OpenSolver-Repo in Organisation verschieben`
- **Use for:** fast, deterministic document generation without waiting on Google Docs permissions or quotas

## Hard rules

- Never guess which Google account to use.
- Never use the service account for an existing user-owned Doc unless the Doc is explicitly shared with `ki-agent@artificial-biometrics.iam.gserviceaccount.com`.
- Never use app passwords for Google Docs / Drive / Sheets.
- Never use the admin account for routine personal-doc editing when the Gmail account owns the document.
- For new enterprise documents, prefer offline generation via `sin-document-forge` and then sync/upload.

## Related files

- Machine-readable matrix: `/Users/jeremy/.config/opencode/google-account-matrix.json`
- Global rules: `/Users/jeremy/.config/opencode/AGENTS.md`
- Chrome profiles: `/Users/jeremy/dev/docs/chrome/chrome-profiles.md`

## Access escalation rule

- If a user asks an agent to update a Google Doc and the acting service account does not have access, the preferred path is:
  1. try the correct OAuth user identity from the matrix
  2. if unavailable and user approval or bypass permissions is present, perform a self-share flow to grant the service account editor access
  3. then retry the Docs API operation
- Agents must not stop at "no access" when an approved self-share path exists.
