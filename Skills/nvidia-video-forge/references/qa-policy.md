# QA Policy

## Pass/fail gates

A candidate passes only if all are true:

1. Technical checks pass.
2. `semantic_score >= threshold`.
3. `temporal_score >= threshold`.
4. No hard-fail artifact condition.

Default threshold: `0.82`.

Recommended production threshold band:

- `0.82` baseline
- `0.86` for stricter enterprise delivery gates

## Technical checks

- `decode_ok == true`
- `duration_ok == true` (minimum duration)
- `fps_ok == true` (minimum frame rate)
- `short_edge_ok == true` (minimum resolution short edge)
- Thresholds are configurable in CLI via `--min-duration`, `--min-fps`, and `--min-short-edge`.

## Scoring

Aggregate ranking score used for deterministic best-candidate selection:

```text
score = 0.55 * semantic_score
      + 0.35 * temporal_score
      + 0.10 * technical_score
      - artifact_penalty
```

Where:

- `technical_score` is `1.0` if all technical checks pass, else `0.0`.
- `artifact_penalty` defaults to `0.01 * artifact_count`.

## Hard-fail artifact classes

Treat severe quality defects as automatic fail:

- severe flicker
- frame corruption
- severe blur
- heavy blocking/compression collapse
- identity drift
- geometric warping
- temporal collapse

## Retry policy

- Default max retries: `2`.
- Use targeted prompt corrections from QA reasons.
- Keep original intent; only patch failure points.
- If all retries fail, mark run failed and emit full artifacts.
- Do not ship without QA artifacts and dashboard (`manifest.json`, `qa_report.json`, `qa_report.md`, HTML dashboard).

## Candidate strategy

- Default quality mode (`max`) should run at least 3 candidates.
- Selection must remain deterministic by aggregate score, with stable tie behavior.
- This follows NVIDIA-style rejection-sampling practice: generate multiple candidates, evaluate, keep the best valid output.
- Dashboard reporting should surface semantic/temporal/technical/aggregate score bars and QA reasons for auditability.

## Source links (official, 2026-02-26)

- Cosmos Predict2 cookbook pipeline (rejection sampling concept): <https://docs.nvidia.com/cosmos/latest/predict2/cosmos-predict2-cookbook-pipeline.html>
- Cosmos Transfer evaluation guidance: <https://docs.nvidia.com/cosmos/latest/transfer/cosmos-transfer-cookbook-evaluation.html>
