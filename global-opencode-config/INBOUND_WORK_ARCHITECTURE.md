# Inbound Work Architecture

Canonical flow for all external work sources:

1. n8n intake
2. normalized work item
3. GitHub issue create/update
4. repo execution branch/PR
5. PR watcher feedback loop

## Mandatory split

- n8n owns ingress, webhook/poller execution, signature checks, and payload normalization.
- GitHub owns durable work state via issues and PRs.
- PR watchers own review/comment follow-up only after a PR exists.
- No repo may consume raw Bugcrowd/HackerOne/freelancer payloads directly.

## Required normalized work item fields

- `sourcePlatform`
- `sourceEventType`
- `externalId`
- `externalUrl`
- `title`
- `summary`
- `rawPayloadRef`
- `receivedAt`
- `dedupeKey`
- `targetRepo`
- `labels`
- `priority`
- `riskLevel`
- `automationPolicy`
- `watcherRequired`
- `issueNumber`
- `prNumber`

## Mandatory repo artifacts

- `governance/repo-governance.json`
- `governance/pr-watcher.json`
- `platforms/registry.json`
- `n8n-workflows/inbound-intake.json`
- `docs/03_ops/inbound-intake.md`
- `scripts/watch-pr-feedback.sh`

## Fail-closed rules

- missing platform registry entry -> block automation
- missing repo governance contract -> block repo activation
- missing issue mapping -> block execution
- missing PR watcher config in governed repo -> block completion
- missing signature validation for webhook platforms -> block activation
- duplicate external event without idempotent dedupe key -> block mutation until normalized

## Platform activation states

- `planned`: idea exists, no verified intake
- `intake-only`: webhook/poller exists, no issue mapping
- `issue-live`: intake + issue creation/update verified
- `review-live`: issue + PR watcher handoff verified
- `active`: intake + issue + PR watcher + documentation all verified

## Scope discipline

- external platform intake belongs in n8n and adapter workflows
- implementation work belongs in GitHub issues/branches/PRs
- review feedback belongs in PR watchers
- do not claim a platform is active if only adapter code exists without verified intake and issue mapping
