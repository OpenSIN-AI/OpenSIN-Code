# Prompting Guide (Cosmos, Pro Video)

Use compact, explicit prompts. One subject, one action arc, one camera plan.

## Production Prompt Pack Template

```text
Use case: <ad / product hero / cinematic b-roll / etc>
Primary request: <single sentence objective>
Subject lock: <identity, shape, material, brand-critical traits>
Scene lock: <location, time-of-day, atmosphere>
Action arc: <begin -> middle -> end in one short motion concept>
Camera plan: <lens style + one dominant move + framing>
Lighting + color: <key light, contrast, palette>
Temporal invariants: <what must remain stable frame-to-frame>
Hard constraints: <must keep>
Avoid: <artifact and failure list>
```

## Model-Aligned Rules

- Keep prompts concise and concrete. Prefer clean production instructions over long prose.
- Keep one main camera movement per short clip.
- Use explicit invariants for identity, geometry, and palette.
- Include an `Avoid` block for known failures (`flicker`, `jitter`, `warping`, `temporal drift`, `broken anatomy`).
- If reference media is provided, describe only intended delta, not a full scene rewrite.

## Transfer-Focused Guidance

- For transfer workflows, keep subject and scene consistency explicit.
- Keep motion and camera instructions physically plausible.
- If transfer quality drops, reduce prompt complexity before increasing retries.

## Retry Correction Pattern

When QA fails, append a targeted correction block:

```text
Correction pass:
- Keep original intent, subject identity, and camera continuity.
- Fix only: <top 1-3 QA reasons>
- Preserve composition and timing.
- Avoid: <repeat severe artifact list>
```

## Anti-Patterns

- Multiple unrelated actions in one short clip.
- Competing camera directions in the same shot.
- Missing hard constraints for identity/framing.
- Blind reruns without corrective delta.

## Source Links (Official, 2026-02-26)

- Cosmos Transfer reference and best-practice prompt examples: <https://docs.nvidia.com/cosmos/latest/transfer/cosmos-transfer1-reference.html>
- Cosmos Predict diffusion reference: <https://docs.api.nvidia.com/nim/reference/nvidia-cosmos-1_0-diffusion-7b>
- Cosmos Prompting Guide overview: <https://docs.nvidia.com/cosmos/latest/prompting-guide/prompting-guide-overview.html>
