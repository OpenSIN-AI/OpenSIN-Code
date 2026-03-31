#!/usr/bin/env python3
"""Reference-vs-candidate similarity with NVIDIA OpenAI-compatible vision fallback.

Outputs JSON:
{
  "pass": bool,
  "score": float,
  "notes": str,
  "mismatches": [str]
}
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
from pathlib import Path
import re
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from PIL import Image, ImageFilter, ImageOps

DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "meta/llama-3.2-11b-vision-instruct"


class SimilarityError(RuntimeError):
    pass


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Reference-candidate similarity via OpenAI-compatible API")
    p.add_argument("--reference-image", required=True)
    p.add_argument("--candidate-image", required=True)
    p.add_argument("--prompt", default="")
    p.add_argument("--base-url", default=os.getenv("NVIDIA_OPENAI_BASE_URL", DEFAULT_BASE_URL))
    p.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--threshold", type=float, default=0.82)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--max-tokens", type=int, default=450)
    p.add_argument("--temperature", type=float, default=0.0)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--soft-fail", action="store_true")
    return p.parse_args()


def die(msg: str) -> None:
    raise SimilarityError(msg)


def image_data_url(path: Path) -> str:
    if not path.exists():
        die(f"missing image: {path}")
    blob = path.read_bytes()
    if not blob:
        die(f"empty image: {path}")
    mime, _ = mimetypes.guess_type(path.name)
    if not mime:
        mime = "image/png"
    return f"data:{mime};base64,{base64.b64encode(blob).decode('ascii')}"


def dhash_similarity(a: Image.Image, b: Image.Image, size: int = 16) -> float:
    def _hash(img: Image.Image) -> list[int]:
        g = ImageOps.grayscale(img).resize((size + 1, size), Image.Resampling.BILINEAR)
        px = list(g.getdata())
        bits: list[int] = []
        row = size + 1
        for y in range(size):
            base = y * row
            for x in range(size):
                bits.append(1 if px[base + x] > px[base + x + 1] else 0)
        return bits

    ah = _hash(a)
    bh = _hash(b)
    dist = sum(1 for x, y in zip(ah, bh) if x != y)
    return max(0.0, 1.0 - (dist / max(1, len(ah))))


def histogram_similarity(a: Image.Image, b: Image.Image) -> float:
    ah = a.convert("RGB").histogram()
    bh = b.convert("RGB").histogram()
    num = 0.0
    den = 0.0
    for x, y in zip(ah, bh):
        num += min(x, y)
        den += max(x, y)
    if den <= 0:
        return 0.0
    return max(0.0, min(1.0, num / den))


def edge_similarity(a: Image.Image, b: Image.Image, size: int = 128) -> float:
    ea = ImageOps.grayscale(a).resize((size, size), Image.Resampling.BILINEAR).filter(ImageFilter.FIND_EDGES)
    eb = ImageOps.grayscale(b).resize((size, size), Image.Resampling.BILINEAR).filter(ImageFilter.FIND_EDGES)
    pa = list(ea.getdata())
    pb = list(eb.getdata())
    if not pa or len(pa) != len(pb):
        return 0.0
    diff = sum(abs(x - y) for x, y in zip(pa, pb)) / (255.0 * len(pa))
    return max(0.0, min(1.0, 1.0 - diff))


def local_similarity(reference: Path, candidate: Path) -> tuple[float, dict[str, float], list[str]]:
    ref = Image.open(reference).convert("RGB")
    cand = Image.open(candidate).convert("RGB")

    d = dhash_similarity(ref, cand)
    e = edge_similarity(ref, cand)
    h = histogram_similarity(ref, cand)
    score = (0.45 * d) + (0.35 * e) + (0.20 * h)

    mismatches: list[str] = []
    if d < 0.52:
        mismatches.append("very low structural overlap")
    if e < 0.45:
        mismatches.append("edge topology drift")
    if h < 0.32:
        mismatches.append("material/color mismatch")

    metrics = {
        "dhash": round(d, 4),
        "edge": round(e, 4),
        "histogram": round(h, 4),
    }
    return max(0.0, min(1.0, score)), metrics, mismatches


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: int) -> dict[str, Any]:
    req = Request(url=url, method="POST", headers=headers, data=json.dumps(payload).encode("utf-8"))
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        die(f"HTTP {exc.code}: {detail}")
    except TimeoutError as exc:
        die(f"timeout: {exc}")
    except URLError as exc:
        die(f"network error: {exc}")

    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        die(f"invalid json: {exc}")
    if not isinstance(data, dict):
        die("response is not object")
    return data


def extract_text(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: list[str] = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") in {"text", "output_text"} and isinstance(item.get("text"), str):
                    chunks.append(item["text"])
                elif isinstance(item.get("content"), str):
                    chunks.append(item["content"])
        return "\n".join(chunks).strip()
    return ""


def extract_json_obj(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```$", "", cleaned)
        cleaned = cleaned.strip()
    s = cleaned.find("{")
    e = cleaned.rfind("}")
    if s < 0 or e <= s:
        die("model output has no json object")
    try:
        obj = json.loads(cleaned[s : e + 1])
    except json.JSONDecodeError as exc:
        die(f"model json invalid: {exc}")
    if not isinstance(obj, dict):
        die("model json is not object")
    return obj


def model_similarity(
    reference_image: Path,
    candidate_image: Path,
    prompt: str,
    base_url: str,
    api_key: str,
    model: str,
    temperature: float,
    max_tokens: int,
    timeout: int,
) -> tuple[float, str, list[str]]:
    instruction = (
        "Compare the REFERENCE image to the CANDIDATE image for 3D character fidelity. "
        "Score strict visual similarity in [0,1], where 1 means near-identical silhouette and key details. "
        "Return strict JSON only: {\"score\":0.0,\"notes\":\"...\",\"mismatches\":[\"...\"]}."
    )
    if prompt.strip():
        instruction += f"\nTarget intent: {prompt.strip()}"

    payload: dict[str, Any] = {
        "model": model,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
        "messages": [
            {
                "role": "system",
                "content": "You are a strict visual QA grader for 3D character fidelity.",
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": instruction},
                    {"type": "text", "text": "REFERENCE:"},
                    {"type": "image_url", "image_url": {"url": image_data_url(reference_image)}},
                    {"type": "text", "text": "CANDIDATE:"},
                    {"type": "image_url", "image_url": {"url": image_data_url(candidate_image)}},
                ],
            },
        ],
    }

    resp = post_json(
        url=base_url.rstrip("/") + "/chat/completions",
        payload=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        timeout=timeout,
    )

    choices = resp.get("choices")
    if not isinstance(choices, list) or not choices:
        die("no choices in model output")
    msg = choices[0].get("message", {})
    text = extract_text(msg.get("content"))
    if not text:
        die("empty model output")
    obj = extract_json_obj(text)

    score = float(obj.get("score", 0.0))
    score = max(0.0, min(1.0, score))
    notes = str(obj.get("notes", "")).strip()
    mismatches_raw = obj.get("mismatches", [])
    mismatches = [str(x).strip() for x in mismatches_raw if str(x).strip()] if isinstance(mismatches_raw, list) else []
    return score, notes, mismatches[:10]


def fallback(score: float, notes: str, mismatches: list[str], threshold: float) -> dict[str, Any]:
    return {
        "pass": score >= threshold,
        "score": round(score, 4),
        "notes": notes,
        "mismatches": mismatches,
    }


def main() -> int:
    args = parse_args()

    reference = Path(args.reference_image).expanduser().resolve()
    candidate = Path(args.candidate_image).expanduser().resolve()

    try:
        local_score, local_metrics, local_mismatches = local_similarity(reference, candidate)
    except Exception as exc:
        if args.soft_fail:
            print(json.dumps(fallback(0.0, f"local scorer failed: {exc}", ["local_scorer_error"], args.threshold)))
            return 0
        print(f"Error: local scorer failed: {exc}", file=os.sys.stderr)
        return 1

    if args.dry_run:
        notes = f"dry-run local={local_score:.3f} dhash={local_metrics['dhash']} edge={local_metrics['edge']} hist={local_metrics['histogram']}"
        print(json.dumps(fallback(local_score, notes, local_mismatches, args.threshold)))
        return 0

    api_key = os.getenv(args.api_key_env, "").strip()
    if not api_key:
        notes = (
            f"model compare unavailable; local={local_score:.3f}, dhash={local_metrics['dhash']}, "
            f"edge={local_metrics['edge']}, hist={local_metrics['histogram']}"
        )
        print(json.dumps(fallback(local_score, notes, ["model compare unavailable", *local_mismatches], args.threshold)))
        return 0

    try:
        model_score, model_notes, model_mismatches = model_similarity(
            reference_image=reference,
            candidate_image=candidate,
            prompt=args.prompt,
            base_url=args.base_url,
            api_key=api_key,
            model=args.model,
            temperature=args.temperature,
            max_tokens=args.max_tokens,
            timeout=args.timeout,
        )
        final_score = (0.60 * model_score) + (0.40 * local_score)
        notes = (
            f"model={model_score:.3f}, local={local_score:.3f}, dhash={local_metrics['dhash']}, "
            f"edge={local_metrics['edge']}, hist={local_metrics['histogram']}"
        )
        if model_notes:
            notes += f"; {model_notes}"
        mismatches = []
        seen = set()
        for item in [*model_mismatches, *local_mismatches]:
            if item not in seen:
                seen.add(item)
                mismatches.append(item)
        print(json.dumps(fallback(final_score, notes, mismatches, args.threshold)))
        return 0
    except SimilarityError as exc:
        if args.soft_fail:
            notes = (
                f"model compare unavailable; local={local_score:.3f}, dhash={local_metrics['dhash']}, "
                f"edge={local_metrics['edge']}, hist={local_metrics['histogram']}; {exc}"
            )
            print(json.dumps(fallback(local_score, notes, ["model compare unavailable", *local_mismatches], args.threshold)))
            return 0
        print(f"Error: {exc}", file=os.sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
