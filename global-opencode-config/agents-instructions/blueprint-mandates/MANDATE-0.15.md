# MANDATE 0.15: AI SCREENSHOT SOVEREIGNTY (AUTO-CLEANUP)

**AI screenshots NEVER pollute the Desktop.**

All AI tools MUST save screenshots to `~/Bilder/AI-Screenshots/[tool]/`:

| Tool | Directory | Cleanup |
|------|-----------|---------| 
| nodriver | `~/Bilder/AI-Screenshots/nodriver/` | 7 days → archive |
| Steel Browser | `~/Bilder/AI-Screenshots/steel/` | 7 days → archive |
| OpenCode | `~/Bilder/AI-Screenshots/opencode/` | 7 days → archive |

**Auto-Cleanup Schedule:**
- **Daily 3:00 AM:** Desktop cleanup (recordings > 7 days, screenshots > 30 days)
- **Daily 4:00 AM:** AI screenshot archive (files > 7 days → archive)
- **Monthly:** Archive cleanup (archives > 30 days deleted)

**LaunchAgents:**
- `~/Library/LaunchAgents/com.sincode.desktop-cleanup.plist`
- `~/Library/LaunchAgents/com.sincode.ai-screenshot-cleanup.plist`

---

**Source:** ~/.config/opencode/Agents.md (Line 1087-1109)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
