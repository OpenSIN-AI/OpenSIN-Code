# 🔄 Open Auth Rotator (OAR-Skript)

## Overview
This module contains the Open Auth Rotator (OAR) used for autonomous Google Workspace credential rotation. It seamlessly provisions and rotates temporary Google Workspace accounts to bypass strict API limits and provide fresh OAuth tokens to the Antigravity proxy.

## Architecture
- **Core Engine:** Written in Python, utilizes nodriver and the Google Admin SDK.
- **Fallback Flow:** Automatically detects `412 conditionNotMet` errors and intelligently restores eligible, aged deleted rotator accounts.
- **Integration:** Outputs standard token and auth configurations that are instantly picked up by `Provider/opencode-antigravity-auth`.

## Best Practices
- **Do not modify core logic:** The `core/main_rotate.py` flow is strictly audited to avoid Google detection.
- **Credentials:** The script requires a valid Workspace Admin Service Account JSON. Never commit this to the repository.
