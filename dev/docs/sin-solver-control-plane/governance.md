# Fleet Governance (Phase 2)

The `sin govern` command implements the "Governed State" projection for the entire SIN-Solver fleet.

## Governance Lifecycle

1. **Scan**: The CLI iterates through all agents defined in `registry/fleet-metadata.v1.json`.
2. **Execute Doctor**: Runs `runDoctorChecks` on every agent with a `.sin/` config.
3. **Execute Eval**: Computes scores from the latest trace artifacts via `runEval`.
4. **Docs Drift**: Checks for drift between repo docs and projection surfaces via `runDocsSyncReport`.
5. **Compute Governed State**:
   - `ready`: All checks pass, eval score above threshold, no docs drift.
   - `degraded`: Non-blocking failures or waived checks present.
   - `blocked`: Blocking failures (P0) detected.
   - `unknown`: No `.sin/` config found or agent local path missing.

## Reporting

The governance run generates a `generated/governance-report.json` which is then projected into the Fleet Dashboard to provide a real-time heatmap of fleet health.

```bash
# Run fleet-wide governance
sin govern --sin-solver-root /Users/jeremy/dev/SIN-Solver
```

## Governance Schema

Governed agents must satisfy the `governedState` schema:
- `status`: One of `ready`, `degraded`, `blocked`, `unknown`.
- `lastDoctorRun`: ISO timestamp.
- `blockingFailures`: Count of P0 failures.
- `waivedChecks`: Count of waived checks.
- `evalScore`: Overall evaluation score (0-100).
- `docsSyncDrift`: Boolean indicating if documentation is out of sync.
