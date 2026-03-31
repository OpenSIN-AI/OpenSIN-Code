# Image provider quick reference

## Provider order
1. `gemini-3-pro-image-preview` (`Nano Banana Pro`)
2. `gemini-3.1-flash-image-preview` (`Nano Banana 2`)
3. `imagen-4.0-fast-generate-001`
4. NVIDIA NIM image endpoint configured via env, defaulting to NVIDIA's hosted FLUX endpoint

## Gemini direct
- SDK: `google-genai`
- Entry point: `client.models.generate_content(...)`
- Image output config: `GenerateContentConfig(responseModalities=["IMAGE"], imageConfig=ImageConfig(...))`
- Supports text-to-image and conversational image edits with image inputs.

## Imagen fallback
- SDK: `google-genai` with `vertexai=True`
- Entry point: `client.models.generate_images(...)`
- Model: `imagen-4.0-fast-generate-001`
- Typical env: `GOOGLE_CLOUD_PROJECT`, optional `GOOGLE_CLOUD_LOCATION`, working Google Cloud auth locally.

## NVIDIA emergency fallback
- Supported endpoint patterns:
  - Hosted FLUX serverless: `https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell`
  - OpenAI-compatible: `.../v1/images/generations`
- Required env: `NVIDIA_API_KEY`
- Optional env: `NVIDIA_IMAGE_ENDPOINT`, `NVIDIA_IMAGE_MODEL`

## Core knobs the skill exposes
- `prompt`: text prompt
- `model`: selected automatically by provider order unless the user explicitly changes the routing
- `n`: number of images (1-10)
- `size`: `1024x1024`, `1536x1024`, `1024x1536`, or `auto`
- `output_format`: `png` (default), `jpeg`, `webp`
- `image`: one or more input images for edit workflows
- `mask`: optional extra reference image for edit workflows
- augmentation fields: `use_case`, `scene`, `subject`, `style`, `composition`, `lighting`, `palette`, `materials`, `text`, `constraints`, `negative`

## Limits & notes
- As of **March 8, 2026**, Google's public docs expose `gemini-3-pro-image-preview`, `gemini-3.1-flash-image-preview`, and `imagen-4.0-fast-generate-001`.
- Google's image config supports aspect ratios `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`, `21:9` and image sizes `1K`, `2K`, `4K`.
- Gemini outputs include SynthID watermarking according to the public docs.
- Imagen 4 Fast is generation-oriented in this skill; edit workflows remain Gemini-first.
