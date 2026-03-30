#!/usr/bin/env python3
"""Gemini-first image generation router.

Provider order:
1. Nano Banana Pro -> gemini-3-pro-image-preview
2. Nano Banana 2   -> gemini-3.1-flash-image-preview
3. Imagen 4 Fast   -> imagen-4.0-fast-generate-001
4. NVIDIA NIM      -> hosted FLUX endpoint or configured OpenAI-compatible endpoint

The router supports generate, edit, and batch workflows. Edits stay on the
Gemini chain; Imagen/NVIDIA are generation-oriented fallbacks.
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
from pathlib import Path
import sys
from typing import Any, Dict, Iterable, List, Optional, Tuple
from urllib import error as urlerror
from urllib import request as urlrequest

from google import genai
from google.genai import types


PRIMARY_GEMINI_MODEL = "gemini-3-pro-image-preview"
FALLBACK_GEMINI_MODEL = "gemini-3.1-flash-image-preview"
IMAGEN_FALLBACK_MODEL = "imagen-4.0-fast-generate-001"
NVIDIA_DEFAULT_ENDPOINT = "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell"
DEFAULT_SIZE = "1024x1024"
DEFAULT_OUTPUT_FORMAT = "png"
DEFAULT_COUNT = 1
MAX_BATCH_JOBS = 500

ALLOWED_SIZES = {"1024x1024", "1536x1024", "1024x1536", "auto"}
ALLOWED_OUTPUT_FORMATS = {"png", "jpeg", "jpg", "webp"}


class MissingProviderConfig(RuntimeError):
    pass


class ProviderAttemptError(RuntimeError):
    pass


def _die(message: str, code: int = 1) -> None:
    print(f"Error: {message}", file=sys.stderr)
    raise SystemExit(code)


def _warn(message: str) -> None:
    print(f"Warning: {message}", file=sys.stderr)


def _normalize_output_format(fmt: Optional[str]) -> str:
    if not fmt:
        return DEFAULT_OUTPUT_FORMAT
    fmt = fmt.lower()
    if fmt not in ALLOWED_OUTPUT_FORMATS:
        _die("output-format must be png, jpeg, jpg, or webp.")
    return "jpeg" if fmt == "jpg" else fmt


def _mime_for_format(fmt: str) -> str:
    return {
        "png": "image/png",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
    }[fmt]


def _nvidia_dimensions_for_size(size: str) -> Tuple[int, int]:
    return {
        "1024x1024": (1024, 1024),
        "1536x1024": (1216, 832),
        "1024x1536": (832, 1216),
        "auto": (1024, 1024),
    }[size]


def _validate_size(size: str) -> None:
    if size not in ALLOWED_SIZES:
        _die("size must be one of 1024x1024, 1536x1024, 1024x1536, or auto.")


def _validate_count(count: int) -> None:
    if count < 1 or count > 10:
        _die("n must be between 1 and 10.")


def _read_prompt(prompt: Optional[str], prompt_file: Optional[str]) -> str:
    if prompt and prompt_file:
        _die("Use --prompt or --prompt-file, not both.")
    if prompt_file:
        path = Path(prompt_file)
        if not path.exists():
            _die(f"Prompt file not found: {path}")
        return path.read_text(encoding="utf-8").strip()
    if prompt:
        return prompt.strip()
    _die("Missing prompt. Use --prompt or --prompt-file.")
    return ""


def _check_image_paths(paths: Iterable[str]) -> List[Path]:
    resolved: List[Path] = []
    for raw in paths:
        path = Path(raw)
        if not path.exists():
            _die(f"Image file not found: {path}")
        resolved.append(path)
    return resolved


def _fields_from_args(args: argparse.Namespace) -> Dict[str, Optional[str]]:
    return {
        "use_case": getattr(args, "use_case", None),
        "scene": getattr(args, "scene", None),
        "subject": getattr(args, "subject", None),
        "style": getattr(args, "style", None),
        "composition": getattr(args, "composition", None),
        "lighting": getattr(args, "lighting", None),
        "palette": getattr(args, "palette", None),
        "materials": getattr(args, "materials", None),
        "text": getattr(args, "text", None),
        "constraints": getattr(args, "constraints", None),
        "negative": getattr(args, "negative", None),
    }


def _augment_prompt_fields(
    augment: bool, prompt: str, fields: Dict[str, Optional[str]]
) -> str:
    if not augment:
        return prompt

    sections: List[str] = []
    if fields.get("use_case"):
        sections.append(f"Use case: {fields['use_case']}")
    sections.append(f"Primary request: {prompt}")
    if fields.get("scene"):
        sections.append(f"Scene/background: {fields['scene']}")
    if fields.get("subject"):
        sections.append(f"Subject: {fields['subject']}")
    if fields.get("style"):
        sections.append(f"Style/medium: {fields['style']}")
    if fields.get("composition"):
        sections.append(f"Composition/framing: {fields['composition']}")
    if fields.get("lighting"):
        sections.append(f"Lighting/mood: {fields['lighting']}")
    if fields.get("palette"):
        sections.append(f"Color palette: {fields['palette']}")
    if fields.get("materials"):
        sections.append(f"Materials/textures: {fields['materials']}")
    if fields.get("text"):
        sections.append(f'Text (verbatim): "{fields["text"]}"')
    if fields.get("constraints"):
        sections.append(f"Constraints: {fields['constraints']}")
    if fields.get("negative"):
        sections.append(f"Avoid: {fields['negative']}")
    return "\n".join(sections)


def _augment_prompt(args: argparse.Namespace, prompt: str) -> str:
    return _augment_prompt_fields(
        getattr(args, "augment", True), prompt, _fields_from_args(args)
    )


def _aspect_ratio_for_size(size: str) -> Optional[str]:
    return {
        "1024x1024": "1:1",
        "1536x1024": "3:2",
        "1024x1536": "2:3",
        "auto": None,
    }[size]


def _image_size_for_size(size: str) -> Optional[str]:
    return {
        "1024x1024": "1K",
        "1536x1024": "2K",
        "1024x1536": "2K",
        "auto": None,
    }[size]


def _guess_mime(path: Path) -> str:
    guessed, _ = mimetypes.guess_type(path.name)
    return guessed or "image/png"


def _build_output_paths(
    out: str,
    output_format: str,
    count: int,
    out_dir: Optional[str],
) -> List[Path]:
    ext = "." + output_format

    if out_dir:
        out_base = Path(out_dir)
        out_base.mkdir(parents=True, exist_ok=True)
        return [out_base / f"image_{i}{ext}" for i in range(1, count + 1)]

    out_path = Path(out)
    if out_path.exists() and out_path.is_dir():
        return [out_path / f"image_{i}{ext}" for i in range(1, count + 1)]

    if out_path.suffix == "":
        out_path = out_path.with_suffix(ext)

    if count == 1:
        return [out_path]

    return [
        out_path.with_name(f"{out_path.stem}-{i}{out_path.suffix}")
        for i in range(1, count + 1)
    ]


def _extension_for_mime(mime_type: str) -> str:
    return {
        "image/png": ".png",
        "image/jpeg": ".jpeg",
        "image/webp": ".webp",
    }.get(mime_type, ".png")


def _write_outputs(
    images: List[Tuple[bytes, str]], outputs: List[Path], force: bool
) -> None:
    for index, (image_bytes, mime_type) in enumerate(images):
        if index >= len(outputs):
            break
        out_path = outputs[index]
        preferred_ext = _extension_for_mime(mime_type)
        if out_path.suffix.lower() != preferred_ext:
            _warn(
                f"Adjusting output extension for actual MIME type {mime_type}: {out_path.suffix or '(none)'} -> {preferred_ext}"
            )
            out_path = out_path.with_suffix(preferred_ext)
        if out_path.exists() and not force:
            _die(f"Output already exists: {out_path} (use --force to overwrite)")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_bytes(image_bytes)
        print(f"Wrote {out_path}")


def _gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not key:
        raise MissingProviderConfig(
            "Gemini requires GEMINI_API_KEY or GOOGLE_API_KEY."
        )
    return key


def _vertex_project() -> str:
    project = os.getenv("GOOGLE_CLOUD_PROJECT")
    if not project:
        raise MissingProviderConfig("Imagen fallback requires GOOGLE_CLOUD_PROJECT.")
    return project


def _vertex_location() -> str:
    return os.getenv("GOOGLE_CLOUD_LOCATION") or "us-central1"


def _gemini_image_parts_from_paths(paths: List[Path]) -> List[types.Part]:
    parts: List[types.Part] = []
    for path in paths:
        parts.append(
            types.Part.from_bytes(data=path.read_bytes(), mime_type=_guess_mime(path))
        )
    return parts


def _extract_generate_content_images(
    response: Any,
) -> List[Tuple[bytes, str]]:
    parts = getattr(response, "parts", None) or []
    if not parts:
        candidates = getattr(response, "candidates", None) or []
        for candidate in candidates:
            content = getattr(candidate, "content", None)
            parts.extend(getattr(content, "parts", None) or [])

    images: List[Tuple[bytes, str]] = []
    for part in parts:
        inline = getattr(part, "inline_data", None) or getattr(part, "inlineData", None)
        if not inline:
            continue
        data = getattr(inline, "data", None)
        if not data:
            continue
        if isinstance(data, str):
            image_bytes = base64.b64decode(data)
        else:
            image_bytes = bytes(data)
        mime_type = (
            getattr(inline, "mime_type", None)
            or getattr(inline, "mimeType", None)
            or "image/png"
        )
        images.append((image_bytes, mime_type))
    return images


def _generate_with_gemini(
    *,
    model: str,
    prompt: str,
    image_paths: List[Path],
    count: int,
    size: str,
    output_format: str,
) -> List[Tuple[bytes, str]]:
    client = genai.Client(api_key=_gemini_api_key())
    contents: List[Any] = [types.Part.from_text(text=prompt)]
    contents.extend(_gemini_image_parts_from_paths(image_paths))

    aspect_ratio = _aspect_ratio_for_size(size)
    image_size = _image_size_for_size(size)
    config = types.GenerateContentConfig(
        responseModalities=["IMAGE"],
        imageConfig=types.ImageConfig(
            aspectRatio=aspect_ratio,
            imageSize=image_size,
        ),
    )

    images: List[Tuple[bytes, str]] = []
    for _ in range(count):
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
        images.extend(_extract_generate_content_images(response))

    if not images:
        raise ProviderAttemptError(f"{model} returned no image bytes.")
    return images[:count]


def _generate_with_imagen(
    *,
    model: str,
    prompt: str,
    count: int,
    size: str,
    output_format: str,
) -> List[Tuple[bytes, str]]:
    client = genai.Client(
        vertexai=True,
        project=_vertex_project(),
        location=_vertex_location(),
    )
    response = client.models.generate_images(
        model=model,
        prompt=prompt,
        config=types.GenerateImagesConfig(
            numberOfImages=count,
            aspectRatio=_aspect_ratio_for_size(size),
            imageSize=_image_size_for_size(size),
            outputMimeType=_mime_for_format(output_format),
        ),
    )
    generated = getattr(response, "generated_images", None) or []
    images = []
    for item in generated:
        image = getattr(item, "image", None)
        if not image:
            continue
        image_bytes = getattr(image, "image_bytes", None)
        mime_type = getattr(image, "mime_type", None) or _mime_for_format(output_format)
        if image_bytes:
            images.append((bytes(image_bytes), mime_type))
    if not images:
        raise ProviderAttemptError(f"{model} returned no image bytes.")
    return images


def _generate_with_nvidia(
    *,
    prompt: str,
    count: int,
    size: str,
) -> List[Tuple[bytes, str]]:
    api_key = os.getenv("NVIDIA_API_KEY")
    endpoint = os.getenv("NVIDIA_IMAGE_ENDPOINT") or NVIDIA_DEFAULT_ENDPOINT
    model = os.getenv("NVIDIA_IMAGE_MODEL") or "black-forest-labs/flux.1-schnell"

    if not api_key:
        raise MissingProviderConfig("NVIDIA fallback requires NVIDIA_API_KEY.")
    if endpoint.rstrip("/").endswith("/v1/images/generations"):
        payload = {
            "model": model,
            "prompt": prompt,
            "size": DEFAULT_SIZE if size == "auto" else size,
            "n": count,
            "response_format": "b64_json",
        }
        req = urlrequest.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlrequest.urlopen(req, timeout=180) as response:
                body = json.loads(response.read().decode("utf-8"))
        except urlerror.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")
            raise ProviderAttemptError(
                f"NVIDIA fallback failed: {exc.code} {detail}"
            ) from exc

        data = body.get("data") or []
        images: List[Tuple[bytes, str]] = []
        for item in data:
            if item.get("b64_json"):
                images.append((base64.b64decode(item["b64_json"]), "image/png"))
        if not images:
            raise ProviderAttemptError("NVIDIA fallback returned no b64_json images.")
        return images

    if "ai.api.nvidia.com/v1/genai/" in endpoint:
        width, height = _nvidia_dimensions_for_size(size)
        images: List[Tuple[bytes, str]] = []
        for _ in range(count):
            payload = {
                "prompt": prompt,
                "width": width,
                "height": height,
                "steps": 4,
                "seed": 0,
            }
            req = urlrequest.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with urlrequest.urlopen(req, timeout=180) as response:
                    body = json.loads(response.read().decode("utf-8"))
            except urlerror.HTTPError as exc:
                detail = exc.read().decode("utf-8", errors="ignore")
                raise ProviderAttemptError(
                    f"NVIDIA fallback failed: {exc.code} {detail}"
                ) from exc

            artifacts = body.get("artifacts") or []
            if not artifacts:
                raise ProviderAttemptError("NVIDIA fallback returned no artifacts.")
            artifact = artifacts[0]
            if artifact.get("finishReason") not in {None, "SUCCESS"}:
                raise ProviderAttemptError(
                    f"NVIDIA fallback finished with {artifact.get('finishReason')}."
                )
            image_b64 = artifact.get("base64")
            if not image_b64:
                raise ProviderAttemptError("NVIDIA fallback returned empty base64.")
            images.append((base64.b64decode(image_b64), "image/jpeg"))
        return images

    raise ProviderAttemptError(
        "Unsupported NVIDIA endpoint. Use the documented FLUX endpoint or an OpenAI-compatible /v1/images/generations endpoint."
    )


def _provider_chain(edit_mode: bool) -> List[Tuple[str, str, str]]:
    chain = [
        ("nano-banana-pro", "gemini", PRIMARY_GEMINI_MODEL),
        ("nano-banana-2", "gemini", FALLBACK_GEMINI_MODEL),
    ]
    if not edit_mode:
        chain.extend(
            [
                ("imagen-4-fast", "imagen", IMAGEN_FALLBACK_MODEL),
                (
                    "nvidia-nim",
                    "nvidia",
                    os.getenv("NVIDIA_IMAGE_MODEL") or "black-forest-labs/flux.1-schnell",
                ),
            ]
        )
    return chain


def _run_chain(
    *,
    prompt: str,
    image_paths: List[Path],
    count: int,
    size: str,
    output_format: str,
    dry_run: bool,
    edit_mode: bool,
) -> Tuple[str, str, List[Tuple[bytes, str]]]:
    attempts = _provider_chain(edit_mode=edit_mode)

    if dry_run:
        for label, kind, model in attempts:
            if kind == "gemini":
                configured = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
            elif kind == "imagen":
                configured = bool(os.getenv("GOOGLE_CLOUD_PROJECT"))
            else:
                configured = bool(os.getenv("NVIDIA_API_KEY") and os.getenv("NVIDIA_IMAGE_ENDPOINT"))
                if not configured and os.getenv("NVIDIA_API_KEY"):
                    configured = True
            print(
                json.dumps(
                    {
                        "provider": label,
                        "kind": kind,
                        "model": model,
                        "configured": configured,
                    }
                )
            )
        return ("dry-run", "dry-run", [])

    warnings: List[str] = []
    for label, kind, model in attempts:
        try:
            if kind == "gemini":
                images = _generate_with_gemini(
                    model=model,
                    prompt=prompt,
                    image_paths=image_paths,
                    count=count,
                    size=size,
                    output_format=output_format,
                )
            elif kind == "imagen":
                images = _generate_with_imagen(
                    model=model,
                    prompt=prompt,
                    count=count,
                    size=size,
                    output_format=output_format,
                )
            else:
                images = _generate_with_nvidia(prompt=prompt, count=count, size=size)

            print(f"provider={label}", file=sys.stderr)
            print(f"model={model}", file=sys.stderr)
            return label, model, images
        except MissingProviderConfig as exc:
            _warn(f"{label} skipped: {exc}")
            warnings.append(f"{label}: {exc}")
            continue
        except Exception as exc:
            _warn(f"{label} failed: {exc}")
            warnings.append(f"{label}: {exc}")
            continue

    _die(" ; ".join(warnings) if warnings else "No provider could generate an image.")
    return "", "", []


def _common_parser(subparser: argparse.ArgumentParser, *, edit: bool = False) -> None:
    subparser.add_argument("--prompt")
    subparser.add_argument("--prompt-file")
    subparser.add_argument("--out", default="output.png")
    subparser.add_argument("--out-dir")
    subparser.add_argument("--n", type=int, default=DEFAULT_COUNT)
    subparser.add_argument("--size", default=DEFAULT_SIZE)
    subparser.add_argument("--output-format", default=DEFAULT_OUTPUT_FORMAT)
    subparser.add_argument("--force", action="store_true")
    subparser.add_argument("--dry-run", action="store_true")
    subparser.add_argument("--no-augment", dest="augment", action="store_false")
    subparser.set_defaults(augment=True)
    subparser.add_argument("--use-case")
    subparser.add_argument("--scene")
    subparser.add_argument("--subject")
    subparser.add_argument("--style")
    subparser.add_argument("--composition")
    subparser.add_argument("--lighting")
    subparser.add_argument("--palette")
    subparser.add_argument("--materials")
    subparser.add_argument("--text")
    subparser.add_argument("--constraints")
    subparser.add_argument("--negative")
    if edit:
        subparser.add_argument("--image", action="append", required=True)
        subparser.add_argument("--mask")


def _cmd_generate(args: argparse.Namespace) -> None:
    output_format = _normalize_output_format(args.output_format)
    _validate_size(args.size)
    _validate_count(args.n)
    prompt = _augment_prompt(args, _read_prompt(args.prompt, args.prompt_file))
    _provider, _model, images = _run_chain(
        prompt=prompt,
        image_paths=[],
        count=args.n,
        size=args.size,
        output_format=output_format,
        dry_run=args.dry_run,
        edit_mode=False,
    )
    if args.dry_run:
        return
    outputs = _build_output_paths(args.out, output_format, len(images), args.out_dir)
    _write_outputs(images, outputs, args.force)


def _cmd_edit(args: argparse.Namespace) -> None:
    output_format = _normalize_output_format(args.output_format)
    _validate_size(args.size)
    _validate_count(args.n)
    prompt = _augment_prompt(args, _read_prompt(args.prompt, args.prompt_file))
    image_paths = _check_image_paths(args.image)
    if args.mask:
        image_paths.extend(_check_image_paths([args.mask]))
    _provider, _model, images = _run_chain(
        prompt=prompt,
        image_paths=image_paths,
        count=args.n,
        size=args.size,
        output_format=output_format,
        dry_run=args.dry_run,
        edit_mode=True,
    )
    if args.dry_run:
        return
    outputs = _build_output_paths(args.out, output_format, len(images), args.out_dir)
    _write_outputs(images, outputs, args.force)


def _cmd_generate_batch(args: argparse.Namespace) -> None:
    input_path = Path(args.input)
    if not input_path.exists():
        _die(f"Input JSONL not found: {input_path}")
    output_format = _normalize_output_format(args.output_format)
    _validate_size(args.size)
    _validate_count(args.n)
    lines = input_path.read_text(encoding="utf-8").splitlines()
    if len(lines) > MAX_BATCH_JOBS:
        _die(f"Batch exceeds max jobs ({MAX_BATCH_JOBS}).")
    out_root = Path(args.out_dir or "out")
    out_root.mkdir(parents=True, exist_ok=True)
    for index, raw_line in enumerate(lines, start=1):
        if not raw_line.strip():
            continue
        job = json.loads(raw_line)
        prompt = str(job.get("prompt", "")).strip()
        if not prompt:
            _die(f"Batch line {index} is missing prompt.")
        prompt = _augment_prompt_fields(
            not args.no_augment,
            prompt,
            {
                "use_case": job.get("use_case"),
                "scene": job.get("scene"),
                "subject": job.get("subject"),
                "style": job.get("style"),
                "composition": job.get("composition"),
                "lighting": job.get("lighting"),
                "palette": job.get("palette"),
                "materials": job.get("materials"),
                "text": job.get("text"),
                "constraints": job.get("constraints"),
                "negative": job.get("negative"),
            },
        )
        size = str(job.get("size", args.size))
        _validate_size(size)
        count = int(job.get("n", args.n))
        _validate_count(count)
        image_paths = []
        if job.get("images"):
            image_paths = _check_image_paths(job["images"])
        elif job.get("image"):
            image_paths = _check_image_paths([job["image"]])
        if job.get("mask"):
            image_paths.extend(_check_image_paths([job["mask"]]))

        _, _, images = _run_chain(
            prompt=prompt,
            image_paths=image_paths,
            count=count,
            size=size,
            output_format=output_format,
            dry_run=args.dry_run,
            edit_mode=bool(image_paths),
        )
        if args.dry_run:
            continue
        outputs = _build_output_paths(
            out=f"job-{index:03d}.{output_format}",
            output_format=output_format,
            count=len(images),
            out_dir=str(out_root / f"job-{index:03d}"),
        )
        _write_outputs(images, outputs, args.force)


def _cmd_doctor(_args: argparse.Namespace) -> None:
    rows = [
        {
            "name": "gemini_primary",
            "model": PRIMARY_GEMINI_MODEL,
            "configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            "required_env": ["GEMINI_API_KEY|GOOGLE_API_KEY"],
        },
        {
            "name": "gemini_fallback",
            "model": FALLBACK_GEMINI_MODEL,
            "configured": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            "required_env": ["GEMINI_API_KEY|GOOGLE_API_KEY"],
        },
        {
            "name": "imagen_fallback",
            "model": IMAGEN_FALLBACK_MODEL,
            "configured": bool(os.getenv("GOOGLE_CLOUD_PROJECT")),
            "required_env": ["GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_LOCATION(optional)"],
        },
        {
            "name": "nvidia_fallback",
            "model": os.getenv("NVIDIA_IMAGE_MODEL") or "black-forest-labs/flux.1-schnell",
            "configured": bool(os.getenv("NVIDIA_API_KEY")),
            "required_env": ["NVIDIA_API_KEY", "NVIDIA_IMAGE_ENDPOINT(optional)"],
            "default_endpoint": os.getenv("NVIDIA_IMAGE_ENDPOINT") or NVIDIA_DEFAULT_ENDPOINT,
        },
    ]
    for row in rows:
        print(json.dumps(row))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Gemini-first image generation router."
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    generate = subparsers.add_parser("generate")
    _common_parser(generate)
    generate.set_defaults(func=_cmd_generate)

    edit = subparsers.add_parser("edit")
    _common_parser(edit, edit=True)
    edit.set_defaults(func=_cmd_edit)

    batch = subparsers.add_parser("generate-batch")
    batch.add_argument("--input", required=True)
    batch.add_argument("--out-dir", default="out")
    batch.add_argument("--n", type=int, default=DEFAULT_COUNT)
    batch.add_argument("--size", default=DEFAULT_SIZE)
    batch.add_argument("--output-format", default=DEFAULT_OUTPUT_FORMAT)
    batch.add_argument("--force", action="store_true")
    batch.add_argument("--dry-run", action="store_true")
    batch.add_argument("--no-augment", action="store_true")
    batch.set_defaults(func=_cmd_generate_batch)

    doctor = subparsers.add_parser("doctor")
    doctor.set_defaults(func=_cmd_doctor)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
