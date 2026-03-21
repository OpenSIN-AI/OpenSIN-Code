# Preflight Gates & Eval Release Gate

The Preflight system ensures that agents are qualified to run specific workflows.

## Async Preflight

Starting in Phase 2, `runPreflight` is an **async** function. This allows for dynamic loading of the Evaluation module and real-time threshold validation.

```javascript
import { runPreflight } from '@sin-solver/core';
const result = await runPreflight(config, 'pull-request');
```

## Eval Release Gate

The `runEval` command computes quality metrics from trace artifacts. It enforces a **Release Gate** based on configurable thresholds.

### Thresholds
- `overall`: Minimum cumulative quality score.
- `tool_usage`: Precision and recall of tool calls.
- `hallucination_rate`: Maximum allowed drift from factual context.
- `policy_compliance`: Mandatory adherence to AGENTS.md rules.

### Eval Artifact
Generated at `.sin/artifacts/eval.json`:
```json
{
  "scores": { "overall": 92, "accuracy": 95 },
  "releaseGate": "pass",
  "thresholds": { "overall": 80 }
}
```

If the `releaseGate` is `block`, the `preflight` command will exit with a non-zero status, preventing further execution (e.g., in a CI/CD pipeline).
