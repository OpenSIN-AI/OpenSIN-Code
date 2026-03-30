# Troubleshooting

## Run exits with code `3`

Symptom:
- `generate` or `resume` returns status `awaiting_judge` and exit code `3`.

Fix:
- This is expected in `chat_bridge` mode.
- Open the bridge files in `<run-dir>/bridge/attempt-XX/`.
- Create `judge_response.json` from template and run:
  - `video_forge.py resume --run-dir <run-dir> --judge-response <json>`

## `resume` says run is not awaiting judge

Symptom:
- `Run is not awaiting judge. Current status: ...`

Fix:
- Check `<run-dir>/manifest.json` status.
- Only runs with `status=awaiting_judge` can be resumed.
- If run is already `completed` or `failed`, start a new run.

## Judge response validation fails

Symptom:
- `run_id mismatch`, `attempt mismatch`, or invalid candidates.

Fix:
- Use the generated `judge_response.template.json` for that exact attempt.
- Keep `run_id`, `attempt`, and `candidate_id` values unchanged.
- Ensure scores are in `0..1`.

## YouTube source evidence missing in bridge

Symptom:
- `judge_request.json` has empty or missing `source_evidence`.

Fix:
- Ensure `--input-youtube-url` is provided.
- Keep `--youtube-include-source-media` enabled (default).
- In `--dry-run`, source media download is skipped by design; URL-level evidence is still included.
- Check `asset_graph.json -> youtube_items[*].source_media` for `download_error` or `download_skipped_reason`.

## Google API timeout or auth failures for YouTube metadata

Symptom:
- `youtube_items[*].google_api.error = google_api_timeout` or `google_api_lookup_failed`.

Fix:
- Verify service account file path (`--google-service-account-json`).
- Ensure YouTube Data API is enabled in the GCP project.
- Optionally set `GOOGLE_API_KEY` and keep `--google-api-key-env GOOGLE_API_KEY` for fallback.
- Metadata timeout is hard-bounded; pipeline continues with yt-dlp fallback metadata.

## All candidates fail repeatedly

Symptom:
- Run loops over attempts and then fails budget.

Fix:
- Increase source specificity (`--brand-url`, `--style-url`, clearer prompt constraints).
- Increase candidate count before increasing retries.
- Keep `judge-max-iterations` and `judge-max-minutes` realistic for your workload.
- Check `fix_instructions` in judge response and keep them concrete.

## Generation fails with endpoint errors

Symptom:
- 4xx/5xx across variants.

Fix:
- Verify `NVIDIA_API_KEY` and endpoint access.
- Run `probe` first to validate route/contract.
- Keep `--endpoint-strategy profile_fallback` and avoid disabling contract fallback unless debugging.

## NVCF exec route requires reference media

Symptom:
- Errors indicate missing input asset references.

Fix:
- Provide at least one `--input-image` or `--input-video`.
- For pure text generation, use a non-reference route/profile.

## Ingest crawls too much or too little

Symptom:
- Not enough or too many pages in `asset_graph.json`.

Fix:
- Tune `--crawl-max-pages` and `--crawl-max-depth`.
- Use `ingest` first to preview crawl behavior.
- Use `--compliance-mode strict` for conservative URL handling.

## Overlay stage fails

Symptom:
- `Overlay application failed`.

Fix:
- Confirm `ffmpeg` is installed and in PATH.
- Validate overlay files exist and are valid media.
- Start with template-only overlays (`--overlay-template world_news`) to isolate file issues.

## Voice stage fails

Symptom:
- Riva bootstrap or synthesis errors.

Fix:
- Ensure `NVIDIA_API_KEY` is set.
- Retry without `--skip-voice-bootstrap` to allow runtime setup.
- Verify `voice` command standalone first.

## Dashboard missing

Symptom:
- `run_dashboard.html` not generated.

Fix:
- Ensure `--no-html-report` is not set.
- Check write permissions for `--out-dir`.
- Inspect stderr for dashboard write warnings.

## QA bridge profile check fails

Symptom:
- `Bridge schema profile validation failed` in `qa` command.

Fix:
- Ensure QA JSON contains: `semantic_score`, `temporal_score`, `artifact_flags`, `reasons`, `pass_fail`.
- Re-run with `--json-out` to inspect exact payload.
