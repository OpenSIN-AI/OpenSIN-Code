# Hosted TRELLIS Contract (Verified)

Last verified: February 28, 2026 (UTC)

## Primary Endpoint

- URL: `https://ai.api.nvidia.com/v1/genai/microsoft/trellis`
- Method: `POST`
- Auth: `Authorization: Bearer $NVIDIA_API_KEY`
- Content-Type: `application/json`

## Request Schema Highlights

Path in NVIDIA docs OpenAPI: `/genai/microsoft/trellis`

Main request fields:

- `mode`: `"text" | "image"`
- `prompt`: string, max length 77
- `image`: string or null
- `output_format`: `"glb" | "stl"`
- `no_texture`: bool
- `samples`: only `1` supported
- `seed`: uint32 range
- `slat_cfg_scale`: `(1,10]`
- `ss_cfg_scale`: `(1,10]`
- `slat_sampling_steps`: `[10,50]`
- `ss_sampling_steps`: `[10,50]`

## Hosted Image-Mode Constraint

Official schema description currently states:

- Preview API image input supports predefined image tokens only:
  - `data:image/png;example_id,0`
  - `data:image/png;example_id,1`
  - `data:image/png;example_id,2`
  - `data:image/png;example_id,3`

Live check on February 28, 2026:

- custom user image `data:image/*;base64,...` -> `422 Unprocessable Entity`
- tokenized example image payload -> `200` with artifact

## Skill Strategy from This Contract

- If user provides `--reference-image` and `--input-mode auto`:
  - do reference-to-prompt adaptation first
  - run TRELLIS in `mode=text` for robust hosted behavior
- If user needs strict image mode on hosted preview endpoint:
  - use `--image-example-id {0..3}`
  - or pass a raw payload explicitly and accept potential `422`

## Sources

- NVIDIA NIM reference page:
  - https://docs.api.nvidia.com/nim/reference/microsoft-trellis
- NVIDIA Build model page:
  - https://build.nvidia.com/microsoft/trellis
