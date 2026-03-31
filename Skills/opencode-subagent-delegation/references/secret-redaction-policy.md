# Secret Redaction Policy

Policy mode:
- strict only

Sensitive sources:
- `.env`
- `.env.*`
- credentials files
- key/token/password/private key style fields

Rules:
1. Never pass raw secret values into bundle or delta text artifacts.
2. Replace sensitive values with `[REDACTED]`.
3. Keep key names/structure where possible.
4. Canonical docs from the current project are allowed as references, but any secret-like values found in extracted fulltext must remain redacted.
5. Fail bundle generation if non-redacted secret patterns remain in context artifacts.
