# Model Matrix (Hosted NVIDIA + Judge Strategies)

Last reviewed: 2026-02-27

## Generation Profiles

| Profile | Family | Default usage | Notes |
| --- | --- | --- | --- |
| `predict1` | Cosmos Predict1 | text-first generation and reference fallback | default when no reference media |
| `transfer2_5` | Cosmos Transfer 2.5 | reference-preserving edits/remix | auto-selected when reference media exists |
| `transfer1` | Cosmos Transfer 1 | compatibility fallback | optional explicit selection |

Hosted default endpoints are resolved in `video_forge.py` and can be overridden via CLI/env.

## Judge Strategies

| Judge mode | Transport | Default | Notes |
| --- | --- | --- | --- |
| `chat_bridge` | local bridge files + same chat session | yes | no `codex exec`; exits `3` awaiting `resume` |
| `nvidia_qa` | `video_qa_gate_openai_compat.py` with NVIDIA-compatible endpoint | no | strict technical + semantic + temporal gate |
| `openai_api` | same QA wrapper with custom OpenAI-compatible base URL | no | for direct API judging |
| `dual` | QA gate first, chat-bridge fallback | no | emits bridge when QA rejects |

## Judge Score Aggregation

Current aggregate weighting:

- semantic: `0.45`
- temporal: `0.25`
- branding/style: `0.15`
- technical gate: `0.10`
- instruction coverage: `0.05`
- artifact penalty: `-0.01 * count`

Pass gate requires:

- technical checks pass
- semantic >= threshold
- temporal >= threshold
- no hard-fail artifacts

## Voice Profiles (Riva)

| Voice profile | Typical use |
| --- | --- |
| `magpie_multilingual` | default enterprise narration |
| `magpie_zeroshot` | style transfer / clone-like use cases |
| `fastpitch_hifigan` | low-latency baseline TTS |

## Source Adapter Utilization

All source types are normalized into `asset_graph.json` and consumed by prompt planning:

- image/video/audio files
- product + person image pairs (UGC-style planning)
- website URLs / blog URLs
- YouTube URLs (metadata-first ingest)
- style URL / brand URL / brand logo
- overlay templates + overlay files

YouTube ingest details:

- Metadata path: Google YouTube Data API (`service account` preferred, `API key` fallback).
- Visual evidence path: optional source video download + keyframe extraction for chat-bridge judging.
- Compliance interaction: `strict` mode blocks source media download; `warn/override` allow download attempts.

## Artifact Contract

Every run writes reproducible artifacts:

- `manifest.json`
- `qa_report.json`, `qa_report.md`
- `asset_graph.json`, `source_report.md`
- `brand_profile.json`
- `overlay_plan.json`
- `asr_plan.json` (audio cases)
- `bridge/attempt-XX/*` (chat bridge)
- `final_video.mp4` or `final_video_rejected.mp4`
