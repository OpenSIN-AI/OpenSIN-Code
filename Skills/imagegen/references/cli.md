# CLI reference (`scripts/gemini_image_router.py`)

This file contains the command catalog for the bundled Gemini-first router. Keep `SKILL.md` as overview-first; put verbose CLI details here.

## What this CLI does
- `generate`: generate new images from a prompt
- `edit`: edit an existing image with Gemini image models (optionally with a mask/image reference)
- `generate-batch`: run many jobs from a JSONL file (one job per line)

Default provider order:
1. `gemini-3-pro-image-preview`
2. `gemini-3.1-flash-image-preview`
3. `imagen-4.0-fast-generate-001`
4. NVIDIA NIM via configured endpoint

Real API calls require network access plus provider-specific credentials. `--dry-run` does not.

## Quick start (works from any repo)
Set a stable path to the skill CLI (default `OPENCODE_HOME` is `~/.config/opencode`):

```
export OPENCODE_HOME="${OPENCODE_HOME:-$HOME/.config/opencode}"
export IMAGE_GEN="$OPENCODE_HOME/skills/imagegen/scripts/gemini_image_router.py"
```

Dry-run (no API call; no network required):

```
python "$IMAGE_GEN" generate --prompt "Test" --dry-run
```

Generate with Gemini-first routing:

```
uv run --with google-genai python "$IMAGE_GEN" generate \
  --prompt "A cozy alpine cabin at dawn" \
  --size 1536x1024
```

No `uv` installed? Use your active Python env:

```
python "$IMAGE_GEN" generate --prompt "A cozy alpine cabin at dawn" --size 1024x1024
```

Provider credentials:

```
export GEMINI_API_KEY="..."
```

Optional Imagen fallback prerequisites:

```
export GOOGLE_CLOUD_PROJECT="my-project"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

Optional NVIDIA emergency fallback prerequisites:

```
export NVIDIA_API_KEY="..."
export NVIDIA_IMAGE_ENDPOINT="https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell"
```

Fast env detection:

```
python "$IMAGE_GEN" doctor
```

Minimal live test with Gemini:

```
python "$IMAGE_GEN" generate \
  --prompt "single matte ceramic cup on a warm cream background, premium ecommerce hero image, no text" \
  --size 1024x1024 \
  --out output/imagegen/live-test.png
```

Minimal live test with explicit NVIDIA fallback only:

```
NVIDIA_IMAGE_ENDPOINT="https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell" \
python "$IMAGE_GEN" generate \
  --prompt "single matte ceramic cup on a warm cream background, premium ecommerce hero image, no text" \
  --size 1024x1024 \
  --out output/imagegen/live-test-nvidia.jpg
```

## Guardrails (important)
- Use `python "$IMAGE_GEN" ...` (or equivalent full path) for generations/edits/batch work.
- Do **not** create one-off runners (e.g. `gen_images.py`) unless the user explicitly asks for a custom wrapper.
- `scripts/image_gen.py` is legacy OpenAI-only tooling. Do not use it unless the user explicitly asks for OpenAI.

## Defaults (unless overridden by flags)
- Primary model: `gemini-3-pro-image-preview`
- Fallback model: `gemini-3.1-flash-image-preview`
- Emergency fallback 1: `imagen-4.0-fast-generate-001`
- Emergency fallback 2: NVIDIA NIM, defaulting to `https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell`
- Size: `1024x1024`
- Output format: `png`
- The router requests `1K`/`2K` image size with aspect ratio derived from `--size`.

## Generate vs edit
- `generate` is the best path for new campaign art, lifestyle visuals, hero images, and merchandising images.
- `edit` stays on Gemini models because the Imagen/NVIDIA fallbacks in this skill are generation-oriented.
- For strict mask-driven inpainting, repeat invariants in the prompt and treat mask support as best-effort on the Gemini path.

Example:
```
python "$IMAGE_GEN" edit \
  --image input.png \
  --prompt "Change only the background; keep the product silhouette unchanged" \
  --size 1024x1024
```

## Optional deps
Prefer `uv run --with ...` for an out-of-the-box run without changing the current project env; otherwise install into your active env:

```
uv pip install google-genai pillow
```

## Common recipes
Generate with augmentation fields:

```
python "$IMAGE_GEN" generate \
  --prompt "A minimal hero image of a ceramic coffee mug" \
  --use-case "landing page hero" \
  --style "clean product photography" \
  --composition "centered product, generous negative space" \
  --constraints "no logos, no text"
```

Generate multiple prompts with provider routing:

```
mkdir -p tmp/imagegen
cat > tmp/imagegen/prompts.jsonl << 'EOF'
{"prompt":"Cavernous hangar interior with a compact shuttle parked center-left, open bay door","use_case":"game concept art environment","composition":"wide-angle, low-angle, cinematic framing","lighting":"volumetric light rays through drifting fog","constraints":"no logos or trademarks; no watermark","size":"1536x1024"}
{"prompt":"Gray wolf in profile in a snowy forest, crisp fur texture","use_case":"wildlife photography print","composition":"100mm, eye-level, shallow depth of field","constraints":"no logos or trademarks; no watermark","size":"1024x1024"}
EOF

python "$IMAGE_GEN" generate-batch --input tmp/imagegen/prompts.jsonl --out-dir out

# Cleanup (recommended)
rm -f tmp/imagegen/prompts.jsonl
```

Notes:
- Per-job overrides are supported in JSONL (`size`, `n`, `image`, `images`, `mask`, and prompt-augmentation fields).
- `--n` generates multiple variants for a single prompt; the router will keep provider order per job.
- Treat the JSONL file as temporary: write it under `tmp/` and delete it after the run (don’t commit it).

## CLI notes
- Supported sizes: `1024x1024`, `1536x1024`, `1024x1536`, or `auto`.
- The router maps those sizes to supported Google aspect ratios and `1K`/`2K` output sizes.
- Default output is `output.png`; multiple images become `output-1.png`, `output-2.png`, etc.
- If a provider returns a different MIME type than the requested extension, the router rewrites the extension to match the actual image bytes.
- Use `--no-augment` to skip prompt augmentation.
- `--dry-run` prints provider availability in order without making API calls.
- `doctor` prints the current env/config status for each provider in JSON lines.

## See also
- API parameter quick reference: `references/image-api.md`
- Prompt examples: `references/sample-prompts.md`
