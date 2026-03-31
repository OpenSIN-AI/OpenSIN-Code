#!/usr/bin/env python3
"""Hosted NVIDIA NIM TRELLIS pipeline for reproducible 3D asset generation.

This script targets hosted NIM endpoints and implements:
- reference-aware prompt derivation (vision model helper)
- deterministic candidate sweeps (seed/parameter plans)
- probe rendering + similarity ranking
- artifact packaging (manifest + local web preview)
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
from pathlib import Path
import random
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_NIM_ENDPOINT = "https://ai.api.nvidia.com/v1/genai/microsoft/trellis"
DEFAULT_OPENAI_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_VISION_MODEL = "meta/llama-3.2-11b-vision-instruct"

PRESET_CANDIDATES = {
    "fast": [
        {"slat_cfg_scale": 2.8, "ss_cfg_scale": 6.9, "slat_sampling_steps": 16, "ss_sampling_steps": 16},
        {"slat_cfg_scale": 3.1, "ss_cfg_scale": 7.3, "slat_sampling_steps": 20, "ss_sampling_steps": 20},
    ],
    "balanced": [
        {"slat_cfg_scale": 3.0, "ss_cfg_scale": 7.2, "slat_sampling_steps": 24, "ss_sampling_steps": 24},
        {"slat_cfg_scale": 3.4, "ss_cfg_scale": 7.8, "slat_sampling_steps": 28, "ss_sampling_steps": 28},
        {"slat_cfg_scale": 2.8, "ss_cfg_scale": 7.0, "slat_sampling_steps": 26, "ss_sampling_steps": 30},
        {"slat_cfg_scale": 3.7, "ss_cfg_scale": 8.2, "slat_sampling_steps": 30, "ss_sampling_steps": 30},
    ],
    "cinema": [
        {"slat_cfg_scale": 3.2, "ss_cfg_scale": 7.4, "slat_sampling_steps": 30, "ss_sampling_steps": 30},
        {"slat_cfg_scale": 3.8, "ss_cfg_scale": 8.1, "slat_sampling_steps": 34, "ss_sampling_steps": 34},
        {"slat_cfg_scale": 4.2, "ss_cfg_scale": 8.6, "slat_sampling_steps": 38, "ss_sampling_steps": 38},
        {"slat_cfg_scale": 3.6, "ss_cfg_scale": 7.9, "slat_sampling_steps": 32, "ss_sampling_steps": 36},
        {"slat_cfg_scale": 2.9, "ss_cfg_scale": 7.1, "slat_sampling_steps": 30, "ss_sampling_steps": 34},
        {"slat_cfg_scale": 4.0, "ss_cfg_scale": 8.9, "slat_sampling_steps": 40, "ss_sampling_steps": 40},
    ],
}

PRESET_DEFAULT_BEST_OF = {
    "fast": 2,
    "balanced": 4,
    "cinema": 6,
}


class ForgeError(RuntimeError):
    pass


def parse_args() -> argparse.Namespace:
    skill_root = Path(__file__).resolve().parents[1]
    p = argparse.ArgumentParser(description="NVIDIA hosted TRELLIS 3D forge")
    p.add_argument("--prompt", default="", help="Primary 3D prompt")
    p.add_argument("--reference-image", help="Reference image path used for prompt steering and ranking")
    p.add_argument("--out-dir", default="output/nvidia-3d-forge", help="Output root directory")
    p.add_argument("--run-dir", default="", help="Optional explicit run directory")
    p.add_argument("--quality-preset", choices=["fast", "balanced", "cinema"], default="cinema")
    p.add_argument("--best-of", type=int, default=0, help="Number of candidate generations per round")
    p.add_argument("--max-rounds", type=int, default=2, help="Retry rounds with tightened prompt hints")
    p.add_argument("--seed-base", type=int, default=0, help="Seed base; 0 starts at random seed")
    p.add_argument("--similarity-threshold", type=float, default=0.72)

    p.add_argument("--nim-endpoint", default=DEFAULT_NIM_ENDPOINT)
    p.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    p.add_argument("--request-timeout", type=int, default=240)
    p.add_argument("--output-format", choices=["glb", "stl"], default="glb")
    p.add_argument("--no-texture", action="store_true")

    p.add_argument("--input-mode", choices=["auto", "text", "image"], default="auto")
    p.add_argument("--force-image-mode", action="store_true", help="For auto mode, try raw image payload")
    p.add_argument("--image-example-id", type=int, default=-1, help="Hosted preview token id [0..3]")
    p.add_argument("--raw-image-payload", default="", help="Direct image payload value for mode=image")

    p.add_argument("--reference-prompt-script", default=str(skill_root / "scripts" / "reference_prompt_openai_compat.py"))
    p.add_argument("--reference-prompt-model", default=DEFAULT_VISION_MODEL)
    p.add_argument("--reference-prompt-base-url", default=DEFAULT_OPENAI_BASE_URL)
    p.add_argument("--reference-prompt-timeout", type=int, default=45)

    p.add_argument("--similarity-script", default=str(skill_root / "scripts" / "similarity_rank.py"))
    p.add_argument("--usdrecord-bin", default="usdrecord")

    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--verbose", action="store_true")
    return p.parse_args()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def make_run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")


def log(msg: str, verbose: bool) -> None:
    if verbose:
        print(f"[nvidia-3d-forge] {msg}", file=sys.stderr)


def ensure_file(path: str | None, label: str) -> Path | None:
    if not path:
        return None
    p = Path(path).expanduser().resolve()
    if not p.exists() or not p.is_file():
        raise ForgeError(f"{label} not found: {p}")
    return p


def compact_prompt(text: str, max_chars: int = 77) -> str:
    cleaned = " ".join(text.strip().split())
    if not cleaned:
        return cleaned
    if len(cleaned) <= max_chars:
        return cleaned
    reduced = cleaned.replace(" and ", " & ").replace(" with ", " w/ ").replace(", ", ",")
    if len(reduced) <= max_chars:
        return reduced
    return reduced[:max_chars].rstrip(" ,.;:-")


def merge_prompts(user_prompt: str, derived_prompt: str) -> str:
    up = " ".join(user_prompt.split()).strip()
    dp = " ".join(derived_prompt.split()).strip()
    if up and dp:
        if up.lower() in dp.lower():
            return compact_prompt(dp)
        combo = " ".join(f"{up}, {dp}".split())
        if len(combo) <= 77:
            return combo
        if len(dp) >= 24:
            return compact_prompt(dp)
        return compact_prompt(up)
    if up:
        return compact_prompt(up)
    return compact_prompt(dp)


def run_cmd(argv: list[str], timeout: int = 300, dry_run: bool = False) -> dict[str, Any]:
    if dry_run:
        return {
            "command": " ".join(argv),
            "returncode": 0,
            "stdout": "",
            "stderr": "",
            "dry_run": True,
        }
    try:
        proc = subprocess.run(
            argv,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
        return {
            "command": " ".join(argv),
            "returncode": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "dry_run": False,
        }
    except subprocess.TimeoutExpired as exc:
        return {
            "command": " ".join(argv),
            "returncode": 124,
            "stdout": exc.stdout or "",
            "stderr": (exc.stderr or "") + "\nTimeoutExpired",
            "dry_run": False,
        }


def post_json(url: str, payload: dict[str, Any], api_key: str, timeout: int) -> dict[str, Any]:
    req = Request(
        url=url,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        data=json.dumps(payload).encode("utf-8"),
    )
    try:
        with urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise ForgeError(f"NIM HTTP {exc.code}: {detail}")
    except TimeoutError as exc:
        raise ForgeError(f"NIM timeout: {exc}")
    except URLError as exc:
        raise ForgeError(f"NIM network error: {exc}")

    try:
        data = json.loads(body)
    except json.JSONDecodeError as exc:
        raise ForgeError(f"NIM returned invalid JSON: {exc}")
    if not isinstance(data, dict):
        raise ForgeError("NIM response is not a JSON object")
    return data


def sanitize_trellis_prompt(prompt: str) -> str:
    cleaned = " ".join(prompt.strip().split())
    cleaned = cleaned.replace(";", ",").replace("|", ",")
    cleaned = cleaned.replace("...", "").replace("..", ".")
    cleaned = cleaned.replace("&", "and")
    cleaned = cleaned.replace(" w/ ", " with ")
    while ",," in cleaned:
        cleaned = cleaned.replace(",,", ",")
    return compact_prompt(cleaned, max_chars=77)


def invoke_nim_with_retry(
    endpoint: str,
    payload: dict[str, Any],
    api_key: str,
    timeout: int,
    max_attempts: int = 3,
) -> tuple[dict[str, Any], dict[str, Any]]:
    attempt_log: dict[str, Any] = {"attempts": []}
    work = dict(payload)

    for attempt in range(1, max_attempts + 1):
        if attempt > 1 and work.get("mode") == "text":
            work["prompt"] = sanitize_trellis_prompt(str(work.get("prompt", "")))
            work["slat_cfg_scale"] = min(float(work.get("slat_cfg_scale", 3.0)), 3.4)
            work["ss_cfg_scale"] = min(float(work.get("ss_cfg_scale", 7.5)), 7.8)
            work["slat_sampling_steps"] = max(16, min(int(work.get("slat_sampling_steps", 24)), 28))
            work["ss_sampling_steps"] = max(16, min(int(work.get("ss_sampling_steps", 24)), 28))
            work["seed"] = int((int(work.get("seed", 1)) + (attempt * 1049)) % (2**32 - 1))

        try:
            response = post_json(endpoint, work, api_key=api_key, timeout=timeout)
            attempt_log["attempts"].append(
                {
                    "attempt": attempt,
                    "status": "ok",
                    "payload_summary": {
                        "mode": work.get("mode"),
                        "seed": work.get("seed"),
                        "prompt": (str(work.get("prompt", ""))[:77] if work.get("mode") == "text" else None),
                        "slat_cfg_scale": work.get("slat_cfg_scale"),
                        "ss_cfg_scale": work.get("ss_cfg_scale"),
                        "slat_sampling_steps": work.get("slat_sampling_steps"),
                        "ss_sampling_steps": work.get("ss_sampling_steps"),
                    },
                }
            )
            return response, attempt_log
        except ForgeError as exc:
            msg = str(exc)
            retriable = (
                "HTTP 500" in msg
                or "HTTP 502" in msg
                or "HTTP 503" in msg
                or "HTTP 504" in msg
                or "timeout" in msg.lower()
                or "network error" in msg.lower()
            )
            attempt_log["attempts"].append(
                {
                    "attempt": attempt,
                    "status": "failed",
                    "retriable": retriable,
                    "error": msg,
                    "payload_summary": {
                        "mode": work.get("mode"),
                        "seed": work.get("seed"),
                        "prompt": (str(work.get("prompt", ""))[:77] if work.get("mode") == "text" else None),
                        "slat_cfg_scale": work.get("slat_cfg_scale"),
                        "ss_cfg_scale": work.get("ss_cfg_scale"),
                        "slat_sampling_steps": work.get("slat_sampling_steps"),
                        "ss_sampling_steps": work.get("ss_sampling_steps"),
                    },
                }
            )
            if not retriable or attempt == max_attempts:
                raise ForgeError(msg)
            time.sleep(min(2.0 * attempt, 5.0))

    raise ForgeError("NIM retry loop exhausted")


def detect_ext(blob: bytes, fallback_ext: str = ".glb") -> str:
    if blob[:4] == b"glTF":
        return ".glb"
    if blob[:5].lower() == b"solid":
        return ".stl"
    return fallback_ext


def decode_artifact_to_file(base64_data: str, out_path: Path) -> int:
    blob = base64.b64decode(base64_data.encode("utf-8"), validate=False)
    out_path.write_bytes(blob)
    return len(blob)


def image_to_data_url(path: Path) -> str:
    blob = path.read_bytes()
    if not blob:
        raise ForgeError(f"reference image is empty: {path}")
    mime, _ = mimetypes.guess_type(path.name)
    if not mime:
        mime = "image/png"
    return f"data:{mime};base64,{base64.b64encode(blob).decode('ascii')}"


def derive_prompt_from_reference(
    script_path: Path,
    image_path: Path,
    user_prompt: str,
    base_url: str,
    api_key_env: str,
    model: str,
    timeout: int,
    dry_run: bool,
) -> tuple[str, dict[str, Any]]:
    if not script_path.exists():
        return "", {"status": "skipped", "reason": f"script missing: {script_path}"}
    cmd = [
        "python3",
        str(script_path),
        "--image",
        str(image_path),
        "--prompt",
        user_prompt,
        "--base-url",
        base_url,
        "--api-key-env",
        api_key_env,
        "--model",
        model,
        "--timeout",
        str(timeout),
        "--max-prompt-chars",
        "77",
        "--soft-fail",
    ]
    result = run_cmd(cmd, timeout=240, dry_run=dry_run)
    if result["returncode"] != 0:
        return "", {"status": "failed", "command": result}
    try:
        data = json.loads(result["stdout"].strip() or "{}")
    except json.JSONDecodeError:
        return "", {"status": "failed", "command": result, "reason": "invalid json output"}

    prompt = str(data.get("trellis_prompt") or data.get("prompt") or "").strip()
    out = {
        "status": "completed",
        "command": result,
        "derived_prompt": prompt,
        "notes": str(data.get("notes", "")).strip(),
        "traits": data.get("traits", []),
    }
    return compact_prompt(prompt), out


def mesh_metrics(asset_path: Path) -> tuple[float, dict[str, Any]]:
    try:
        import trimesh  # type: ignore
    except Exception:
        return 0.55, {"status": "skipped", "reason": "trimesh unavailable"}

    try:
        scene = trimesh.load(str(asset_path), force="scene")
    except Exception as exc:
        return 0.45, {"status": "failed", "reason": str(exc)}

    geoms = []
    if hasattr(scene, "geometry"):
        geoms = [g for g in scene.geometry.values() if hasattr(g, "faces")]
    elif hasattr(scene, "faces"):
        geoms = [scene]

    face_count = int(sum(len(g.faces) for g in geoms))
    vertex_count = int(sum(len(g.vertices) for g in geoms))
    primitive_count = len(geoms)

    bounds = None
    extents = [0.0, 0.0, 0.0]
    try:
        bounds = scene.bounds
        extents = [float(x) for x in (bounds[1] - bounds[0])]
    except Exception:
        bounds = None

    mx = max(extents) if extents else 0.0
    mn = min(extents) if extents else 0.0
    flatness = (mn / mx) if mx > 1e-9 else 0.0

    face_score = max(0.0, min(1.0, (face_count - 2000.0) / 70000.0))
    flat_score = max(0.0, min(1.0, (flatness - 0.25) / 0.70))
    primitive_score = 1.0 if primitive_count >= 1 else 0.0
    score = (0.55 * face_score) + (0.30 * flat_score) + (0.15 * primitive_score)

    return score, {
        "status": "completed",
        "face_count": face_count,
        "vertex_count": vertex_count,
        "primitive_count": primitive_count,
        "bbox_extents": extents,
        "flatness_ratio": flatness,
    }


def probe_fill_metrics(image_path: Path) -> dict[str, Any]:
    try:
        from PIL import Image, ImageOps
    except Exception:
        return {"status": "skipped", "reason": "Pillow unavailable"}

    try:
        img = Image.open(image_path).convert("RGB")
    except Exception as exc:
        return {"status": "failed", "reason": str(exc)}

    g = ImageOps.grayscale(img)
    px = list(g.getdata())
    if not px:
        return {"status": "failed", "reason": "empty image"}

    width, height = g.size
    active = [i for i, v in enumerate(px) if v > 12]
    if not active:
        return {
            "status": "completed",
            "active_pixels": 0,
            "fill_ratio": 0.0,
            "bbox_ratio_w": 0.0,
            "bbox_ratio_h": 0.0,
            "bbox_ratio_area": 0.0,
        }

    xs = [i % width for i in active]
    ys = [i // width for i in active]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)

    bw = max_x - min_x + 1
    bh = max_y - min_y + 1
    area_ratio = (bw * bh) / float(width * height)
    fill_ratio = len(active) / float(width * height)

    return {
        "status": "completed",
        "active_pixels": len(active),
        "fill_ratio": fill_ratio,
        "bbox_ratio_w": bw / float(width),
        "bbox_ratio_h": bh / float(height),
        "bbox_ratio_area": area_ratio,
    }


def render_probe(mesh_path: Path, probe_path: Path, usdrecord_bin: str, dry_run: bool) -> dict[str, Any]:
    usdrecord = shutil.which(usdrecord_bin) or ("/usr/bin/usdrecord" if Path("/usr/bin/usdrecord").exists() else "")
    if not usdrecord:
        return {"status": "skipped", "reason": "usdrecord unavailable"}

    cmd = [usdrecord, str(mesh_path), str(probe_path), "--imageWidth", "640", "--complexity", "medium"]
    result = run_cmd(cmd, timeout=180, dry_run=dry_run)
    if result["returncode"] != 0:
        return {"status": "failed", "command": result}
    return {"status": "completed", "command": result, "probe_image": str(probe_path)}


def run_similarity(
    similarity_script: Path,
    reference_image: Path,
    candidate_image: Path,
    threshold: float,
    dry_run: bool,
) -> dict[str, Any]:
    if not similarity_script.exists():
        return {"status": "skipped", "reason": f"script missing: {similarity_script}"}

    cmd = [
        "python3",
        str(similarity_script),
        "--reference-image",
        str(reference_image),
        "--candidate-image",
        str(candidate_image),
        "--threshold",
        str(threshold),
    ]
    result = run_cmd(cmd, timeout=180, dry_run=dry_run)
    if result["returncode"] != 0:
        return {"status": "failed", "command": result}

    try:
        data = json.loads(result["stdout"].strip() or "{}")
    except json.JSONDecodeError:
        return {"status": "failed", "command": result, "reason": "invalid json output"}

    return {
        "status": "completed",
        "passed": bool(data.get("pass", False)),
        "score": float(data.get("score", 0.0)),
        "notes": str(data.get("notes", "")),
        "raw": data,
        "command": result,
    }


def make_candidate_plan(quality_preset: str, best_of: int, seed_base: int) -> list[dict[str, Any]]:
    template = PRESET_CANDIDATES[quality_preset]
    if best_of <= 0:
        best_of = PRESET_DEFAULT_BEST_OF[quality_preset]

    if seed_base <= 0:
        seed_base = random.randint(1, 2**31 - 1)

    out: list[dict[str, Any]] = []
    for i in range(best_of):
        t = template[i % len(template)]
        out.append(
            {
                "seed": int((seed_base + (i * 7919)) % (2**32 - 1)),
                "slat_cfg_scale": t["slat_cfg_scale"],
                "ss_cfg_scale": t["ss_cfg_scale"],
                "slat_sampling_steps": t["slat_sampling_steps"],
                "ss_sampling_steps": t["ss_sampling_steps"],
            }
        )
    return out


def round_prompt(base_prompt: str, round_index: int) -> str:
    if round_index <= 0:
        return compact_prompt(base_prompt)
    hint = "round mascot,dark visor,cyan eyes,thin limbs,tri legs,engraved grooves,blue-purple"
    if not base_prompt:
        return compact_prompt(hint)
    return compact_prompt(f"{base_prompt},{hint}")


def write_preview_html(run_dir: Path, asset_file: Path) -> None:
    rel_asset = asset_file.name
    html = f"""<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>NVIDIA 3D Forge Preview</title>
  <script type=\"module\" src=\"https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js\"></script>
  <style>
    html, body {{ margin: 0; width: 100%; height: 100%; background: radial-gradient(circle at 20% 10%, #1b1f2a, #080a10 60%); color: #e8edf6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }}
    .layout {{ display: grid; grid-template-rows: auto 1fr; width: 100%; height: 100%; }}
    .bar {{ padding: 10px 14px; font-size: 13px; letter-spacing: .01em; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.08); }}
    model-viewer {{ width: 100%; height: 100%; --progress-bar-color: #4db6ff; --poster-color: transparent; }}
  </style>
</head>
<body>
  <div class=\"layout\">
    <div class=\"bar\">Drag to rotate - Scroll to zoom - Shift+Drag to pan</div>
    <model-viewer src=\"{rel_asset}\" camera-controls touch-action=\"pan-y\" shadow-intensity=\"1.2\" exposure=\"1.2\" environment-image=\"neutral\" camera-orbit=\"35deg 75deg auto\"></model-viewer>
  </div>
</body>
</html>
"""
    (run_dir / "preview_3d.html").write_text(html, encoding="utf-8")


def write_open_scripts(run_dir: Path) -> None:
    script_a = """#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8765}"
URL="http://127.0.0.1:${PORT}/preview_3d.html"
echo "[nvidia-3d-forge] Serving preview on ${URL}"

if command -v open >/dev/null 2>&1; then
  (sleep 1; open "${URL}" >/dev/null 2>&1 || true) &
elif command -v xdg-open >/dev/null 2>&1; then
  (sleep 1; xdg-open "${URL}" >/dev/null 2>&1 || true) &
fi

python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory "${DIR}"
"""

    script_b = """#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8765}"
URL="http://127.0.0.1:${PORT}/preview_3d.html"
PROFILE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/nvidia-forge-chrome-profile.XXXXXX")"
echo "[nvidia-3d-forge] Serving preview on ${URL}"
echo "[nvidia-3d-forge] Chrome profile: ${PROFILE_DIR}"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

python3 -m http.server "${PORT}" --bind 127.0.0.1 --directory "${DIR}" >/dev/null 2>&1 &
SERVER_PID="${!}"
sleep 1

if [[ "$(uname -s)" == "Darwin" ]]; then
  open -na "Google Chrome" --args \
    --user-data-dir="${PROFILE_DIR}" \
    --no-first-run \
    --no-default-browser-check \
    --ignore-gpu-blocklist \
    --use-angle=metal \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    "${URL}" || true
elif command -v google-chrome >/dev/null 2>&1; then
  google-chrome \
    --user-data-dir="${PROFILE_DIR}" \
    --no-first-run \
    --no-default-browser-check \
    --ignore-gpu-blocklist \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    "${URL}" >/dev/null 2>&1 || true
elif command -v chromium >/dev/null 2>&1; then
  chromium \
    --user-data-dir="${PROFILE_DIR}" \
    --no-first-run \
    --no-default-browser-check \
    --ignore-gpu-blocklist \
    --enable-gpu-rasterization \
    --enable-zero-copy \
    "${URL}" >/dev/null 2>&1 || true
else
  echo "[nvidia-3d-forge] Chrome not found. Open manually: ${URL}"
fi

echo "[nvidia-3d-forge] Press Ctrl+C to stop local preview server."
wait "${SERVER_PID}"
"""

    a = run_dir / "open_preview_3d.sh"
    b = run_dir / "open_preview_3d_chrome_clean.sh"
    a.write_text(script_a, encoding="utf-8")
    b.write_text(script_b, encoding="utf-8")
    a.chmod(0o755)
    b.chmod(0o755)


def choose_mode(
    args: argparse.Namespace,
    reference_image: Path | None,
) -> tuple[str, str | None, dict[str, Any] | None]:
    """Return (mode, image_payload, adjustment_stage)."""
    stage = None
    image_payload: str | None = None

    mode = args.input_mode
    if mode == "auto":
        if args.image_example_id >= 0:
            mode = "image"
            image_payload = f"data:image/png;example_id,{args.image_example_id}"
        elif args.raw_image_payload:
            mode = "image"
            image_payload = args.raw_image_payload
        elif reference_image is not None and args.force_image_mode:
            mode = "image"
            image_payload = image_to_data_url(reference_image)
        else:
            mode = "text"
            if reference_image is not None:
                stage = {
                    "status": "applied",
                    "reason": "Hosted TRELLIS preview image mode accepts example_id tokens; user image was mapped to text mode.",
                }

    elif mode == "image":
        if args.raw_image_payload:
            image_payload = args.raw_image_payload
        elif args.image_example_id >= 0:
            image_payload = f"data:image/png;example_id,{args.image_example_id}"
        elif reference_image is not None:
            image_payload = image_to_data_url(reference_image)

    return mode, image_payload, stage


def main() -> int:
    args = parse_args()

    api_key = os.getenv(args.api_key_env, "").strip()
    if not api_key and not args.dry_run:
        print(f"Error: missing API key env {args.api_key_env}", file=sys.stderr)
        return 1

    reference_image = ensure_file(args.reference_image, "reference image")
    if not args.prompt.strip() and reference_image is None:
        print("Error: provide --prompt and/or --reference-image", file=sys.stderr)
        return 1

    run_id = make_run_id()
    if args.run_dir:
        run_dir = Path(args.run_dir).expanduser().resolve()
    else:
        run_dir = Path(args.out_dir).expanduser().resolve() / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, Any] = {
        "skill": "nvidia-3d-forge",
        "started_at": utc_now_iso(),
        "run_id": run_dir.name,
        "prompt": args.prompt,
        "quality_preset": args.quality_preset,
        "output_directory": str(run_dir),
        "asset_output": None,
        "dry_run": args.dry_run,
        "stages": {},
    }

    if reference_image is not None:
        manifest["stages"]["reference_image"] = {
            "mode": "user-provided",
            "path": str(reference_image),
            "paths": [str(reference_image)],
        }

    derived_prompt = ""
    ref_prompt_script = Path(args.reference_prompt_script).expanduser().resolve()
    if reference_image is not None:
        derived_prompt, derived_stage = derive_prompt_from_reference(
            script_path=ref_prompt_script,
            image_path=reference_image,
            user_prompt=args.prompt.strip() or "3D mascot matching reference image",
            base_url=args.reference_prompt_base_url,
            api_key_env=args.api_key_env,
            model=args.reference_prompt_model,
            timeout=args.reference_prompt_timeout,
            dry_run=args.dry_run,
        )
        manifest["stages"]["hosted_reference_prompt"] = derived_stage
    else:
        manifest["stages"]["hosted_reference_prompt"] = {
            "status": "skipped",
            "reason": "No reference image provided",
        }

    final_prompt = sanitize_trellis_prompt(merge_prompts(args.prompt, derived_prompt))
    if not final_prompt:
        final_prompt = compact_prompt("stylized 3D mascot character")
    manifest["prompt_final"] = final_prompt

    mode, image_payload, mode_adjustment = choose_mode(args, reference_image)
    if mode_adjustment:
        manifest["stages"]["trellis_mode_adjustment"] = mode_adjustment

    best_of = args.best_of if args.best_of > 0 else PRESET_DEFAULT_BEST_OF[args.quality_preset]
    rounds = max(1, args.max_rounds)
    if reference_image is None:
        rounds = 1

    reconstruction_stage: dict[str, Any] = {
        "mode": "nim",
        "endpoint": args.nim_endpoint,
        "endpoint_kind": "trellis",
        "content_type": "application/json",
        "response_kind": "artifact",
        "payload_mode": f"trellis-{mode}",
        "candidate_results": [],
        "best_of": {
            "requested": best_of,
            "completed": 0,
            "failed": 0,
        },
        "rounds": [],
    }

    best_candidate: dict[str, Any] | None = None
    best_score = -1.0

    similarity_script = Path(args.similarity_script).expanduser().resolve()

    for round_idx in range(rounds):
        rp = round_prompt(final_prompt, round_idx)
        round_seed_base = args.seed_base + (round_idx * 104729)
        plan = make_candidate_plan(args.quality_preset, best_of, round_seed_base)
        round_result: dict[str, Any] = {
            "round": round_idx + 1,
            "prompt": rp,
            "candidates": [],
        }

        for i, cfg in enumerate(plan, start=1):
            cand_tag = f"cand{i:02d}.r{round_idx + 1}"
            payload: dict[str, Any] = {
                "mode": mode,
                "seed": int(cfg["seed"]),
                "samples": 1,
                "output_format": args.output_format,
                "no_texture": bool(args.no_texture),
                "slat_cfg_scale": float(cfg["slat_cfg_scale"]),
                "ss_cfg_scale": float(cfg["ss_cfg_scale"]),
                "slat_sampling_steps": int(cfg["slat_sampling_steps"]),
                "ss_sampling_steps": int(cfg["ss_sampling_steps"]),
            }
            if mode == "image":
                if not image_payload:
                    round_result["candidates"].append(
                        {
                            "index": i,
                            "seed": cfg["seed"],
                            "status": "failed",
                            "error": "mode=image but no image payload",
                        }
                    )
                    reconstruction_stage["best_of"]["failed"] += 1
                    continue
                payload["image"] = image_payload
            else:
                payload["prompt"] = rp

            candidate_rec: dict[str, Any] = {
                "index": i,
                "seed": cfg["seed"],
                "payload_summary": {k: v for k, v in payload.items() if k in {"mode", "prompt", "seed", "slat_cfg_scale", "ss_cfg_scale", "slat_sampling_steps", "ss_sampling_steps"}},
            }

            if args.dry_run:
                candidate_rec["status"] = "dry-run"
                round_result["candidates"].append(candidate_rec)
                continue

            try:
                response, retry_info = invoke_nim_with_retry(
                    endpoint=args.nim_endpoint,
                    payload=payload,
                    api_key=api_key,
                    timeout=args.request_timeout,
                    max_attempts=3,
                )
            except ForgeError as exc:
                candidate_rec["status"] = "failed"
                candidate_rec["error"] = str(exc)
                candidate_rec["retry"] = {
                    "attempts": [
                        {
                            "attempt": 1,
                            "status": "failed",
                            "error": str(exc),
                        }
                    ]
                }
                round_result["candidates"].append(candidate_rec)
                reconstruction_stage["best_of"]["failed"] += 1
                continue

            artifacts = response.get("artifacts", [])
            if not isinstance(artifacts, list) or not artifacts:
                candidate_rec["status"] = "failed"
                candidate_rec["error"] = "missing artifacts in response"
                candidate_rec["response_excerpt"] = {"top_level_keys": list(response.keys())}
                round_result["candidates"].append(candidate_rec)
                reconstruction_stage["best_of"]["failed"] += 1
                continue

            artifact = artifacts[0]
            base64_data = str(artifact.get("base64", ""))
            if not base64_data:
                candidate_rec["status"] = "failed"
                candidate_rec["error"] = "artifact.base64 missing"
                round_result["candidates"].append(candidate_rec)
                reconstruction_stage["best_of"]["failed"] += 1
                continue

            raw_tmp = run_dir / f"asset.{cand_tag}.raw.bin"
            size = decode_artifact_to_file(base64_data, raw_tmp)
            blob = raw_tmp.read_bytes()
            ext = detect_ext(blob, fallback_ext=f".{args.output_format}")
            raw_path = run_dir / f"asset.{cand_tag}.raw{ext}"
            raw_tmp.replace(raw_path)

            final_path = run_dir / f"asset.{cand_tag}{ext}"
            shutil.copy2(raw_path, final_path)

            geom_score, geom_metrics = mesh_metrics(final_path)
            probe = {"status": "skipped", "reason": "non-glb output"}
            probe_metrics: dict[str, Any] = {"status": "skipped", "reason": "no probe image"}
            if ext == ".glb":
                probe_path = run_dir / f"candidate_{i:02d}_round{round_idx + 1}_probe.png"
                probe = render_probe(final_path, probe_path, args.usdrecord_bin, args.dry_run)
                if probe.get("status") == "completed" and probe.get("probe_image"):
                    probe_metrics = probe_fill_metrics(Path(probe["probe_image"]))

            sim_stage = {"status": "skipped", "reason": "no reference or probe"}
            vision_score = None
            if (
                reference_image is not None
                and probe.get("status") == "completed"
                and probe.get("probe_image")
            ):
                sim_stage = run_similarity(
                    similarity_script=similarity_script,
                    reference_image=reference_image,
                    candidate_image=Path(probe["probe_image"]),
                    threshold=args.similarity_threshold,
                    dry_run=args.dry_run,
                )
                if sim_stage.get("status") == "completed":
                    vision_score = float(sim_stage.get("score", 0.0))

            if vision_score is None:
                total_score = geom_score
                vision_weight = 0.0
            else:
                total_score = (0.70 * vision_score) + (0.30 * geom_score)
                vision_weight = 0.70

            failures: list[str] = []
            if vision_score is not None and vision_score < args.similarity_threshold:
                failures.append(f"vision_similarity<{args.similarity_threshold}")
            if geom_score < 0.20:
                failures.append("geometry_score<0.20")

            quality = {
                "candidate_index": i,
                "seed": int(cfg["seed"]),
                "mesh_path": str(raw_path),
                "asset_path": str(final_path),
                "score": round(total_score, 6),
                "geometry_score": round(geom_score, 6),
                "vision_weight": vision_weight,
                "vision_score": (round(vision_score, 6) if vision_score is not None else None),
                "passed": len(failures) == 0,
                "failures": failures,
                "glb_metrics": geom_metrics,
                "probe_render": probe,
                "probe_metrics": probe_metrics,
                "candidate_vision": sim_stage,
            }

            candidate_rec.update(
                {
                    "status": "completed",
                    "detected_extension": ext,
                    "decoded_size_bytes": size,
                    "response_excerpt": {"top_level_keys": list(response.keys())},
                    "retry": retry_info,
                    "raw_output": str(raw_path),
                    "asset_out": str(final_path),
                    "quality": quality,
                }
            )
            round_result["candidates"].append(candidate_rec)
            reconstruction_stage["best_of"]["completed"] += 1

            if total_score > best_score:
                best_score = total_score
                best_candidate = candidate_rec

        reconstruction_stage["rounds"].append(round_result)

        round_best = None
        round_best_score = -1.0
        for c in round_result["candidates"]:
            q = c.get("quality")
            if not isinstance(q, dict):
                continue
            s = float(q.get("score", -1.0))
            if s > round_best_score:
                round_best_score = s
                round_best = c

        if round_best is not None and isinstance(round_best.get("quality"), dict):
            q = round_best["quality"]
            if q.get("vision_score") is not None and float(q["vision_score"]) >= args.similarity_threshold:
                break

    if best_candidate is None:
        manifest["stages"]["reconstruction"] = reconstruction_stage
        manifest["finished_at"] = utc_now_iso()
        if args.dry_run:
            manifest["status"] = "dry-run"
            manifest_path = run_dir / "manifest.json"
            manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
            print(json.dumps({"status": "dry-run", "run_dir": str(run_dir), "manifest": str(manifest_path)}))
            return 0

        manifest["status"] = "failed"
        (run_dir / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
        print(json.dumps({"status": "failed", "reason": "no successful candidate", "run_dir": str(run_dir)}))
        return 1

    best_asset = Path(best_candidate["asset_out"]).resolve()
    ext = best_asset.suffix.lower() or f".{args.output_format}"
    final_asset = run_dir / f"asset{ext}"
    shutil.copy2(best_asset, final_asset)

    reconstruction_stage["selected_candidate"] = {
        "index": best_candidate.get("index"),
        "seed": best_candidate.get("seed"),
        "asset_out": str(best_asset),
        "quality": best_candidate.get("quality", {}),
    }
    reconstruction_stage["asset_out"] = str(final_asset)
    reconstruction_stage["detected_extension"] = ext

    preview_png = run_dir / "preview.png"
    probe_info = best_candidate.get("quality", {}).get("probe_render", {})
    if isinstance(probe_info, dict) and probe_info.get("probe_image"):
        src = Path(str(probe_info["probe_image"]))
        if src.exists():
            shutil.copy2(src, preview_png)
    elif reference_image is not None:
        shutil.copy2(reference_image, preview_png)

    if ext == ".glb":
        write_preview_html(run_dir, final_asset)
        write_open_scripts(run_dir)

    manifest["asset_output"] = str(final_asset)
    manifest["prompt_final"] = final_prompt
    manifest["finished_at"] = utc_now_iso()
    manifest["status"] = "completed"
    manifest["stages"]["reconstruction"] = reconstruction_stage

    manifest_path = run_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    result = {
        "status": "completed",
        "run_dir": str(run_dir),
        "asset": str(final_asset),
        "manifest": str(manifest_path),
        "score": round(best_score, 6),
        "prompt_final": final_prompt,
    }
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
