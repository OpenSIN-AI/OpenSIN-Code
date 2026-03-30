#!/usr/bin/env python3
"""Derive a compact TRELLIS text prompt from a reference image.

Outputs JSON with keys prompt/trellis_prompt.
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


DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_MODEL = "meta/llama-3.2-11b-vision-instruct"


class PromptError(RuntimeError):
    pass


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Reference-image to compact TRELLIS prompt")
    p.add_argument("--image", required=True)
    p.add_argument("--prompt", default="")
    p.add_argument("--base-url", default=os.getenv("NVIDIA_OPENAI_BASE_URL", DEFAULT_BASE_URL))
    p.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--max-prompt-chars", type=int, default=77)
    p.add_argument("--temperature", type=float, default=0.0)
    p.add_argument("--max-tokens", type=int, default=450)
    p.add_argument("--timeout", type=int, default=120)
    p.add_argument("--no-response-format-json", action="store_true")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--soft-fail", action="store_true")
    return p.parse_args()


def die(msg: str) -> None:
    raise PromptError(msg)


def image_data_url(path: Path) -> str:
    if not path.exists():
        die(f"image not found: {path}")
    blob = path.read_bytes()
    if not blob:
        die(f"image empty: {path}")
    mime, _ = mimetypes.guess_type(path.name)
    if not mime:
        mime = "image/png"
    return f"data:{mime};base64,{base64.b64encode(blob).decode('ascii')}"


def post_json(url: str, payload: dict[str, Any], headers: dict[str, str], timeout: int) -> Any:
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
        return json.loads(body)
    except json.JSONDecodeError as exc:
        die(f"invalid json: {exc}")


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
    if s == -1 or e == -1 or e <= s:
        die("model output has no json object")
    try:
        obj = json.loads(cleaned[s : e + 1])
    except json.JSONDecodeError as exc:
        die(f"model json invalid: {exc}")
    if not isinstance(obj, dict):
        die("model json is not object")
    return obj


def normalize_prompt(text: str, max_chars: int) -> str:
    t = " ".join(str(text).strip().split())
    if len(t) <= max_chars:
        return t
    t = t.replace(" with ", " w/ ").replace(" and ", " & ").replace(", ", ",")
    if len(t) <= max_chars:
        return t
    clipped = t[: max_chars - 3].rstrip(" ,.;:-")
    return f"{clipped}..."


def fallback(user_prompt: str, max_chars: int, reason: str) -> dict[str, Any]:
    base = user_prompt.strip() or "blue purple spherical mascot with dark visor face and groove pattern"
    short = normalize_prompt(base, max_chars)
    return {
        "prompt": short,
        "trellis_prompt": short,
        "notes": reason,
        "traits": [],
    }


def main() -> int:
    args = parse_args()
    max_chars = int(args.max_prompt_chars)
    if max_chars < 24 or max_chars > 256:
        die("--max-prompt-chars must be in [24,256]")

    try:
        if args.dry_run:
            print(json.dumps(fallback(args.prompt, max_chars, "dry-run")))
            return 0

        api_key = os.getenv(args.api_key_env, "").strip()
        if not api_key:
            die(f"missing api key env: {args.api_key_env}")

        image_url = image_data_url(Path(args.image).expanduser().resolve())
        instruction = (
            "Analyze this mascot reference image and produce a TRELLIS prompt. "
            "Return strict JSON only with keys: "
            "{\"trellis_prompt\":\"...\",\"notes\":\"...\",\"traits\":[\"...\"]}. "
            f"trellis_prompt must be <= {max_chars} chars, English, and emphasize silhouette, face panel, "
            "eyes/mouth, limb topology, groove pattern, and material style."
        )
        if args.prompt.strip():
            instruction += f"\nUser intent: {args.prompt.strip()}"

        payload: dict[str, Any] = {
            "model": args.model,
            "temperature": args.temperature,
            "max_tokens": args.max_tokens,
            "messages": [
                {
                    "role": "system",
                    "content": "You output concise professional JSON prompts for 3D generation.",
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": instruction},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                },
            ],
        }
        if not args.no_response_format_json:
            payload["response_format"] = {"type": "json_object"}

        endpoint = args.base_url.rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        resp = post_json(endpoint, payload, headers, args.timeout)
        choices = resp.get("choices")
        if not isinstance(choices, list) or not choices:
            die("no choices in model response")

        msg = choices[0].get("message", {})
        text = extract_text(msg.get("content"))
        if not text:
            die("empty model output")
        obj = extract_json_obj(text)

        derived = obj.get("trellis_prompt") or obj.get("prompt")
        if not isinstance(derived, str) or not derived.strip():
            die("missing trellis_prompt")
        final = normalize_prompt(derived.strip(), max_chars)
        traits_raw = obj.get("traits", [])
        traits: list[str] = []
        if isinstance(traits_raw, list):
            traits = [str(x).strip() for x in traits_raw if str(x).strip()][:12]

        out = {
            "prompt": final,
            "trellis_prompt": final,
            "notes": str(obj.get("notes", "")).strip(),
            "traits": traits,
        }
        print(json.dumps(out))
        return 0
    except PromptError as exc:
        if args.soft_fail:
            print(json.dumps(fallback(args.prompt, max_chars, str(exc))))
            return 0
        print(f"Error: {exc}", file=os.sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
