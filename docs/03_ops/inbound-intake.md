# Inbound Intake

> **Status:** Active | **Last Updated:** 2026-04-05 | **Owner:** OpenSIN-AI Fleet

This document describes the inbound intake system for OpenSIN-Code. All external work entering this repository MUST pass through this pipeline.

## Architecture

```
External Platform → Webhook/Poller → Normalization → Dedup → Signature Check → GitHub Issue → A2A Dispatch
```

## Pipeline Stages

### 1. Ingress (Webhook/Poller)
- **Webhook:** POST to `/webhooks/opensin-code-inbound`
- **Polling:** Configured per platform in `platforms/registry.json`
- **Max Payload:** 1MB
- **Timeout:** 30s

### 2. Normalization
All external payloads are normalized to the canonical `work_item` schema:

```json
{
  "sourcePlatform": "github",
  "sourceEventType": "issue",
  "externalId": "12345",
  "externalUrl": "https://github.com/...",
  "title": "Fix bug in...",
  "summary": "Detailed description...",
  "receivedAt": "2026-04-05T20:00:00Z",
  "dedupeKey": "github:12345",
  "targetRepo": "OpenSIN-AI/OpenSIN-Code",
  "labels": ["bug", "high-priority"],
  "priority": "high",
  "riskLevel": "low",
  "automationPolicy": "issue_only",
  "watcherRequired": true,
  "issueNumber": null,
  "prNumber": null
}
```

**Schema:** `~/.config/opencode/templates/work-item.schema.json`

### 3. Deduplication
- **Strategy:** Cursor-based per platform
- **Cursor Storage:** Supabase `sin_platform_cursors` table
- **Key Format:** `{platform}:{external_id}`
- **Behavior:** Duplicate payloads are silently dropped

### 4. Signature Verification
- **GitHub:** HMAC-SHA256 via `X-Hub-Signature-256` header
- **n8n:** API key via `X-N8N-API-KEY` header
- **Telegram:** Bot token authentication
- **Fail-Closed:** Unverified payloads are rejected

### 5. GitHub Issue Creation
- Every work_item creates or updates a GitHub issue
- Labels are mapped from source platform labels
- Issue body includes source metadata and summary
- Issue number is stored back in the work_item

### 6. A2A Dispatch
- Work items are routed to specialized A2A Coder Agents
- Routing is based on `governance/coder-dispatch-matrix.json`
- Agents claim tasks via A2A protocol
- Failed dispatches are queued with retry

## Platform Onboarding

To add a new platform:

1. **Register in `platforms/registry.json`:**
   ```json
   {
     "my-platform": {
       "id": "my-platform",
       "name": "My Platform",
       "type": "webhook",
       "status": "active",
       "capabilities": ["issue", "pr"],
       "authentication": { "type": "api-key" },
       "intake": { "webhookPath": "/webhooks/my-platform" },
       "deduplication": { "strategy": "cursor-based" },
       "signatureVerification": { "enabled": true },
       "issueMapping": { "autoCreate": true }
     }
   }
   ```

2. **Create normalization script:** `scripts/normalize-my-platform.mjs`

3. **Configure webhook/poller** on the external platform

4. **Test with dry-run:**
   ```bash
   curl -X POST http://localhost:5678/webhooks/opensin-code-inbound \
     -H "Content-Type: application/json" \
     -d '{"source": "my-platform", "title": "Test", "body": "Test work item"}'
   ```

5. **Activate platform** in registry (set `status: "active"`)

## Fail-Closed Rules

| Rule | Enforcement |
|------|-------------|
| No raw external payloads in repos | All payloads MUST be normalized |
| No work without GitHub issue | Issue MUST be created first |
| No platform without registry entry | Registry entry required |
| No activation without signature verification | Signature MUST be verified |
| No activation without dedup | Dedup cursor MUST be configured |
| No activation without issue mapping | Issue mapping MUST be defined |

## Troubleshooting

### Payload not arriving
1. Check webhook URL is correct: `/webhooks/opensin-code-inbound`
2. Verify authentication headers
3. Check n8n workflow logs

### Duplicate issues created
1. Check dedup cursor in Supabase
2. Verify `dedupeKey` format is unique
3. Check cursor update logic

### Issue not linked to PR
1. Check PR body for "Fixes #N" pattern
2. Verify issue number is correct
3. Check linked issue update logic

### Agent not claiming task
1. Check agent health in dispatch matrix
2. Verify agent capabilities match work_item labels
3. Check fallback routing

## Related Files

| File | Purpose |
|------|---------|
| `governance/repo-governance.json` | Repo governance rules |
| `governance/pr-watcher.json` | PR watcher configuration |
| `governance/coder-dispatch-matrix.json` | Agent routing matrix |
| `platforms/registry.json` | Platform registry |
| `n8n-workflows/inbound-intake.json` | n8n intake workflow |
| `scripts/watch-pr-feedback.sh` | PR watcher entrypoint |

## Canonical References

- `~/.config/opencode/INBOUND_WORK_ARCHITECTURE.md`
- `~/.config/opencode/templates/work-item.schema.json`
- `~/.config/opencode/templates/platform-registry.schema.json`
- `~/.config/opencode/templates/pr-watcher.schema.json`
