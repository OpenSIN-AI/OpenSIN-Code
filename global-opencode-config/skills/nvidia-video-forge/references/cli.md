# CLI Reference (`scripts/video_forge.py`)

## Commands

- `generate`: multisource generation pipeline with iterative judge loop.
- `resume`: continue a run in `awaiting_judge` with `judge_response.json`.
- `ingest`: source-adapter preview only (`asset_graph.json` + `source_report.md`).
- `qa`: QA gate on an existing video.
- `voice`: NVIDIA Riva narration synthesis.
- `probe`: endpoint + payload contract diagnostics.

## `generate`

Core:

- `--prompt`
- `--hosted`
- `--model-profile {auto,predict1,transfer1,transfer2_5}`
- `--quality {max,balanced,fast}`

Multisource inputs (repeatable where noted):

- `--input-image <path>`
- `--input-video <path>`
- `--input-audio <path>`
- `--input-product-image <path>`
- `--input-person-image <path>`
- `--input-url <url>`
- `--input-blog-url <url>`
- `--input-youtube-url <url>`
- `--style-url <url>`
- `--brand-url <url>`
- `--brand-logo <path-or-url>`
- `--overlay-template <name>`
- `--overlay-file <path>`

Planning / remix:

- `--target-duration-seconds <int>`
- `--remix-mode {structure_preserve,content_rebuild,direct_restyle}`
- `--compliance-mode {strict,warn,override}`
- `--crawl-max-pages <int>`
- `--crawl-max-depth <int>`

YouTube + Google API:

- `--google-service-account-json <path>`
- `--google-api-key-env <env-var>` (default: `GOOGLE_API_KEY`)
- `--youtube-include-source-media` / `--no-youtube-include-source-media`
- `--youtube-source-frame-count <int>`

Judge loop:

- `--judge-mode {chat_bridge,nvidia_qa,openai_api,dual}` (default: `chat_bridge`)
- `--judge-model <name>`
- `--judge-model-alias <name>` (default: `gpt-5.3-codex`)
- `--judge-base-url <https-url>`
- `--judge-max-iterations <int>` (default: `6`)
- `--judge-max-minutes <int>` (default: `45`)
- `--chat-bridge-mode {agent_resume,terminal_paste,file_baton}`
- `--qa-threshold <float>`

Voice and output:

- `--voice-text <text>` or `--voice-audio <path>`
- `--voice-model {magpie_multilingual,magpie_zeroshot,fastpitch_hifigan}`
- `--voice-function-id <uuid-or-url>`
- `--voice-language-code <code>`
- `--voice-name <name>`
- `--voice-sample-rate <int>`
- `--voice-server <host:port>`
- `--voice-gain-db <float>`
- `--voice-cache-dir <path>`
- `--skip-voice-bootstrap`
- `--out-dir <path>`
- `--html-report-name <name>`
- `--no-html-report`

Generation controls:

- `--num-candidates <int>`
- `--max-retries <int>`
- `--seed <int>`
- `--timeout <int>`
- `--http-retries <int>`
- `--max-request-attempts <int>`
- `--nvcf-poll-seconds <int>`
- `--pending-backoff-seconds <float>`
- `--pending-backoff-max-seconds <float>`
- `--endpoint-strategy {strict,profile_fallback}`
- `--disable-contract-fallback`
- `--nim-endpoint <url>`
- `--api-key-env <env-var>`
- `--dry-run`

## `resume`

- `resume --run-dir <abs-path> --judge-response <json-file>`
- Expects run status `awaiting_judge` and validates bridge payload against run metadata.
- On reject: generates next attempt and returns to `awaiting_judge` (exit code `3`) until budget is exhausted.

## `ingest`

Runs source adapters without generation.

Output artifacts:

- `asset_graph.json`
- `source_report.md`
- `brand_profile.json`
- `overlay_plan.json`
- `asr_plan.json` (when audio provided)
- YouTube source evidence under `sources/youtube/...` when media ingest is enabled and allowed by compliance mode.

## `qa`

Additional profile flag:

- `--schema-profile {standard,bridge}`

`bridge` profile asserts bridge-compatible response fields exist in QA output.

## Chat-Bridge Exit Codes

- `0`: completed pass.
- `2`: completed with rejection/failure.
- `3`: awaiting judge response (`resume` required).
- `1`: pipeline error.

## Example: URL + podcast -> news reel (chat bridge)

```bash
python3 scripts/video_forge.py generate \
  --prompt "Create a branded news video from the provided sources" \
  --input-audio /abs/podcast.mp3 \
  --input-blog-url https://example.com/blog/post \
  --brand-url https://example.com \
  --overlay-template world_news \
  --judge-mode chat_bridge \
  --hosted
```

## Example: Continue from judge result

```bash
python3 scripts/video_forge.py resume \
  --run-dir /abs/output/nvidia-video-forge/20260227-... \
  --judge-response /abs/judge_response.json
```

## Example: YouTube source visual bridge with Google service account

```bash
python3 scripts/video_forge.py generate \
  --prompt "Remix this YouTube structure with my branding" \
  --input-youtube-url https://www.youtube.com/watch?v=... \
  --google-service-account-json /abs/creds/google-service-account.json \
  --google-api-key-env GOOGLE_API_KEY \
  --youtube-include-source-media \
  --youtube-source-frame-count 16 \
  --judge-mode chat_bridge \
  --hosted
```
