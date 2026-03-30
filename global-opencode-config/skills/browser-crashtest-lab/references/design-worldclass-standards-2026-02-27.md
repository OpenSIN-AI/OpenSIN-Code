# Design Worldclass Standards (Stand: 2026-02-27)

## Dual-Model Jury Architecture

- Judge 1: Codex app vision review in the current Codex chat (no external OpenAI API call), optionally via local Codex CLI.
- Judge 2: NVIDIA NIM multimodal model `qwen3.5-397b-a17b`.
- Fusion: conservative union gate (`FAIL` if any judge returns `FAIL` or emits `P0`).

## Primary Sources

### NVIDIA Qwen 3.5 NIM

- Model card:
  - https://build.nvidia.com/qwen/qwen3.5-397b-a17b
- Hosted API usage (`/v1/chat/completions`, multimodal content):
  - https://build.nvidia.com/qwen/qwen3.5-397b-a17b?api=true
- Hosted API base documentation:
  - https://docs.api.nvidia.com/

### Accessibility and Semantics

- WCAG 2.2:
  - https://www.w3.org/TR/WCAG22/
- Understanding: Reflow:
  - https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
- Understanding: Contrast Minimum:
  - https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Understanding: Target Size (Minimum):
  - https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- WAI-ARIA APG:
  - https://www.w3.org/WAI/ARIA/apg/

### Performance and Reliability

- Core Web Vitals:
  - https://web.dev/articles/vitals
- Lighthouse scoring:
  - https://github.com/GoogleChrome/lighthouse/blob/main/docs/scoring.md
- Lighthouse CI assertions:
  - https://raw.githubusercontent.com/GoogleChrome/lighthouse-ci/main/docs/configuration.md

### Enterprise Design System Baselines

- Atlassian foundations:
  - https://atlassian.design/foundations/
- Fluent 2 foundations:
  - https://fluent2.microsoft.design/
- Carbon design system:
  - https://carbondesignsystem.com/
- Design tokens format:
  - https://www.designtokens.org/tr/drafts/format/

## Scoring Contract (1000 Scale)

- Accessibility & Compliance: 300
- Visual System Discipline: 250
- Interaction & Usability: 200
- Performance & Runtime Quality: 150
- Premium Aesthetic Coherence: 100

Grade bands:
- A+: >=960
- A: >=920
- B: >=860
- C: >=780
- D: >=700
- F: <700

Hard-fail conditions:
- Any P0 finding.
- Overall score below configured minimum threshold.
- Missing required model judge output in strict mode.
