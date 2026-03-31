#!/usr/bin/env python3
"""Hosted-only NVIDIA NIM video pipeline orchestrator.

Subcommands:
- generate: run multi-candidate generation + QA gate + selection
- qa: run QA gate directly for an existing video
- voice: synthesize narration audio with NVIDIA Riva TTS
"""

from __future__ import annotations

import argparse
import base64
from collections import Counter
import html
import io
import json
import mimetypes
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
from typing import Any
import wave
import zipfile
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    from asr_pipeline import build_asr_plan, write_asr_outputs
    from brand_profile import derive_brand_profile, write_brand_profile
    from overlay_engine import apply_overlays, build_overlay_plan, write_overlay_plan
    from source_adapters import build_asset_graph, write_asset_outputs
    from video_judge_chat_bridge import (
        create_chat_bridge_package,
        load_bridge_response,
        normalize_bridge_response,
    )
except ImportError:  # pragma: no cover - package-style fallback
    from .asr_pipeline import build_asr_plan, write_asr_outputs
    from .brand_profile import derive_brand_profile, write_brand_profile
    from .overlay_engine import apply_overlays, build_overlay_plan, write_overlay_plan
    from .source_adapters import build_asset_graph, write_asset_outputs
    from .video_judge_chat_bridge import (
        create_chat_bridge_package,
        load_bridge_response,
        normalize_bridge_response,
    )

DEFAULT_JUDGE_MODEL = "meta/llama-3.2-11b-vision-instruct"
DEFAULT_JUDGE_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_JUDGE_MODE = "chat_bridge"
DEFAULT_JUDGE_MODEL_ALIAS = "gpt-5.3-codex"
RUN_STATE_RUNNING = "running"
RUN_STATE_AWAITING_JUDGE = "awaiting_judge"
RUN_STATE_COMPLETED = "completed"
RUN_STATE_FAILED = "failed"

MODEL_ENDPOINTS_BASE = {
    "predict1": "https://ai.api.nvidia.com/v1/cosmos/nvidia/cosmos-predict1-5b",
    "transfer1": "https://ai.api.nvidia.com/v1/cosmos/nvidia/cosmos-transfer1-7b",
    "transfer2_5": "https://ai.api.nvidia.com/v1/cosmos/nvidia/cosmos-transfer2_5-2b",
}

MODEL_ENDPOINTS_ENV = {
    "predict1": {
        "single": "NVIDIA_COSMOS_PREDICT1_ENDPOINT",
        "multi": "NVIDIA_COSMOS_PREDICT1_ENDPOINTS",
    },
    "transfer1": {
        "single": "NVIDIA_COSMOS_TRANSFER1_ENDPOINT",
        "multi": "NVIDIA_COSMOS_TRANSFER1_ENDPOINTS",
    },
    "transfer2_5": {
        "single": "NVIDIA_COSMOS_TRANSFER2_5_ENDPOINT",
        "multi": "NVIDIA_COSMOS_TRANSFER2_5_ENDPOINTS",
    },
}

NVCF_EXEC_ENDPOINT_DEFAULTS = {
    # Account-validated fallback for reference-conditioned predict1 runs.
    "predict1": [
        "https://api.nvcf.nvidia.com/v2/nvcf/exec/functions/eef816a3-3940-413b-93c9-513ae29f34f9/versions/5a0709e5-691e-4de6-89af-4c32f95812df"
    ],
    "transfer1": [],
    "transfer2_5": [],
}

NVCF_EXEC_ENDPOINT_ENV = {
    "predict1": {
        "single": "NVIDIA_COSMOS_PREDICT1_NVCF_EXEC_ENDPOINT",
        "multi": "NVIDIA_COSMOS_PREDICT1_NVCF_EXEC_ENDPOINTS",
    },
    "transfer1": {
        "single": "NVIDIA_COSMOS_TRANSFER1_NVCF_EXEC_ENDPOINT",
        "multi": "NVIDIA_COSMOS_TRANSFER1_NVCF_EXEC_ENDPOINTS",
    },
    "transfer2_5": {
        "single": "NVIDIA_COSMOS_TRANSFER2_5_NVCF_EXEC_ENDPOINT",
        "multi": "NVIDIA_COSMOS_TRANSFER2_5_NVCF_EXEC_ENDPOINTS",
    },
}

NVCF_ASSET_CREATE_URL = "https://api.nvcf.nvidia.com/v2/nvcf/assets"
NVCF_PENDING_STATUSES = {
    "accepted",
    "queued",
    "pending",
    "running",
    "processing",
    "in_progress",
}
NVCF_TERMINAL_ERROR_STATUSES = {
    "error",
    "failed",
    "errored",
    "rejected",
    "cancelled",
    "canceled",
    "timeout",
}

QUALITY_CONFIG = {
    "max": {
        "steps": 50,
        "guidance_scale": 8.0,
        "video_params": {
            "frames_per_sec": 24,
            "frames_count": 121,
            "height": 704,
            "width": 1280,
        },
    },
    "balanced": {
        "steps": 36,
        "guidance_scale": 7.0,
        "video_params": {
            "frames_per_sec": 24,
            "frames_count": 97,
            "height": 704,
            "width": 1280,
        },
    },
    "fast": {
        "steps": 24,
        "guidance_scale": 6.0,
        "video_params": {
            "frames_per_sec": 24,
            "frames_count": 73,
            "height": 704,
            "width": 1280,
        },
    },
}

DEFAULT_CANDIDATES = {
    "max": 3,
    "balanced": 2,
    "fast": 1,
}

URL_KEYS = (
    "video_url",
    "asset_url",
    "download_url",
    "output_url",
    "result_url",
    "responseReference",
    "response_reference",
    "url",
)

B64_KEYS = (
    "b64_video",
    "video_base64",
    "base64",
    "b64_json",
    "output_base64",
    "result_base64",
)

VOICE_MODEL_DEFAULTS = {
    "magpie_multilingual": "877104f7-e885-42b9-8de8-f6e4c6303969",
    "magpie_zeroshot": "55cf67bf-600f-4b04-8eac-12ed39537a08",
    "fastpitch_hifigan": "bc45d9e9-7c78-4d56-9737-e27011962ba8",
}

VOICE_MODEL_ENV = {
    "magpie_multilingual": "NVIDIA_RIVA_TTS_MAGPIE_MULTILINGUAL_FUNCTION_ID",
    "magpie_zeroshot": "NVIDIA_RIVA_TTS_MAGPIE_ZEROSHOT_FUNCTION_ID",
    "fastpitch_hifigan": "NVIDIA_RIVA_TTS_FASTPITCH_HIFIGAN_FUNCTION_ID",
}

VOICE_MODEL_DEFAULT_NAME = {
    "magpie_multilingual": "Magpie-Multilingual.EN-US.Female-1",
    "magpie_zeroshot": "",
    "fastpitch_hifigan": "",
}

RIVA_SERVER_DEFAULT = "grpc.nvcf.nvidia.com:443"
RIVA_CLIENT_GIT_URL = "https://github.com/nvidia-riva/python-clients.git"
RIVA_RUNTIME_MARKER = ".riva_runtime_ready"


class PipelineError(RuntimeError):
    """Raised for pipeline-level failures."""


class HTTPRequestError(RuntimeError):
    """Raised when an HTTP request fails."""

    def __init__(self, status: int, body: str):
        super().__init__(f"HTTP {status}: {body}")
        self.status = status
        self.body = body


class NVCFPendingError(PipelineError):
    """Raised when NVCF request is accepted but result is not ready yet."""


def _ts() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _run_id() -> str:
    millis = int((time.time() % 1) * 1000)
    return time.strftime("%Y%m%d-%H%M%S", time.localtime()) + f"-{millis:03d}"


def _log(message: str) -> None:
    print(f"[{_ts()}] {message}", file=sys.stderr)


def _die(message: str) -> None:
    raise PipelineError(message)


def _safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _bounded_nvcf_poll_seconds(value: int) -> int:
    return max(30, min(int(value), 600))


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _validate_hosted_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        _die(f"Hosted NVIDIA endpoint must use https: {url}")
    host = parsed.netloc.lower()
    allowed_suffixes = ("api.nvidia.com", "api.nvcf.nvidia.com")
    is_allowed = any(host == suffix or host.endswith(f".{suffix}") for suffix in allowed_suffixes)
    if not host or not is_allowed:
        _die(f"Endpoint must target NVIDIA hosted API domains: {url}")


def _validate_https_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https":
        _die(f"URL must use https: {url}")
    if not parsed.netloc:
        _die(f"URL must include a host: {url}")


def _normalize_path(raw: str) -> Path:
    return Path(raw).expanduser().resolve()


def _safe_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    return text in {"1", "true", "yes", "y", "on"}


def _list_arg(values: Any) -> list[str]:
    if not values:
        return []
    if isinstance(values, list):
        return [str(item).strip() for item in values if str(item).strip()]
    return [str(values).strip()] if str(values).strip() else []


def _normalize_path_list(values: list[str]) -> list[Path]:
    paths: list[Path] = []
    for value in values:
        path = _normalize_path(value)
        if path.exists():
            paths.append(path)
    return paths


def _normalize_overlay_entries(values: list[str]) -> list[Path]:
    resolved: list[Path] = []
    for value in values:
        if value.startswith("http://") or value.startswith("https://"):
            continue
        path = _normalize_path(value)
        if path.exists():
            resolved.append(path)
    return resolved


def _coalesce_str(*values: Any) -> str:
    for value in values:
        text = str(value or "").strip()
        if text:
            return text
    return ""


def _optional_path(value: Any) -> Path | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() == "none":
        return None
    return _normalize_path(text)


def _merge_source_inputs(args: argparse.Namespace) -> dict[str, Any]:
    base_images = _list_arg(getattr(args, "input_image", ""))
    base_videos = _list_arg(getattr(args, "input_video", ""))
    input_images = _normalize_path_list(base_images + _list_arg(getattr(args, "input_images", [])))
    input_videos = _normalize_path_list(base_videos + _list_arg(getattr(args, "input_videos", [])))
    input_audios = _normalize_path_list(_list_arg(getattr(args, "input_audio", [])))
    input_product_images = _normalize_path_list(_list_arg(getattr(args, "input_product_image", [])))
    input_person_images = _normalize_path_list(_list_arg(getattr(args, "input_person_image", [])))
    overlay_files = _normalize_overlay_entries(_list_arg(getattr(args, "overlay_file", [])))
    overlay_templates = _list_arg(getattr(args, "overlay_template", []))

    input_urls = _list_arg(getattr(args, "input_url", []))
    input_blog_urls = _list_arg(getattr(args, "input_blog_url", []))
    input_youtube_urls = _list_arg(getattr(args, "input_youtube_url", []))
    style_url = _coalesce_str(getattr(args, "style_url", ""))
    brand_url = _coalesce_str(getattr(args, "brand_url", ""))
    brand_logo = _coalesce_str(getattr(args, "brand_logo", ""))

    primary_image = input_images[0] if input_images else (input_product_images[0] if input_product_images else None)
    primary_video = input_videos[0] if input_videos else None
    if primary_video and primary_image:
        # Keep legacy contract: one direct reference for generation payload.
        primary_image = None

    return {
        "input_images": input_images,
        "input_videos": input_videos,
        "input_audios": input_audios,
        "input_product_images": input_product_images,
        "input_person_images": input_person_images,
        "overlay_files": overlay_files,
        "overlay_templates": overlay_templates,
        "input_urls": input_urls,
        "input_blog_urls": input_blog_urls,
        "input_youtube_urls": input_youtube_urls,
        "style_url": style_url,
        "brand_url": brand_url,
        "brand_logo": brand_logo,
        "primary_image": primary_image,
        "primary_video": primary_video,
    }


def _build_prompt_planner_context(
    *,
    asset_graph: dict[str, Any],
    brand_profile: dict[str, Any],
    asr_plan: dict[str, Any] | None,
    remix_mode: str,
    target_duration_seconds: int,
) -> str:
    parts: list[str] = []
    inputs = asset_graph.get("inputs", {}) if isinstance(asset_graph, dict) else {}
    pages = asset_graph.get("web_pages", []) if isinstance(asset_graph.get("web_pages"), list) else []
    youtube = asset_graph.get("youtube_items", []) if isinstance(asset_graph.get("youtube_items"), list) else []

    parts.append("Execution constraints:")
    parts.append(f"- remix_mode: {remix_mode}")
    if target_duration_seconds > 0:
        parts.append(f"- target_duration_seconds: {target_duration_seconds}")
    parts.append(
        "- source_counts: "
        f"images={len(inputs.get('images', []))}, "
        f"videos={len(inputs.get('videos', []))}, "
        f"audios={len(inputs.get('audios', []))}, "
        f"product_images={len(inputs.get('product_images', []))}, "
        f"person_images={len(inputs.get('person_images', []))}, "
        f"urls={len(inputs.get('urls', []))}, "
        f"blog_urls={len(inputs.get('blog_urls', []))}, "
        f"youtube_urls={len(inputs.get('youtube_urls', []))}"
    )
    if pages:
        pages_preview = [str(item.get("title", "")).strip() for item in pages[:4] if str(item.get("title", "")).strip()]
        if pages_preview:
            parts.append("- web_context_titles: " + " | ".join(pages_preview))
    if youtube:
        yt_preview = [str(item.get("title", "")).strip() for item in youtube[:3] if str(item.get("title", "")).strip()]
        if yt_preview:
            parts.append("- youtube_context_titles: " + " | ".join(yt_preview))
    palette = brand_profile.get("palette_hex", []) if isinstance(brand_profile, dict) else []
    fonts = brand_profile.get("font_candidates", []) if isinstance(brand_profile, dict) else []
    logos = brand_profile.get("logo_candidates", []) if isinstance(brand_profile, dict) else []
    tone = brand_profile.get("tone_keywords", []) if isinstance(brand_profile, dict) else []
    if palette:
        parts.append("- branding_palette: " + ", ".join(str(item) for item in palette[:6]))
    if fonts:
        parts.append("- branding_fonts: " + ", ".join(str(item) for item in fonts[:4]))
    if logos:
        parts.append("- branding_logo_candidates: " + ", ".join(str(item) for item in logos[:2]))
    if tone:
        parts.append("- brand_tone_keywords: " + ", ".join(str(item) for item in tone[:6]))
    if asr_plan and _safe_int(asr_plan.get("audio_input_count"), 0) > 0:
        parts.append("- audio_story_mode: branded_news_reel")
        parts.append(f"- audio_target_duration_seconds: {_safe_int(asr_plan.get('target_duration_seconds'), 0)}")
        segments = asr_plan.get("segments", [])
        if isinstance(segments, list) and segments:
            segment_preview = [str(item.get("text", "")).strip() for item in segments[:3] if str(item.get("text", "")).strip()]
            if segment_preview:
                parts.append("- audio_key_segments: " + " | ".join(segment_preview))

    return "\n".join(parts).strip()


def _collect_correction_notes(*notes: str) -> str:
    items = [str(note).strip() for note in notes if str(note).strip()]
    if not items:
        return ""
    return " | ".join(items[:4])


def _run_deadline_seconds(*, started_epoch: float, max_minutes: int) -> float:
    return float(started_epoch) + float(max(1, max_minutes)) * 60.0


def _is_budget_exhausted(*, attempt: int, max_iterations: int, now_epoch: float, deadline_epoch: float) -> bool:
    if attempt > max_iterations:
        return True
    if now_epoch >= deadline_epoch:
        return True
    return False


def _serialize_path_list(paths: list[Path]) -> list[str]:
    return [str(path.resolve()) for path in paths]


def _bridge_candidate_to_qa(
    *,
    candidate_eval: dict[str, Any],
    threshold: float,
    judge_notes: list[str],
) -> dict[str, Any]:
    technical_ok = _safe_bool(candidate_eval.get("technical_ok"))
    semantic_score = round(max(0.0, min(1.0, _safe_float(candidate_eval.get("semantic_score")))), 4)
    temporal_score = round(max(0.0, min(1.0, _safe_float(candidate_eval.get("temporal_score")))), 4)
    branding_score = round(max(0.0, min(1.0, _safe_float(candidate_eval.get("branding_score")))), 4)
    instruction_score = round(max(0.0, min(1.0, _safe_float(candidate_eval.get("instruction_score")))), 4)
    artifact_flags = [
        str(item).strip()
        for item in candidate_eval.get("artifact_flags", [])
        if str(item).strip()
    ] if isinstance(candidate_eval.get("artifact_flags"), list) else []
    reasons = [
        str(item).strip()
        for item in candidate_eval.get("reasons", [])
        if str(item).strip()
    ] if isinstance(candidate_eval.get("reasons"), list) else []
    pass_fail = _safe_bool(candidate_eval.get("pass_fail"))
    if not pass_fail:
        pass_fail = bool(technical_ok and semantic_score >= threshold and temporal_score >= threshold)
    return {
        "technical_checks": {
            "decode_ok": technical_ok,
            "duration_ok": technical_ok,
            "fps_ok": technical_ok,
            "short_edge_ok": technical_ok,
        },
        "semantic_score": semantic_score,
        "temporal_score": temporal_score,
        "branding_score": branding_score,
        "instruction_score": instruction_score,
        "artifact_flags": artifact_flags,
        "pass_fail": pass_fail,
        "reasons": reasons + judge_notes[:2],
        "fix_instructions": [
            str(item).strip()
            for item in candidate_eval.get("fix_instructions", [])
            if str(item).strip()
        ] if isinstance(candidate_eval.get("fix_instructions"), list) else [],
        "hard_fail": _safe_bool(candidate_eval.get("hard_fail")),
        "aggregate_score": round(max(0.0, min(1.0, _safe_float(candidate_eval.get("aggregate_score")))), 4),
    }


def _to_float_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _load_json_object(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        _die(f"Expected JSON object in: {path}")
    return payload


def _youtube_source_evidence_from_asset_graph(asset_graph: dict[str, Any]) -> list[dict[str, Any]]:
    youtube_items = asset_graph.get("youtube_items")
    if not isinstance(youtube_items, list):
        return []
    evidence: list[dict[str, Any]] = []
    for idx, item in enumerate(youtube_items, start=1):
        if not isinstance(item, dict):
            continue
        source_media = item.get("source_media")
        if not isinstance(source_media, dict):
            continue
        frame_paths = source_media.get("frame_paths")
        if not isinstance(frame_paths, list):
            frame_paths = []
        cleaned_frames = [str(frame).strip() for frame in frame_paths if str(frame).strip()]
        entry = {
            "label": f"youtube_source_{idx:02d}",
            "source_type": "youtube",
            "url": str(item.get("url", "")),
            "title": str(item.get("title", "")),
            "video_path": str(source_media.get("video_path", "")),
            "frame_paths": cleaned_frames,
            "transcript_excerpt": str(
                item.get("google_api", {}).get("description_excerpt")
                if isinstance(item.get("google_api"), dict)
                else ""
            )[:300],
        }
        if entry["url"] or entry["video_path"] or entry["frame_paths"] or entry["title"]:
            evidence.append(entry)
    return evidence

def _run_cmd_checked(
    cmd: list[str],
    *,
    cwd: Path | None = None,
    env: dict[str, str] | None = None,
    timeout_sec: int | None = None,
) -> str:
    try:
        proc = subprocess.run(
            cmd,
            text=True,
            capture_output=True,
            cwd=str(cwd) if cwd else None,
            env=env,
            timeout=timeout_sec,
        )
    except subprocess.TimeoutExpired as exc:
        rendered = " ".join(cmd)
        _die(
            f"Command timed out after {timeout_sec}s: {rendered}. "
            f"Partial output: {(exc.stdout or '').strip() or (exc.stderr or '').strip() or '<empty>'}"
        )
    if proc.returncode != 0:
        rendered = " ".join(cmd)
        stderr = (proc.stderr or "").strip()
        stdout = (proc.stdout or "").strip()
        details = stderr or stdout or "<empty>"
        _die(f"Command failed ({proc.returncode}): {rendered}\n{details}")
    return proc.stdout


def _extract_uuid(value: str) -> str:
    match = re.search(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        value or "",
    )
    return match.group(0).lower() if match else ""


def _resolve_voice_function_id(model: str, explicit: str) -> str:
    explicit_value = (explicit or "").strip()
    if explicit_value:
        parsed = _extract_uuid(explicit_value)
        if not parsed:
            _die(
                "--voice-function-id must be a UUID or a URL containing a UUID. "
                f"Received: {explicit_value}"
            )
        return parsed

    env_name = VOICE_MODEL_ENV[model]
    configured = os.getenv(env_name, VOICE_MODEL_DEFAULTS[model]).strip()
    parsed = _extract_uuid(configured)
    if not parsed:
        _die(
            f"Could not resolve function id for voice model '{model}'. "
            f"Set {env_name} or pass --voice-function-id."
        )
    return parsed


def _resolve_voice_name(model: str, voice_name: str) -> str:
    if voice_name.strip():
        return voice_name.strip()
    return VOICE_MODEL_DEFAULT_NAME.get(model, "").strip()


def _ensure_riva_runtime(cache_dir: Path, skip_bootstrap: bool) -> tuple[Path, Path]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    repo_dir = cache_dir / "python-clients"
    venv_dir = cache_dir / "venv"
    python_bin = venv_dir / "bin" / "python"
    pip_bin = venv_dir / "bin" / "pip"
    marker = cache_dir / RIVA_RUNTIME_MARKER

    if python_bin.exists() and marker.exists():
        return python_bin, repo_dir

    if skip_bootstrap:
        _die(
            "Riva runtime is not prepared. Remove --skip-voice-bootstrap or run bootstrap once. "
            f"Expected runtime root: {cache_dir}"
        )

    if not shutil.which("git"):
        _die("git is required for Riva runtime bootstrap")

    if not repo_dir.exists():
        _log("Bootstrapping Riva runtime: cloning python-clients repo")
        _run_cmd_checked(
            [
                "git",
                "clone",
                "--recurse-submodules",
                "--depth",
                "1",
                RIVA_CLIENT_GIT_URL,
                str(repo_dir),
            ]
        )
    else:
        _run_cmd_checked(
            ["git", "-C", str(repo_dir), "submodule", "update", "--init", "--recursive"]
        )

    if not python_bin.exists():
        _log("Bootstrapping Riva runtime: creating virtual environment")
        _run_cmd_checked([sys.executable, "-m", "venv", str(venv_dir)])

    _log("Bootstrapping Riva runtime: installing python dependencies")
    _run_cmd_checked(
        [str(pip_bin), "install", "--upgrade", "pip", "setuptools", "wheel"],
        timeout_sec=900,
    )
    _run_cmd_checked(
        [str(pip_bin), "install", "-r", str(repo_dir / "requirements.txt")],
        timeout_sec=900,
    )
    _run_cmd_checked([str(pip_bin), "install", "-e", str(repo_dir)], timeout_sec=900)

    marker.write_text(_ts() + "\n", encoding="utf-8")
    return python_bin, repo_dir


def _riva_tts_bridge_source() -> str:
    return """#!/usr/bin/env python3
import argparse
import json
import os
import sys
import wave

import riva.client
from riva.client.proto.riva_audio_pb2 import AudioEncoding


def main() -> int:
    parser = argparse.ArgumentParser(description='NVIDIA Riva TTS bridge')
    parser.add_argument('--server', required=True)
    parser.add_argument('--function-id', required=True)
    parser.add_argument('--text', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--language-code', default='en-US')
    parser.add_argument('--voice-name', default='')
    parser.add_argument('--sample-rate', type=int, default=44100)
    args = parser.parse_args()

    api_key = os.getenv('NVIDIA_API_KEY', '').strip()
    if not api_key:
        print('Missing NVIDIA_API_KEY in bridge environment', file=sys.stderr)
        return 2

    options = [
        ('grpc.max_receive_message_length', 64 * 1024 * 1024),
        ('grpc.max_send_message_length', 64 * 1024 * 1024),
    ]
    auth = riva.client.Auth(
        ssl_root_cert=None,
        ssl_client_cert=None,
        ssl_client_key=None,
        use_ssl=True,
        uri=args.server,
        metadata_args=[
            ('function-id', args.function_id),
            ('authorization', f'Bearer {api_key}'),
        ],
        options=options,
    )
    service = riva.client.SpeechSynthesisService(auth)
    resp = service.synthesize(
        args.text,
        args.voice_name if args.voice_name else None,
        args.language_code,
        sample_rate_hz=args.sample_rate,
        encoding=AudioEncoding.LINEAR_PCM,
    )

    with wave.open(args.output, 'wb') as wav_out:
        wav_out.setnchannels(1)
        wav_out.setsampwidth(2)
        wav_out.setframerate(args.sample_rate)
        wav_out.writeframes(resp.audio)

    print(json.dumps({'output': args.output, 'bytes': len(resp.audio)}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
"""


def _ensure_riva_tts_bridge(cache_dir: Path) -> Path:
    bridge_path = cache_dir / "riva_tts_bridge.py"
    source = _riva_tts_bridge_source()
    if not bridge_path.exists() or bridge_path.read_text(encoding="utf-8") != source:
        bridge_path.write_text(source, encoding="utf-8")
        bridge_path.chmod(0o755)
    return bridge_path


def _write_silence_wav(path: Path, duration_sec: float, sample_rate: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    total_samples = max(1, int(max(0.01, duration_sec) * sample_rate))
    silence = b"\x00\x00" * total_samples
    with wave.open(str(path), "wb") as wav_out:
        wav_out.setnchannels(1)
        wav_out.setsampwidth(2)
        wav_out.setframerate(sample_rate)
        wav_out.writeframes(silence)


def _synthesize_voice_audio_riva(
    *,
    out_path: Path,
    text: str,
    model: str,
    explicit_function_id: str,
    voice_name: str,
    language_code: str,
    sample_rate: int,
    server: str,
    cache_dir: Path,
    skip_bootstrap: bool,
    api_key: str,
    dry_run: bool,
) -> tuple[Path, dict[str, Any]]:
    function_id = _resolve_voice_function_id(model, explicit_function_id)
    resolved_voice = _resolve_voice_name(model, voice_name)

    if dry_run:
        _write_silence_wav(out_path, duration_sec=2.0, sample_rate=sample_rate)
        return out_path, {
            "mode": "dry-run",
            "model": model,
            "function_id": function_id,
            "server": server,
            "voice_name": resolved_voice,
            "language_code": language_code,
            "sample_rate": sample_rate,
        }

    python_bin, _ = _ensure_riva_runtime(cache_dir, skip_bootstrap=skip_bootstrap)
    bridge = _ensure_riva_tts_bridge(cache_dir)

    env = os.environ.copy()
    env["NVIDIA_API_KEY"] = api_key

    cmd = [
        str(python_bin),
        str(bridge),
        "--server",
        server,
        "--function-id",
        function_id,
        "--text",
        text,
        "--output",
        str(out_path),
        "--language-code",
        language_code,
        "--sample-rate",
        str(sample_rate),
    ]
    if resolved_voice:
        cmd.extend(["--voice-name", resolved_voice])

    _log(f"Voice synthesis: model={model}, function_id={function_id}")
    _run_cmd_checked(cmd, env=env)

    if not out_path.exists() or out_path.stat().st_size <= 0:
        _die("Voice synthesis did not produce a valid audio file")

    return out_path, {
        "mode": "nvidia_riva_tts",
        "model": model,
        "function_id": function_id,
        "server": server,
        "voice_name": resolved_voice,
        "language_code": language_code,
        "sample_rate": sample_rate,
    }


def _probe_media_duration_seconds(path: Path) -> float:
    if not path.exists():
        _die(f"Media file not found for duration probe: {path}")
    output = _run_cmd_checked(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ]
    )
    return max(0.0, _safe_float(output.strip()))


def _mux_voice_audio(
    *,
    video_path: Path,
    audio_path: Path,
    output_path: Path,
    gain_db: float,
) -> Path:
    if not video_path.exists():
        _die(f"Video file missing before mux: {video_path}")
    if not audio_path.exists():
        _die(f"Audio file missing before mux: {audio_path}")

    duration = _probe_media_duration_seconds(video_path)
    pad_dur = max(0.1, duration + 0.1)
    filter_graph = f"[1:a]aresample=48000,volume={gain_db}dB,apad=pad_dur={pad_dur:.3f}[aout]"

    _run_cmd_checked(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(video_path),
            "-i",
            str(audio_path),
            "-filter_complex",
            filter_graph,
            "-map",
            "0:v:0",
            "-map",
            "[aout]",
            "-c:v",
            "copy",
            "-c:a",
            "aac",
            "-b:a",
            "192k",
            "-shortest",
            str(output_path),
        ]
    )
    if not output_path.exists() or output_path.stat().st_size <= 0:
        _die("Mux step failed to produce output video")
    return output_path


def _model_endpoints() -> dict[str, str]:
    def _get_single(profile: str) -> str:
        env_name = MODEL_ENDPOINTS_ENV[profile]["single"]
        return os.getenv(env_name, MODEL_ENDPOINTS_BASE[profile]).strip()

    return {
        "predict1": _get_single("predict1"),
        "transfer1": _get_single("transfer1"),
        "transfer2_5": _get_single("transfer2_5"),
    }


def _split_csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.split(",") if item.strip()]


def _append_unique_url(items: list[str], value: str) -> None:
    candidate = value.strip()
    if candidate and candidate not in items:
        items.append(candidate)


def _endpoint_profile_overrides(profile: str) -> list[str]:
    env_name = MODEL_ENDPOINTS_ENV[profile]["multi"]
    raw = os.getenv(env_name, "").strip()
    if not raw:
        return []
    return _split_csv(raw)


def _nvcf_exec_endpoint_overrides(profile: str) -> list[str]:
    env_config = NVCF_EXEC_ENDPOINT_ENV[profile]
    ordered: list[str] = []

    single = os.getenv(env_config["single"], "").strip()
    if single:
        ordered.append(single)

    multi_raw = os.getenv(env_config["multi"], "").strip()
    if multi_raw:
        ordered.extend(_split_csv(multi_raw))

    deduped: list[str] = []
    for endpoint in ordered:
        _append_unique_url(deduped, endpoint)
    return deduped


def _nvcf_exec_default_endpoints(profile: str, has_reference: bool) -> list[str]:
    if profile != "predict1":
        return []
    if not has_reference:
        return []
    return list(NVCF_EXEC_ENDPOINT_DEFAULTS.get(profile, []))


def _is_nvcf_function_endpoint(endpoint: str) -> bool:
    return "/v2/nvcf/" in endpoint and "/functions/" in endpoint


def _is_nvcf_exec_endpoint(endpoint: str) -> bool:
    return "/v2/nvcf/exec/functions/" in endpoint


def _endpoint_path_variants(endpoint: str) -> list[str]:
    variants: list[str] = []
    _append_unique_url(variants, endpoint)

    # NVCF function routes are already fully qualified and should not be path-mutated.
    if _is_nvcf_function_endpoint(endpoint):
        return variants

    if endpoint.endswith("/infer"):
        _append_unique_url(variants, endpoint[: -len("/infer")])
    else:
        _append_unique_url(variants, endpoint.rstrip("/") + "/infer")

    if "/v1/cosmos/" in endpoint:
        genai = endpoint.replace("/v1/cosmos/", "/v1/genai/")
        _append_unique_url(variants, genai)
        if genai.endswith("/infer"):
            _append_unique_url(variants, genai[: -len("/infer")])
        else:
            _append_unique_url(variants, genai.rstrip("/") + "/infer")
    elif "/v1/genai/" in endpoint:
        cosmos = endpoint.replace("/v1/genai/", "/v1/cosmos/")
        _append_unique_url(variants, cosmos)
        if cosmos.endswith("/infer"):
            _append_unique_url(variants, cosmos[: -len("/infer")])
        else:
            _append_unique_url(variants, cosmos.rstrip("/") + "/infer")

    return variants


def _endpoint_variants(
    *,
    model_profile: str,
    explicit_endpoint: str,
    strategy: str,
    has_reference: bool,
) -> list[str]:
    if explicit_endpoint:
        if strategy == "strict":
            return [explicit_endpoint]
        return _endpoint_path_variants(explicit_endpoint)

    endpoints = _model_endpoints()
    base = endpoints[model_profile]
    variants: list[str] = []

    for override in _endpoint_profile_overrides(model_profile):
        _append_unique_url(variants, override)
        if strategy != "strict":
            for item in _endpoint_path_variants(override):
                _append_unique_url(variants, item)

    _append_unique_url(variants, base)
    if strategy != "strict":
        for item in _endpoint_path_variants(base):
            _append_unique_url(variants, item)

    if strategy != "strict":
        for endpoint in _nvcf_exec_endpoint_overrides(model_profile):
            _append_unique_url(variants, endpoint)
        for endpoint in _nvcf_exec_default_endpoints(model_profile, has_reference):
            _append_unique_url(variants, endpoint)

    return variants


def _file_to_data_url(path: Path) -> str:
    if not path.exists():
        _die(f"Input media not found: {path}")
    blob = path.read_bytes()
    if not blob:
        _die(f"Input media is empty: {path}")
    mime, _ = mimetypes.guess_type(path.name)
    if not mime:
        mime = "application/octet-stream"
    b64 = base64.b64encode(blob).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _resolve_model_profile(requested: str, has_reference: bool) -> str:
    if requested != "auto":
        return requested
    return "transfer2_5" if has_reference else "predict1"


def _default_candidate_count(quality: str) -> int:
    return DEFAULT_CANDIDATES.get(quality, 1)


def _quality_payload(quality: str) -> dict[str, Any]:
    base = QUALITY_CONFIG.get(quality)
    if not base:
        return {}
    return json.loads(json.dumps(base))


def _build_prompt(base_prompt: str, correction_notes: str, attempt: int) -> str:
    if attempt == 1 or not correction_notes.strip():
        return base_prompt.strip()
    return (
        f"{base_prompt.strip()}\n\n"
        f"Correction pass {attempt - 1}:\n"
        f"- Keep original intent and camera continuity.\n"
        f"- Fix issues: {correction_notes.strip()}\n"
        "- Avoid visual artifacts, jitter, and scene drift."
    )


def _summarize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for key, value in payload.items():
        if key in {"image", "video"}:
            summary[key] = f"<data-url {len(str(value))} chars>"
        else:
            summary[key] = value
    return summary


def _build_payload(
    *,
    prompt: str,
    model_profile: str,
    quality: str,
    input_image: Path | None,
    input_video: Path | None,
    seed: int | None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {"prompt": prompt}

    if input_video:
        payload["mode"] = "video"
        payload["video"] = _file_to_data_url(input_video)
    elif input_image:
        payload["mode"] = "image"
        payload["image"] = _file_to_data_url(input_image)
    else:
        payload["mode"] = "text"

    payload.update(_quality_payload(quality))
    payload["model_profile"] = model_profile

    if seed is not None:
        payload["seed"] = seed

    return payload


def _guess_media_content_type(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    if mime:
        return mime
    return "application/octet-stream"


def _create_nvcf_asset(*, api_key: str, source_path: Path, timeout: int) -> dict[str, str]:
    content_type = _guess_media_content_type(source_path)
    description = f"nvidia-video-forge {source_path.name}"
    request_body = json.dumps(
        {
            "contentType": content_type,
            "description": description,
        }
    ).encode("utf-8")
    req = Request(
        url=NVCF_ASSET_CREATE_URL,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        data=request_body,
    )
    try:
        with urlopen(req, timeout=timeout) as response:
            response_body = response.read()
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        _die(f"NVCF asset creation failed (HTTP {exc.code}): {detail}")
    except URLError as exc:
        _die(f"NVCF asset creation failed (network): {exc}")

    try:
        payload = json.loads(response_body.decode("utf-8"))
    except Exception as exc:  # noqa: BLE001
        _die(f"NVCF asset creation returned invalid JSON: {exc}")

    asset_id = str(payload.get("assetId", "")).strip()
    upload_url = str(payload.get("uploadUrl", "")).strip()
    if not asset_id or not upload_url:
        _die(f"NVCF asset creation response missing assetId/uploadUrl: {payload}")

    return {
        "asset_id": asset_id,
        "upload_url": upload_url,
        "content_type": content_type,
        "description": description,
    }


def _upload_nvcf_asset(
    *,
    upload_url: str,
    content_type: str,
    description: str,
    source_path: Path,
    timeout: int,
) -> None:
    blob = source_path.read_bytes()
    if not blob:
        _die(f"NVCF asset source is empty: {source_path}")

    req = Request(
        url=upload_url,
        method="PUT",
        headers={
            "Content-Type": content_type,
            "x-amz-meta-nvcf-asset-description": description,
        },
        data=blob,
    )
    try:
        with urlopen(req, timeout=timeout):
            return
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        _die(f"NVCF asset upload failed (HTTP {exc.code}): {detail}")
    except URLError as exc:
        _die(f"NVCF asset upload failed (network): {exc}")


def _prepare_nvcf_assets_for_endpoint(
    *,
    endpoint: str,
    input_image: Path | None,
    input_video: Path | None,
    api_key: str,
    timeout: int,
    dry_run: bool,
) -> dict[str, Any]:
    if not _is_nvcf_exec_endpoint(endpoint):
        return {
            "asset_ids": [],
            "input_flag": "",
            "uploaded_assets": [],
        }

    if input_image is None and input_video is None:
        _die(
            "NVCF exec endpoint currently requires reference media for video2world. "
            "Provide --input-image or --input-video, or use a non-NVCF text route."
        )

    source_path = input_video if input_video is not None else input_image
    if source_path is None:
        _die("Internal error resolving NVCF source media")

    input_flag = "--input_video_index=0" if input_video is not None else "--input_image_index=0"
    content_type = _guess_media_content_type(source_path)

    if dry_run:
        return {
            "asset_ids": ["dry-run-asset-0"],
            "input_flag": input_flag,
            "uploaded_assets": [
                {
                    "asset_id": "dry-run-asset-0",
                    "source": str(source_path),
                    "content_type": content_type,
                }
            ],
        }

    created = _create_nvcf_asset(api_key=api_key, source_path=source_path, timeout=timeout)
    _upload_nvcf_asset(
        upload_url=created["upload_url"],
        content_type=created["content_type"],
        description=created["description"],
        source_path=source_path,
        timeout=timeout,
    )

    return {
        "asset_ids": [created["asset_id"]],
        "input_flag": input_flag,
        "uploaded_assets": [
            {
                "asset_id": created["asset_id"],
                "source": str(source_path),
                "content_type": created["content_type"],
            }
        ],
    }


def _escape_nvcf_command_prompt(prompt: str) -> str:
    compact = " ".join(prompt.strip().split())
    escaped = compact.replace("\\", "\\\\").replace('"', '\\"')
    return escaped or "video prompt"


def _request_variants_for_nvcf_exec(
    *,
    prompt: str,
    input_flag: str,
    input_asset_ids: list[str],
    poll_duration_seconds: int,
    enable_contract_fallback: bool,
) -> list[dict[str, Any]]:
    if not input_asset_ids:
        _die("NVCF exec request requires at least one input asset reference")
    if not input_flag:
        _die("NVCF exec request requires an explicit media index flag")

    escaped_prompt = _escape_nvcf_command_prompt(prompt)
    command = f'video2world --prompt="{escaped_prompt}" {input_flag}'.strip()

    header = {
        "pollDurationSeconds": int(poll_duration_seconds),
        "inputAssetReferences": list(input_asset_ids),
    }
    variants: list[dict[str, Any]] = [
        {
            "id": "nvcf:video2world_inputs",
            "payload": {
                "requestHeader": header,
                "requestBody": {
                    "inputs": [
                        {
                            "name": "command",
                            "shape": [1],
                            "datatype": "BYTES",
                            "data": [command],
                        }
                    ]
                },
            },
        }
    ]

    if enable_contract_fallback:
        variants.append(
            {
                "id": "nvcf:video2world_command",
                "payload": {
                    "requestHeader": {
                        "pollDurationSeconds": int(poll_duration_seconds),
                        "inputAssetReferences": list(input_asset_ids),
                    },
                    "requestBody": {
                        "command": command,
                    },
                },
            }
        )

    return variants


def _payload_core_variants(payload: dict[str, Any]) -> list[dict[str, Any]]:
    variants: list[dict[str, Any]] = []

    variants.append(payload)

    trimmed_mode = dict(payload)
    trimmed_mode.pop("mode", None)
    variants.append(trimmed_mode)

    trimmed_quality = dict(trimmed_mode)
    trimmed_quality.pop("video_params", None)
    trimmed_quality.pop("guidance_scale", None)
    variants.append(trimmed_quality)

    minimal = {"prompt": payload.get("prompt", "")}
    if "image" in payload:
        minimal["image"] = payload["image"]
    if "video" in payload:
        minimal["video"] = payload["video"]
    if "seed" in payload:
        minimal["seed"] = payload["seed"]
    variants.append(minimal)

    deduped: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in variants:
        key = json.dumps(item, sort_keys=True)
        if key in seen:
            continue
        deduped.append(item)
        seen.add(key)
    return deduped


def _is_cosmos_endpoint(endpoint: str) -> bool:
    return "/v1/cosmos/" in endpoint or "/v1/genai/" in endpoint


def _to_triton_payload(core: dict[str, Any]) -> dict[str, Any]:
    inputs: list[dict[str, Any]] = []
    parameters: dict[str, Any] = {}

    prompt = core.get("prompt")
    if isinstance(prompt, str) and prompt.strip():
        inputs.append(
            {
                "name": "prompt",
                "shape": [1],
                "datatype": "BYTES",
                "data": [prompt],
            }
        )

    for media_key in ("image", "video"):
        media_value = core.get(media_key)
        if isinstance(media_value, str) and media_value:
            inputs.append(
                {
                    "name": media_key,
                    "shape": [1],
                    "datatype": "BYTES",
                    "data": [media_value],
                }
            )

    passthrough_keys = ("mode", "steps", "guidance_scale", "seed", "model_profile")
    for key in passthrough_keys:
        if key in core:
            parameters[key] = core[key]

    video_params = core.get("video_params")
    if isinstance(video_params, dict):
        for key, value in video_params.items():
            parameters[key] = value

    payload: dict[str, Any] = {"inputs": inputs}
    if parameters:
        payload["parameters"] = parameters
    return payload


def _request_variants_for_endpoint(
    *,
    endpoint: str,
    payload: dict[str, Any],
    enable_contract_fallback: bool,
) -> list[dict[str, Any]]:
    request_variants: list[dict[str, Any]] = []
    seen: set[str] = set()

    core_variants = _payload_core_variants(payload)
    for core_index, core in enumerate(core_variants, start=1):
        wrappers: list[tuple[str, dict[str, Any]]]

        if not enable_contract_fallback:
            wrappers = [("raw", core)]
        elif _is_cosmos_endpoint(endpoint):
            # Cosmos endpoints are often contract-sensitive; try inputs wrappers first.
            wrappers = [
                ("triton_inputs", _to_triton_payload(core)),
                ("inputs_list", {"inputs": [core]}),
                ("inputs_object", {"inputs": core}),
                ("raw", core),
                ("input_object", {"input": core}),
                ("data_list", {"data": [core]}),
            ]
        else:
            wrappers = [
                ("raw", core),
                ("input_object", {"input": core}),
                ("inputs_list", {"inputs": [core]}),
            ]

        for wrapper_name, wrapped in wrappers:
            key = json.dumps(wrapped, sort_keys=True)
            if key in seen:
                continue
            seen.add(key)
            request_variants.append(
                {
                    "id": f"core{core_index}:{wrapper_name}",
                    "payload": wrapped,
                }
            )

    return request_variants


def _post_json_with_retry(
    *,
    url: str,
    payload: dict[str, Any],
    api_key: str,
    timeout: int,
    max_retries: int = 2,
) -> tuple[bytes, str]:
    request_body = json.dumps(payload).encode("utf-8")

    for attempt in range(1, max_retries + 2):
        req = Request(
            url=url,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json, video/*, application/octet-stream",
            },
            data=request_body,
        )
        try:
            with urlopen(req, timeout=timeout) as response:
                content_type = response.headers.get("Content-Type", "")
                body = response.read()
                return body, content_type
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            if attempt <= max_retries and exc.code in {429, 500, 502, 503, 504}:
                wait_s = float(2 ** (attempt - 1))
                _log(f"Transient HTTP {exc.code}, retrying in {wait_s:.1f}s")
                time.sleep(wait_s)
                continue
            raise HTTPRequestError(exc.code, detail)
        except URLError as exc:
            if attempt <= max_retries:
                wait_s = float(2 ** (attempt - 1))
                _log(f"Transient network error, retrying in {wait_s:.1f}s: {exc}")
                time.sleep(wait_s)
                continue
            raise PipelineError(f"Network error while calling NVIDIA endpoint: {exc}")

    _die("Unreachable retry loop")
    return b"", ""


def _download_url(url: str, api_key: str, timeout: int) -> bytes:
    parsed = urlparse(url)
    host = parsed.netloc.lower()
    is_nvidia_host = host.endswith("api.nvidia.com") or host.endswith("api.nvcf.nvidia.com")

    auth_headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "video/*, application/octet-stream, application/json, application/zip",
    }
    anon_headers = {
        "Accept": "video/*, application/octet-stream, application/json, application/zip",
    }

    header_sets = [auth_headers, anon_headers] if is_nvidia_host else [anon_headers, auth_headers]

    last_http_error: HTTPError | None = None
    last_http_detail = ""
    last_network_error: URLError | None = None

    for idx, headers in enumerate(header_sets, start=1):
        req = Request(
            url=url,
            method="GET",
            headers=headers,
        )
        try:
            with urlopen(req, timeout=timeout) as response:
                return response.read()
        except HTTPError as exc:
            last_http_error = exc
            detail = exc.read().decode("utf-8", errors="replace")
            last_http_detail = detail
            should_retry_auth_mode = (
                idx < len(header_sets)
                and exc.code in {400, 401, 403}
            )
            if should_retry_auth_mode:
                continue
            raise PipelineError(f"Failed to download artifact URL (HTTP {exc.code}): {detail}")
        except URLError as exc:
            last_network_error = exc
            if idx < len(header_sets):
                continue
            raise PipelineError(f"Network error while downloading artifact URL: {exc}")

    if last_http_error is not None:
        raise PipelineError(
            f"Failed to download artifact URL (HTTP {last_http_error.code}): {last_http_detail}"
        )
    if last_network_error is not None:
        raise PipelineError(f"Network error while downloading artifact URL: {last_network_error}")
    raise PipelineError("Failed to download artifact URL: unknown error")


def _decode_base64_blob(value: str) -> bytes:
    raw = value.strip()
    if raw.startswith("data:") and "," in raw:
        raw = raw.split(",", 1)[1]
    try:
        return base64.b64decode(raw, validate=False)
    except Exception as exc:  # noqa: BLE001
        raise PipelineError(f"Invalid base64 artifact payload: {exc}")


def _extract_from_artifact_item(item: dict[str, Any], api_key: str, timeout: int) -> bytes | None:
    for key in B64_KEYS:
        if isinstance(item.get(key), str) and item.get(key):
            return _decode_base64_blob(item[key])
    for key in URL_KEYS:
        if isinstance(item.get(key), str) and item.get(key):
            return _download_url(item[key], api_key, timeout)
    return None


def _extract_mp4_from_zip_blob(blob: bytes) -> bytes:
    try:
        archive = zipfile.ZipFile(io.BytesIO(blob))
    except zipfile.BadZipFile as exc:
        raise PipelineError(f"Invalid zip artifact payload: {exc}")

    with archive:
        entries = [name for name in archive.namelist() if name.lower().endswith(".mp4")]
        if not entries:
            _die("Zip artifact did not contain any .mp4 outputs")

        def _rank(name: str) -> tuple[int, int, str]:
            lower = name.lower()
            priority = 3
            if lower.endswith("output_video_0.mp4"):
                priority = 0
            elif "output_video_" in lower and "_dd_" not in lower:
                priority = 1
            elif lower.endswith(".mp4"):
                priority = 2
            size = archive.getinfo(name).file_size if name in archive.namelist() else 0
            return (priority, -size, lower)

        selected = sorted(entries, key=_rank)[0]
        return archive.read(selected)


def _normalize_video_blob(blob: bytes, content_type_hint: str) -> tuple[bytes, str]:
    if blob[:2] == b"PK":
        extracted = _extract_mp4_from_zip_blob(blob)
        return extracted, "video/mp4"
    if not content_type_hint:
        return blob, "application/octet-stream"
    return blob, content_type_hint


def _extract_video_bytes(body: bytes, content_type: str, api_key: str, timeout: int) -> tuple[bytes, str]:
    lower_ct = (content_type or "").lower()

    if lower_ct.startswith("video/") or lower_ct.startswith("application/octet-stream"):
        if body:
            return _normalize_video_blob(body, lower_ct)

    parsed_json: dict[str, Any] | None = None
    try:
        parsed = json.loads(body.decode("utf-8"))
        if isinstance(parsed, dict):
            parsed_json = parsed
    except Exception:
        parsed_json = None

    if parsed_json is None:
        if body:
            return _normalize_video_blob(body, lower_ct or "application/octet-stream")
        _die("NVIDIA response did not contain JSON or binary video data")

    status = str(parsed_json.get("status", "")).strip().lower()
    if status:
        detail = (
            str(parsed_json.get("detail", "")).strip()
            or str(parsed_json.get("error", "")).strip()
            or str(parsed_json.get("errorCode", "")).strip()
            or str(parsed_json.get("response", "")).strip()
        )
        if status in NVCF_PENDING_STATUSES:
            raise NVCFPendingError(f"NVCF request pending ({status}): {detail or 'no detail'}")
        if status in NVCF_TERMINAL_ERROR_STATUSES:
            _die(f"NVIDIA response status={status}: {detail or 'no detail'}")
        if (
            not status.isdigit()
            and status not in {"fulfilled", "completed", "success", "succeeded", "ok"}
        ):
            _die(f"NVIDIA response status={status}: {detail or 'no detail'}")

    for key in B64_KEYS:
        value = parsed_json.get(key)
        if isinstance(value, str) and value:
            blob = _decode_base64_blob(value)
            return _normalize_video_blob(blob, "video/mp4")

    for key in URL_KEYS:
        value = parsed_json.get(key)
        if isinstance(value, str) and value:
            blob = _download_url(value, api_key, timeout)
            return _normalize_video_blob(blob, "video/mp4")

    artifacts = parsed_json.get("artifacts")
    if isinstance(artifacts, list):
        for item in artifacts:
            if isinstance(item, dict):
                extracted = _extract_from_artifact_item(item, api_key, timeout)
                if extracted:
                    mime = str(item.get("mime_type") or "video/mp4")
                    return _normalize_video_blob(extracted, mime)

    data_items = parsed_json.get("data")
    if isinstance(data_items, list):
        for item in data_items:
            if isinstance(item, dict):
                extracted = _extract_from_artifact_item(item, api_key, timeout)
                if extracted:
                    mime = str(item.get("mime_type") or "video/mp4")
                    return _normalize_video_blob(extracted, mime)

    result_obj = parsed_json.get("result")
    if isinstance(result_obj, dict):
        extracted = _extract_from_artifact_item(result_obj, api_key, timeout)
        if extracted:
            mime = str(result_obj.get("mime_type") or "video/mp4")
            return _normalize_video_blob(extracted, mime)

    _die("Unable to locate a downloadable video artifact in NVIDIA response")
    return b"", "video/mp4"


def _candidate_score(qa_report: dict[str, Any]) -> float:
    semantic = _safe_float(qa_report.get("semantic_score"))
    temporal = _safe_float(qa_report.get("temporal_score"))
    branding = _safe_float(qa_report.get("branding_score", semantic))
    instruction = _safe_float(qa_report.get("instruction_score", semantic))
    tech = qa_report.get("technical_checks") if isinstance(qa_report, dict) else {}
    technical_ok = bool(
        isinstance(tech, dict)
        and tech.get("decode_ok")
        and tech.get("duration_ok")
        and tech.get("fps_ok")
        and tech.get("short_edge_ok")
    )
    technical_score = 1.0 if technical_ok else 0.0
    artifact_penalty = 0.01 * len(qa_report.get("artifact_flags", []))
    score = (
        (semantic * 0.45)
        + (temporal * 0.25)
        + (branding * 0.15)
        + (technical_score * 0.10)
        + (instruction * 0.05)
        - artifact_penalty
    )
    score = max(0.0, min(1.0, score))
    return round(score, 4)


def _best_candidate(candidates: list[dict[str, Any]]) -> dict[str, Any]:
    if not candidates:
        _die("No candidates were generated")
    return max(
        candidates,
        key=lambda item: (
            1 if item.get("pass_fail") else 0,
            _safe_float(item.get("aggregate_score")),
            -_safe_int(item.get("attempt"), 0),
            -_safe_int(item.get("index"), 0),
        ),
    )


def _qa_script_path() -> Path:
    return Path(__file__).resolve().parent / "video_qa_gate_openai_compat.py"


def _run_qa_subprocess(
    *,
    video_path: Path,
    prompt: str,
    judge_model: str,
    threshold: float,
    json_out: Path,
    api_key_env: str,
    base_url: str,
    timeout_seconds: int,
    http_timeout_seconds: int,
    ffprobe_timeout_seconds: int,
    ffmpeg_timeout_seconds: int,
    disable_opencv_fallback: bool,
    soft_fail: bool,
    dry_run: bool,
) -> dict[str, Any]:
    qa_script = _qa_script_path()
    if not qa_script.exists():
        _die(f"QA script not found: {qa_script}")

    cmd = [
        sys.executable,
        str(qa_script),
        "--video",
        str(video_path),
        "--prompt",
        prompt,
        "--judge-model",
        judge_model,
        "--threshold",
        str(threshold),
        "--json-out",
        str(json_out),
        "--api-key-env",
        api_key_env,
        "--base-url",
        base_url,
        "--timeout",
        str(http_timeout_seconds),
        "--ffprobe-timeout-seconds",
        str(ffprobe_timeout_seconds),
        "--ffmpeg-timeout-seconds",
        str(ffmpeg_timeout_seconds),
    ]
    if disable_opencv_fallback:
        cmd.append("--disable-opencv-fallback")
    if dry_run:
        cmd.append("--dry-run")
    if soft_fail:
        cmd.append("--soft-fail")

    try:
        proc = subprocess.run(cmd, text=True, capture_output=True, timeout=timeout_seconds)
    except subprocess.TimeoutExpired as exc:
        _die(
            "QA gate command timed out after "
            f"{timeout_seconds}s. Partial output: "
            f"{(exc.stdout or '').strip() or (exc.stderr or '').strip() or '<empty>'}"
        )
    if proc.returncode not in {0, 2}:
        _die(
            "QA gate command failed. "
            f"Return code {proc.returncode}. STDERR: {proc.stderr.strip() or '<empty>'}"
        )

    if json_out.exists():
        try:
            report = json.loads(json_out.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            _die(f"QA JSON output is invalid: {exc}")
    else:
        try:
            report = json.loads(proc.stdout)
        except json.JSONDecodeError as exc:
            _die(f"QA stdout is invalid JSON: {exc}")

    if not isinstance(report, dict):
        _die("QA report must be a JSON object")
    return report


def _build_correction_notes(report: dict[str, Any]) -> str:
    reasons = report.get("reasons", [])
    artifacts = report.get("artifact_flags", [])

    reason_items = [str(item).strip() for item in reasons if str(item).strip()][:3]
    artifact_items = [str(item).strip() for item in artifacts if str(item).strip()][:3]

    parts: list[str] = []
    if reason_items:
        parts.append("reasons: " + "; ".join(reason_items))
    if artifact_items:
        parts.append("artifacts: " + "; ".join(artifact_items))

    return " | ".join(parts)


def _qa_report_markdown(report: dict[str, Any], candidate_id: str, threshold: float) -> str:
    technical = report.get("technical_checks", {})
    lines = [
        "# QA Report",
        "",
        f"- candidate_id: `{candidate_id}`",
        f"- pass_fail: `{bool(report.get('pass_fail'))}`",
        f"- semantic_score: `{report.get('semantic_score')}`",
        f"- temporal_score: `{report.get('temporal_score')}`",
        f"- threshold: `{threshold}`",
        "",
        "## Technical Checks",
        "",
        f"- decode_ok: `{technical.get('decode_ok')}`",
        f"- duration_seconds: `{technical.get('duration_seconds')}`",
        f"- fps: `{technical.get('fps')}`",
        f"- width: `{technical.get('width')}`",
        f"- height: `{technical.get('height')}`",
        f"- duration_ok: `{technical.get('duration_ok')}`",
        f"- fps_ok: `{technical.get('fps_ok')}`",
        f"- short_edge_ok: `{technical.get('short_edge_ok')}`",
        "",
        "## Artifact Flags",
        "",
    ]

    artifact_flags = report.get("artifact_flags", [])
    if artifact_flags:
        for item in artifact_flags:
            lines.append(f"- {item}")
    else:
        lines.append("- none")

    lines.extend(["", "## Reasons", ""])
    reasons = report.get("reasons", [])
    if reasons:
        for item in reasons:
            lines.append(f"- {item}")
    else:
        lines.append("- none")

    lines.append("")
    return "\n".join(lines)


def _copy_final_video(src: Path, out_dir: Path, suffix: str = "") -> Path:
    dest_name = "final_video.mp4" if not suffix else f"final_video_{suffix}.mp4"
    dest = out_dir / dest_name
    shutil.copy2(src, dest)
    return dest


def _build_attempt_failure_message(candidate_id: str, failures: list[dict[str, Any]]) -> str:
    if not failures:
        return f"{candidate_id}: generation failed with unknown error"

    last_error = str(failures[-1].get("error", "unknown"))
    has_404 = any("HTTP 404" in str(item.get("error", "")) for item in failures)
    has_inputs_contract = any("inputs" in str(item.get("error", "")).lower() for item in failures)
    has_nvcf_asset_requirement = any(
        "video2world" in str(item.get("error", "")).lower()
        or str(item.get("request_variant_id", "")).lower() == "nvcf_prepare"
        for item in failures
    )

    suffix_parts: list[str] = []
    if has_404:
        suffix_parts.append(
            "Endpoint may be unavailable for this account. "
            "Set an account-enabled hosted endpoint with --nim-endpoint "
            "or NVIDIA_COSMOS_*_ENDPOINT(S)."
        )
    if has_inputs_contract:
        suffix_parts.append(
            "Endpoint appears contract-sensitive; keep contract fallback enabled "
            "or provide a matching endpoint/payload contract."
        )
    if has_nvcf_asset_requirement:
        suffix_parts.append(
            "NVCF video2world routes require a referenced input asset. "
            "Provide --input-image/--input-video or switch to a text-capable endpoint."
        )

    suffix = ""
    if suffix_parts:
        suffix = " " + " ".join(suffix_parts)

    return f"{candidate_id}: all endpoint/payload variants failed. Last error: {last_error}{suffix}"


def _generate_attempt_candidates(
    *,
    attempt: int,
    attempt_prompt: str,
    candidate_count: int,
    seed: int | None,
    base_out: Path,
    model_profile: str,
    quality: str,
    input_image: Path | None,
    input_video: Path | None,
    endpoint_candidates: list[str],
    disable_contract_fallback: bool,
    timeout: int,
    http_retries: int,
    max_request_attempts: int,
    nvcf_poll_seconds: int,
    pending_backoff_seconds: float,
    pending_backoff_max_seconds: float,
    api_key: str,
    dry_run: bool,
    nvcf_asset_cache: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    attempt_candidates: list[dict[str, Any]] = []

    for index in range(1, candidate_count + 1):
        candidate_id = f"a{attempt}-c{index}"
        candidate_seed = seed + (attempt - 1) * 100 + index if seed is not None else None
        payload: dict[str, Any] | None = None

        response_meta: dict[str, Any] = {}
        video_bytes = b""
        mime = "video/mp4"

        if dry_run:
            video_bytes = b"dry-run-video-placeholder"
            response_meta = {"mode": "dry-run"}
        else:
            endpoint_failures: list[dict[str, Any]] = []
            request_attempts = 0
            budget_exhausted = False
            for endpoint_idx, endpoint_candidate in enumerate(endpoint_candidates, start=1):
                if budget_exhausted:
                    break
                nvcf_assets: dict[str, Any] | None = None
                if _is_nvcf_exec_endpoint(endpoint_candidate):
                    try:
                        if endpoint_candidate not in nvcf_asset_cache:
                            nvcf_asset_cache[endpoint_candidate] = _prepare_nvcf_assets_for_endpoint(
                                endpoint=endpoint_candidate,
                                input_image=input_image,
                                input_video=input_video,
                                api_key=api_key,
                                timeout=timeout,
                                dry_run=dry_run,
                            )
                        nvcf_assets = nvcf_asset_cache[endpoint_candidate]
                        request_variants = _request_variants_for_nvcf_exec(
                            prompt=attempt_prompt,
                            input_flag=str(nvcf_assets.get("input_flag", "")),
                            input_asset_ids=list(nvcf_assets.get("asset_ids", [])),
                            poll_duration_seconds=_bounded_nvcf_poll_seconds(nvcf_poll_seconds),
                            enable_contract_fallback=not disable_contract_fallback,
                        )
                    except PipelineError as exc:
                        endpoint_failures.append(
                            {
                                "endpoint": endpoint_candidate,
                                "endpoint_index": endpoint_idx,
                                "request_variant_index": 0,
                                "request_variant_id": "nvcf_prepare",
                                "error": str(exc),
                                "payload_summary": {},
                            }
                        )
                        continue
                else:
                    if payload is None:
                        payload = _build_payload(
                            prompt=attempt_prompt,
                            model_profile=model_profile,
                            quality=quality,
                            input_image=input_image,
                            input_video=input_video,
                            seed=candidate_seed,
                        )
                    request_variants = _request_variants_for_endpoint(
                        endpoint=endpoint_candidate,
                        payload=payload,
                        enable_contract_fallback=not disable_contract_fallback,
                    )
                for request_idx, request_variant in enumerate(request_variants, start=1):
                    request_payload = request_variant["payload"]
                    request_variant_id = str(request_variant["id"])
                    pending_round = 0
                    while True:
                        if request_attempts >= max_request_attempts:
                            endpoint_failures.append(
                                {
                                    "endpoint": endpoint_candidate,
                                    "endpoint_index": endpoint_idx,
                                    "request_variant_index": request_idx,
                                    "request_variant_id": "budget_exhausted",
                                    "error": (
                                        "Request budget exhausted. "
                                        f"Increase --max-request-attempts (current {max_request_attempts}) "
                                        "or reduce endpoint/payload fallback scope."
                                    ),
                                    "payload_summary": {},
                                }
                            )
                            budget_exhausted = True
                            break

                        request_attempts += 1
                        try:
                            _log(
                                f"{candidate_id}: endpoint {endpoint_idx}/{len(endpoint_candidates)} "
                                f"request {request_idx}/{len(request_variants)} ({request_variant_id})"
                            )
                            body, content_type = _post_json_with_retry(
                                url=endpoint_candidate,
                                payload=request_payload,
                                api_key=api_key,
                                timeout=timeout,
                                max_retries=http_retries,
                            )
                            video_bytes, mime = _extract_video_bytes(
                                body, content_type, api_key, timeout
                            )
                            response_meta = {
                                "endpoint": endpoint_candidate,
                                "endpoint_index": endpoint_idx,
                                "request_variant_index": request_idx,
                                "request_variant_id": request_variant_id,
                                "content_type": content_type,
                                "payload_summary": _summarize_payload(request_payload),
                                "attempted_requests": request_attempts,
                            }
                            if nvcf_assets is not None:
                                response_meta["nvcf_assets"] = nvcf_assets.get("uploaded_assets", [])
                            break
                        except NVCFPendingError as exc:
                            pending_round += 1
                            endpoint_failures.append(
                                {
                                    "endpoint": endpoint_candidate,
                                    "endpoint_index": endpoint_idx,
                                    "request_variant_index": request_idx,
                                    "request_variant_id": request_variant_id,
                                    "error": str(exc),
                                    "payload_summary": _summarize_payload(request_payload),
                                }
                            )
                            if request_attempts >= max_request_attempts:
                                budget_exhausted = True
                                break
                            wait_s = min(
                                pending_backoff_max_seconds,
                                pending_backoff_seconds * float(1 + min(pending_round - 1, 4)),
                            )
                            if wait_s > 0:
                                _log(
                                    f"{candidate_id}: result pending, retrying same variant in {wait_s:.1f}s"
                                )
                                time.sleep(wait_s)
                            continue
                        except (PipelineError, HTTPRequestError) as exc:
                            endpoint_failures.append(
                                {
                                    "endpoint": endpoint_candidate,
                                    "endpoint_index": endpoint_idx,
                                    "request_variant_index": request_idx,
                                    "request_variant_id": request_variant_id,
                                    "error": str(exc),
                                    "payload_summary": _summarize_payload(request_payload),
                                }
                            )
                            break
                    if budget_exhausted or video_bytes:
                        break
                if video_bytes:
                    break

            if not video_bytes:
                _die(_build_attempt_failure_message(candidate_id, endpoint_failures))

        candidate_path = base_out / f"{candidate_id}.mp4"
        candidate_path.write_bytes(video_bytes)
        if candidate_path.stat().st_size <= 0:
            _die(f"{candidate_id}: generated video is empty")

        candidate_record = {
            "candidate_id": candidate_id,
            "attempt": attempt,
            "index": index,
            "seed": candidate_seed,
            "path": str(candidate_path),
            "bytes": candidate_path.stat().st_size,
            "mime": mime,
            "aggregate_score": None,
            "pass_fail": False,
            "qa_report": None,
            "qa": None,
            "response": response_meta,
        }
        attempt_candidates.append(candidate_record)

    return attempt_candidates


def _judge_attempt_with_qa(
    *,
    attempt_candidates: list[dict[str, Any]],
    attempt_prompt: str,
    base_out: Path,
    judge_model: str,
    qa_threshold: float,
    api_key_env: str,
    judge_base_url: str,
    qa_timeout_seconds: int,
    qa_http_timeout_seconds: int,
    qa_ffprobe_timeout_seconds: int,
    qa_ffmpeg_timeout_seconds: int,
    qa_disable_opencv_fallback: bool,
    dry_run: bool,
) -> list[dict[str, Any]]:
    judged: list[dict[str, Any]] = []
    for row in attempt_candidates:
        candidate_qa_json = base_out / f"{row['candidate_id']}_qa.json"
        qa_report = _run_qa_subprocess(
            video_path=Path(str(row["path"])),
            prompt=attempt_prompt,
            judge_model=judge_model,
            threshold=qa_threshold,
            json_out=candidate_qa_json,
            api_key_env=api_key_env,
            base_url=judge_base_url,
            timeout_seconds=qa_timeout_seconds,
            http_timeout_seconds=qa_http_timeout_seconds,
            ffprobe_timeout_seconds=qa_ffprobe_timeout_seconds,
            ffmpeg_timeout_seconds=qa_ffmpeg_timeout_seconds,
            disable_opencv_fallback=qa_disable_opencv_fallback,
            soft_fail=True,
            dry_run=dry_run,
        )
        row["aggregate_score"] = _candidate_score(qa_report)
        row["pass_fail"] = bool(qa_report.get("pass_fail"))
        row["qa_report"] = str(candidate_qa_json)
        row["qa"] = qa_report
        judged.append(row)
    return judged


def _apply_voice_and_overlays(
    *,
    selected_path: Path,
    base_out: Path,
    voice_enabled: bool,
    voice_audio: Path | None,
    voice_text: str,
    voice_model: str,
    voice_function_id: str,
    voice_name: str,
    voice_language_code: str,
    voice_sample_rate: int,
    voice_server: str,
    voice_cache_dir: Path,
    skip_voice_bootstrap: bool,
    voice_gain_db: float,
    overlay_templates: list[str],
    overlay_files: list[Path],
    overlay_plan: dict[str, Any],
    api_key: str,
    dry_run: bool,
) -> dict[str, Any]:
    outputs: dict[str, Any] = {
        "video": None,
        "video_silent": None,
        "voice_audio": None,
        "overlay_plan": None,
        "voice": None,
    }

    final_video = _copy_final_video(selected_path, base_out, suffix="silent" if voice_enabled else "")
    rendered_video = final_video

    if voice_enabled:
        outputs["video_silent"] = str(final_video)
        if voice_audio:
            voice_ext = voice_audio.suffix if voice_audio.suffix else ".wav"
            voice_output = base_out / f"narration{voice_ext}"
            shutil.copy2(voice_audio, voice_output)
            voice_meta: dict[str, Any] | None = {
                "mode": "external_audio",
                "source": str(voice_audio),
            }
        else:
            voice_output = base_out / "narration.wav"
            voice_output, voice_meta = _synthesize_voice_audio_riva(
                out_path=voice_output,
                text=voice_text,
                model=voice_model,
                explicit_function_id=voice_function_id,
                voice_name=voice_name,
                language_code=voice_language_code,
                sample_rate=voice_sample_rate,
                server=voice_server.strip(),
                cache_dir=voice_cache_dir,
                skip_bootstrap=skip_voice_bootstrap,
                api_key=api_key,
                dry_run=dry_run,
            )
        outputs["voice_audio"] = str(voice_output)
        outputs["voice"] = voice_meta
        if dry_run:
            rendered_video = _copy_final_video(selected_path, base_out)
        else:
            rendered_video = _mux_voice_audio(
                video_path=final_video,
                audio_path=voice_output,
                output_path=base_out / "final_video_voice.mp4",
                gain_db=voice_gain_db,
            )

    has_overlay = bool(overlay_templates or overlay_files)
    if has_overlay:
        overlay_path = base_out / "final_video_overlay.mp4"
        try:
            rendered_video = apply_overlays(
                input_video=rendered_video,
                output_video=overlay_path,
                overlay_templates=overlay_templates,
                overlay_files=overlay_files,
                dry_run=dry_run,
            )
        except Exception as exc:  # noqa: BLE001
            _die(f"Overlay application failed: {exc}")

    final_out = base_out / "final_video.mp4"
    if Path(rendered_video).resolve() != final_out.resolve():
        shutil.copy2(rendered_video, final_out)
    outputs["video"] = str(final_out)

    if overlay_plan.get("enabled"):
        outputs["overlay_plan"] = write_overlay_plan(overlay_plan, base_out)

    return outputs


def _parse_list_of_paths(values: Any) -> list[Path]:
    if not isinstance(values, list):
        return []
    resolved: list[Path] = []
    for item in values:
        path = _normalize_path(str(item))
        if path.exists():
            resolved.append(path)
    return resolved


def _manifest_params_paths(params: dict[str, Any], key: str) -> list[Path]:
    return _parse_list_of_paths(params.get(key, []))


def _classify_probe_failure(status: int, body: str) -> str:
    lower = (body or "").lower()
    if status in {200, 201, 202, 204}:
        return "ok"
    if status in {400, 401, 403, 405, 409, 415, 422, 429, 500, 502, 503, 504}:
        return "path_likely_valid"
    if status == 404:
        if "not found for account" in lower and "function" in lower:
            return "path_valid_account_missing"
        if "404 page not found" in lower:
            return "path_invalid_or_unrouted"
        return "not_found_unknown"
    if status == 0:
        return "network_error"
    return "other"


def _esc(value: Any) -> str:
    return html.escape(str(value))


def _fmt_bool(value: Any) -> str:
    if isinstance(value, bool):
        return "yes" if value else "no"
    if value is None:
        return "-"
    text = str(value).strip().lower()
    if text in ("true", "1", "yes", "y"):
        return "yes"
    if text in ("false", "0", "no", "n"):
        return "no"
    return str(value)


def _safe_score(value: Any) -> float | None:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return None
    if score < 0:
        score = 0.0
    if score > 1.0:
        score = 1.0
    return score


def _fmt_score(value: Any) -> str:
    score = _safe_score(value)
    if score is None:
        return "-"
    return f"{score:.3f}"


def _fmt_bytes(value: Any) -> str:
    raw = _safe_int(value, default=-1)
    if raw < 0:
        return "-"
    if raw < 1024:
        return f"{raw} B"
    units = ("KB", "MB", "GB")
    scaled = float(raw)
    for unit in units:
        scaled /= 1024.0
        if scaled < 1024.0:
            return f"{scaled:.2f} {unit}"
    return f"{scaled:.2f} TB"


def _short_text(value: Any, limit: int = 180) -> str:
    text = str(value or "")
    if len(text) <= limit:
        return text
    return text[: max(0, limit - 1)].rstrip() + "…"


def _file_uri(path_value: Any) -> str:
    raw = str(path_value or "").strip()
    if not raw:
        return ""
    if raw.startswith(("http://", "https://", "file://")):
        return raw
    try:
        path = Path(raw)
        if not path.is_absolute():
            path = (Path.cwd() / path).resolve()
        else:
            path = path.resolve()
        return path.as_uri()
    except Exception:
        return raw


def _badge_class(label: str) -> str:
    lower = label.lower()
    if any(token in lower for token in ("completed", "ok", "pass", "success")):
        return "badge-ok"
    if any(token in lower for token in ("failed", "error", "invalid", "exhausted")):
        return "badge-fail"
    if any(token in lower for token in ("running", "retry", "likely", "warn", "429", "500")):
        return "badge-warn"
    return "badge-neutral"


def _score_css_class(value: float | None, threshold: float | None) -> str:
    if value is None:
        return "badge-neutral"
    if threshold is None:
        if value >= 0.8:
            return "badge-ok"
        if value >= 0.65:
            return "badge-warn"
        return "badge-fail"
    if value >= threshold:
        return "badge-ok"
    if value >= max(0.0, threshold - 0.08):
        return "badge-warn"
    return "badge-fail"


def _render_score_rows(items: list[tuple[str, Any]], threshold: float | None) -> str:
    rows: list[str] = []
    for label, raw_value in items:
        value = _safe_score(raw_value)
        score_text = "-" if value is None else f"{value:.3f}"
        width = 0 if value is None else int(round(value * 100.0))
        css = _score_css_class(value, threshold)
        rows.append(
            "<div class=\"score-row\">"
            f"<div class=\"score-label\">{_esc(label)}</div>"
            "<div class=\"score-track\">"
            f"<div class=\"score-fill {css}\" style=\"width: {width}%\"></div>"
            "</div>"
            f"<div class=\"score-value {css}\">{_esc(score_text)}</div>"
            "</div>"
        )
    return "".join(rows) if rows else "<div class=\"muted\">No score data available.</div>"


def _dashboard_shell(
    *,
    title: str,
    subtitle: str,
    badge: str,
    cards_html: str,
    sections_html: str,
) -> str:
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{_esc(title)}</title>
  <style>
    :root {{
      --bg-1: #f9f4ea;
      --bg-2: #eaf7f2;
      --bg-3: #fff9f0;
      --ink-1: #0f172a;
      --ink-2: #334155;
      --line: #dbe4dc;
      --card: rgba(255, 255, 255, 0.82);
      --ok: #0f766e;
      --warn: #a16207;
      --fail: #be123c;
      --muted: #64748b;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      font-family: "Space Grotesk", "Sora", "Poppins", sans-serif;
      color: var(--ink-1);
      min-height: 100vh;
      background:
        radial-gradient(circle at 12% 14%, rgba(13, 148, 136, 0.18), transparent 38%),
        radial-gradient(circle at 88% 86%, rgba(217, 119, 6, 0.16), transparent 34%),
        linear-gradient(140deg, var(--bg-1), var(--bg-2) 48%, var(--bg-3));
      padding: 28px 20px 48px;
    }}
    .wrap {{ max-width: 1200px; margin: 0 auto; }}
    .hero {{
      background: linear-gradient(140deg, rgba(255,255,255,0.92), rgba(255,255,255,0.74));
      border: 1px solid var(--line);
      border-radius: 22px;
      padding: 22px;
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
    }}
    .hero h1 {{
      margin: 0 0 8px;
      line-height: 1.05;
      font-size: clamp(1.6rem, 3.2vw, 2.5rem);
      letter-spacing: -0.03em;
    }}
    .hero p {{
      margin: 0;
      color: var(--ink-2);
      max-width: 72ch;
      line-height: 1.45;
    }}
    .badge {{
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 7px 12px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.02em;
      border: 1px solid transparent;
      margin-top: 12px;
    }}
    .badge-ok {{ color: #064e3b; background: #d1fae5; border-color: #a7f3d0; }}
    .badge-warn {{ color: #7c2d12; background: #ffedd5; border-color: #fed7aa; }}
    .badge-fail {{ color: #831843; background: #ffe4e6; border-color: #fecdd3; }}
    .badge-neutral {{ color: #0f172a; background: #eef2ff; border-color: #c7d2fe; }}
    .cards {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 12px;
      margin-top: 14px;
    }}
    .card {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 12px 14px;
      backdrop-filter: blur(8px);
      animation: rise 450ms ease both;
    }}
    .card .k {{ font-size: 0.76rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }}
    .card .v {{ margin-top: 4px; font-size: 1.02rem; font-weight: 700; color: var(--ink-1); overflow-wrap: anywhere; }}
    .grid {{
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 14px;
    }}
    .panel {{
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 14px;
      animation: rise 520ms ease both;
      backdrop-filter: blur(8px);
    }}
    .panel h2 {{
      margin: 0 0 10px;
      font-size: 1rem;
      letter-spacing: -0.01em;
    }}
    .kv {{
      display: grid;
      grid-template-columns: 1fr 1.35fr;
      gap: 6px 12px;
      font-size: 0.9rem;
      line-height: 1.35;
    }}
    .kv .k {{ color: var(--muted); }}
    .kv .v {{ color: var(--ink-1); font-weight: 600; overflow-wrap: anywhere; }}
    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.84rem;
    }}
    th, td {{
      text-align: left;
      padding: 8px 8px;
      border-bottom: 1px solid var(--line);
      vertical-align: top;
      overflow-wrap: anywhere;
    }}
    th {{
      font-size: 0.72rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }}
    .mono {{ font-family: "IBM Plex Mono", "Menlo", "Monaco", monospace; font-size: 0.78rem; }}
    .list {{
      margin: 0;
      padding-left: 1.1rem;
    }}
    .list li {{ margin: 0.28rem 0; }}
    .muted {{ color: var(--muted); font-size: 0.88rem; }}
    .chips {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }}
    .chip {{
      display: inline-flex;
      align-items: center;
      gap: 7px;
      border-radius: 999px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.74);
      padding: 4px 10px;
      font-size: 0.76rem;
      font-weight: 700;
      line-height: 1;
    }}
    .chip strong {{
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.08);
      padding: 3px 7px;
      font-size: 0.72rem;
    }}
    .score-grid {{
      display: grid;
      gap: 9px;
    }}
    .score-row {{
      display: grid;
      grid-template-columns: 110px 1fr 58px;
      gap: 10px;
      align-items: center;
    }}
    .score-label {{
      color: var(--muted);
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }}
    .score-track {{
      position: relative;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.28);
      height: 9px;
      overflow: hidden;
    }}
    .score-fill {{
      height: 100%;
      width: 0%;
      border-radius: inherit;
      transition: width 320ms ease;
    }}
    .score-fill.badge-ok {{ background: linear-gradient(90deg, #34d399, #0f766e); }}
    .score-fill.badge-warn {{ background: linear-gradient(90deg, #fbbf24, #b45309); }}
    .score-fill.badge-fail {{ background: linear-gradient(90deg, #fb7185, #be123c); }}
    .score-fill.badge-neutral {{ background: linear-gradient(90deg, #94a3b8, #64748b); }}
    .score-value {{
      text-align: right;
      border-radius: 999px;
      padding: 3px 7px;
      font-weight: 700;
      font-size: 0.75rem;
      border: 1px solid transparent;
    }}
    .score-value.badge-ok {{ color: #064e3b; background: #d1fae5; border-color: #a7f3d0; }}
    .score-value.badge-warn {{ color: #7c2d12; background: #ffedd5; border-color: #fed7aa; }}
    .score-value.badge-fail {{ color: #831843; background: #ffe4e6; border-color: #fecdd3; }}
    .score-value.badge-neutral {{ color: #0f172a; background: #eef2ff; border-color: #c7d2fe; }}
    .video-wrap {{
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid var(--line);
      background: #0b1120;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
    }}
    .video-wrap video {{
      display: block;
      width: 100%;
      max-height: 320px;
      background: #0b1120;
    }}
    .inline-pill {{
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid transparent;
      white-space: nowrap;
    }}
    .section-gap {{ display: grid; gap: 10px; }}
    @keyframes rise {{
      from {{ opacity: 0; transform: translateY(10px); }}
      to {{ opacity: 1; transform: translateY(0); }}
    }}
    @media (max-width: 720px) {{
      .kv {{ grid-template-columns: 1fr; }}
      .table-candidates th:nth-child(8), .table-candidates td:nth-child(8) {{ display: none; }}
      .table-candidates th:nth-child(9), .table-candidates td:nth-child(9) {{ display: none; }}
      .table-probe th:nth-child(4), .table-probe td:nth-child(4) {{ display: none; }}
      .table-probe th:nth-child(5), .table-probe td:nth-child(5) {{ display: none; }}
      .score-row {{ grid-template-columns: 1fr; gap: 5px; }}
      .score-label {{ font-size: 0.76rem; }}
      .score-value {{ text-align: left; width: fit-content; }}
      body {{ padding: 16px 12px 30px; }}
      .hero {{ padding: 16px; border-radius: 16px; }}
      .panel {{ border-radius: 14px; }}
    }}
  </style>
</head>
<body>
  <div class="wrap">
    <section class="hero">
      <h1>{_esc(title)}</h1>
      <p>{_esc(subtitle)}</p>
      <span class="badge {_badge_class(badge)}">{_esc(badge)}</span>
      <div class="cards">{cards_html}</div>
    </section>
    <section class="grid">{sections_html}</section>
  </div>
</body>
</html>
"""


def _render_kv_rows(items: list[tuple[str, Any]]) -> str:
    rows: list[str] = []
    for key, value in items:
        rows.append(
            f'<div class="k">{_esc(key)}</div><div class="v">{_esc(value if value is not None else "-")}</div>'
        )
    return "".join(rows)


def _render_cards(items: list[tuple[str, Any]]) -> str:
    cards: list[str] = []
    for key, value in items:
        cards.append(
            "<article class=\"card\">"
            f"<div class=\"k\">{_esc(key)}</div>"
            f"<div class=\"v\">{_esc(value if value is not None else '-')}</div>"
            "</article>"
        )
    return "".join(cards)


def _render_generate_dashboard_html(manifest: dict[str, Any], qa_report: dict[str, Any]) -> str:
    params = manifest.get("params", {}) if isinstance(manifest, dict) else {}
    attempts = manifest.get("attempts", []) if isinstance(manifest.get("attempts"), list) else []
    candidates = manifest.get("candidates", []) if isinstance(manifest.get("candidates"), list) else []
    outputs = manifest.get("outputs", {}) if isinstance(manifest.get("outputs"), dict) else {}
    selected = manifest.get("selected_candidate") if isinstance(manifest.get("selected_candidate"), dict) else {}
    errors = manifest.get("errors", []) if isinstance(manifest.get("errors"), list) else []
    qa_reasons = qa_report.get("reasons", []) if isinstance(qa_report.get("reasons"), list) else []

    qa_threshold = _safe_score(qa_report.get("threshold", params.get("qa_threshold")))
    semantic_score = _safe_score(qa_report.get("semantic_score"))
    temporal_score = _safe_score(qa_report.get("temporal_score"))
    selected_score = _safe_score(qa_report.get("aggregate_score", selected.get("aggregate_score")))
    checks = qa_report.get("technical_checks", {})
    if isinstance(checks, dict) and checks:
        technical_score = 1.0 if all(bool(v) for v in checks.values()) else 0.0
    else:
        technical_score = 1.0 if bool(qa_report.get("pass_fail")) else None

    pass_count = 0
    for item in candidates:
        if isinstance(item, dict) and item.get("pass_fail") is True:
            pass_count += 1
    fail_count = max(0, len(candidates) - pass_count)

    cards = _render_cards(
        [
            ("Run ID", manifest.get("run_id", "-")),
            ("Model", manifest.get("model_profile", "-")),
            ("Candidates", len(candidates)),
            ("Pass / Fail", f"{pass_count} / {fail_count}"),
            ("Threshold", _fmt_score(qa_threshold)),
            ("Best score", _fmt_score(selected_score)),
        ]
    )

    final_video = outputs.get("video")
    preview_uri = _file_uri(final_video)
    voice_audio = outputs.get("voice_audio")
    voice_uri = _file_uri(voice_audio)
    if preview_uri:
        preview_body = (
            "<div class=\"video-wrap\">"
            f"<video controls preload=\"metadata\" playsinline src=\"{_esc(preview_uri)}\"></video>"
            "</div>"
            f"<div class=\"mono muted\" style=\"margin-top: 8px;\">{_esc(final_video)}</div>"
        )
    else:
        preview_body = "<div class=\"muted\">No final video path found in manifest outputs.</div>"
    if voice_uri:
        preview_body += (
            "<div style=\"margin-top:14px;\">"
            "<audio controls preload=\"metadata\" style=\"width:100%;\">"
            f"<source src=\"{_esc(voice_uri)}\"/>"
            "</audio>"
            f"<div class=\"mono muted\" style=\"margin-top: 8px;\">{_esc(voice_audio)}</div>"
            "</div>"
        )
    preview_panel = (
        "<article class=\"panel\">"
        "<h2>Preview</h2>"
        f"{preview_body}"
        "</article>"
    )

    overview_kv = _render_kv_rows(
        [
            ("status", manifest.get("status", "-")),
            ("quality", params.get("quality", "-")),
            ("endpoint strategy", params.get("endpoint_strategy", "-")),
            ("contract fallback", _fmt_bool(params.get("contract_fallback"))),
            ("endpoint", params.get("endpoint", "-")),
            ("voice enabled", _fmt_bool(params.get("voice_enabled"))),
            ("voice model", params.get("voice_model", "-")),
            ("voice language", params.get("voice_language_code", "-")),
            (
                "output video",
                outputs.get("video", "-"),
            ),
            ("silent video", outputs.get("video_silent", "-")),
            ("voice audio", outputs.get("voice_audio", "-")),
        ]
    )
    overview_panel = (
        "<article class=\"panel\">"
        "<h2>Run Overview</h2>"
        f"<div class=\"kv\">{overview_kv}</div>"
        "</article>"
    )

    selected_kv = _render_kv_rows(
        [
            ("candidate id", selected.get("candidate_id", "-")),
            ("pass", _fmt_bool(selected.get("pass_fail"))),
            ("aggregate score", _fmt_score(selected.get("aggregate_score"))),
            ("path", selected.get("path", "-")),
            ("voice applied", _fmt_bool(selected.get("voice_applied"))),
        ]
    )
    selected_panel = (
        "<article class=\"panel\">"
        "<h2>Selected Candidate</h2>"
        f"<div class=\"kv\">{selected_kv}</div>"
        "</article>"
    )

    score_panel = (
        "<article class=\"panel\">"
        "<h2>Gate Scores</h2>"
        "<div class=\"score-grid\">"
        f"{_render_score_rows([('semantic', semantic_score), ('temporal', temporal_score), ('technical', technical_score), ('aggregate', selected_score)], qa_threshold)}"
        "</div>"
        "</article>"
    )

    attempt_items = "".join(
        "<li>"
        f"attempt {_esc(item.get('attempt', '-'))}: best {_esc(item.get('best_candidate_id', '-'))}, "
        f"score {_esc(_fmt_score(item.get('best_score')))}, pass {_esc(_fmt_bool(item.get('pass_fail')))}"
        "</li>"
        for item in attempts[:20]
        if isinstance(item, dict)
    ) or "<li>no attempts recorded</li>"

    attempts_panel = (
        "<article class=\"panel\">"
        "<h2>Attempt Timeline</h2>"
        f"<ul class=\"list\">{attempt_items}</ul>"
        "</article>"
    )

    candidate_rows: list[str] = []
    for item in candidates[:60]:
        if not isinstance(item, dict):
            continue
        qa_data = item.get("qa", {}) if isinstance(item.get("qa"), dict) else {}
        candidate_checks = qa_data.get("technical_checks", {})
        if isinstance(candidate_checks, dict) and candidate_checks:
            candidate_technical = 1.0 if all(bool(v) for v in candidate_checks.values()) else 0.0
        else:
            candidate_technical = None
        artifacts = qa_data.get("artifact_flags", [])
        artifact_count = len(artifacts) if isinstance(artifacts, list) else 0
        endpoint = "-"
        response_obj = item.get("response")
        if isinstance(response_obj, dict):
            endpoint = response_obj.get("endpoint", "-")
        pass_fail = item.get("pass_fail")
        if pass_fail is True:
            pass_css = "badge-ok"
            pass_text = "pass"
        elif pass_fail is False:
            pass_css = "badge-fail"
            pass_text = "fail"
        else:
            pass_css = "badge-neutral"
            pass_text = "-"
        candidate_rows.append(
            "<tr>"
            f"<td class=\"mono\">{_esc(item.get('candidate_id', '-'))}</td>"
            f"<td>{_esc(_fmt_score(item.get('aggregate_score')))}</td>"
            f"<td>{_esc(_fmt_score(qa_data.get('semantic_score')))}</td>"
            f"<td>{_esc(_fmt_score(qa_data.get('temporal_score')))}</td>"
            f"<td>{_esc(_fmt_score(candidate_technical))}</td>"
            f"<td><span class=\"inline-pill {pass_css}\">{_esc(pass_text)}</span></td>"
            f"<td>{_esc(artifact_count)}</td>"
            f"<td class=\"mono\">{_esc(endpoint)}</td>"
            f"<td>{_esc(_fmt_bytes(item.get('bytes')))}</td>"
            "</tr>"
        )
    candidate_table = "".join(candidate_rows) or "<tr><td colspan=\"9\">no candidates</td></tr>"

    candidates_panel = (
        "<article class=\"panel\">"
        "<h2>Candidates</h2>"
        "<table class=\"table-candidates\">"
        "<thead><tr><th>ID</th><th>Score</th><th>Sem</th><th>Temp</th><th>Tech</th><th>Pass</th><th>Artifacts</th><th>Endpoint</th><th>Size</th></tr></thead>"
        f"<tbody>{candidate_table}</tbody>"
        "</table>"
        "</article>"
    )

    reason_items = "".join(f"<li>{_esc(reason)}</li>" for reason in qa_reasons[:10]) or "<li>none</li>"
    reasons_panel = (
        "<article class=\"panel\">"
        "<h2>QA Reasons</h2>"
        f"<ul class=\"list\">{reason_items}</ul>"
        "</article>"
    )

    error_items = "".join(f"<li>{_esc(item)}</li>" for item in errors) or "<li>none</li>"
    errors_panel = (
        "<article class=\"panel\">"
        "<h2>Errors</h2>"
        f"<ul class=\"list\">{error_items}</ul>"
        "</article>"
    )

    return _dashboard_shell(
        title="NVIDIA Video Forge Run Dashboard",
        subtitle="Visual diagnostics for generation, QA gating, and candidate selection.",
        badge=str(manifest.get("status", "unknown")),
        cards_html=cards,
        sections_html=preview_panel + score_panel + overview_panel + selected_panel + attempts_panel + candidates_panel + reasons_panel + errors_panel,
    )


def _probe_recommendations(
    *,
    results: list[dict[str, Any]],
    success: dict[str, Any] | None,
    dry_run: bool,
) -> list[str]:
    if dry_run:
        return [
            "Dry-run validates routing and payload construction only; it does not confirm model entitlement or live artifact decoding.",
            "Run a live probe with a small request budget to validate account access and payload compatibility.",
        ]

    classes = Counter(
        str(item.get("classification", "other"))
        for item in results
        if isinstance(item, dict)
    )
    notes: list[str] = []
    if success:
        notes.append(
            "At least one route and payload contract worked. Pin the success endpoint with --nim-endpoint when strict reproducibility is required."
        )
    else:
        notes.append(
            "No successful probe result. Keep --endpoint-strategy profile_fallback and contract fallback enabled while debugging account compatibility."
        )
    if classes.get("auth_or_scope", 0) > 0:
        notes.append("Auth or scope failures detected. Verify NVIDIA_API_KEY entitlement for the selected model family.")
    if classes.get("rate_limited", 0) > 0:
        notes.append("Rate limiting detected. Reduce parallel pressure and tune --http-retries plus --max-request-attempts.")
    if classes.get("endpoint_not_found", 0) > 0:
        notes.append("404 endpoint-not-found responses detected. Override to your account-enabled route via --nim-endpoint.")
    if classes.get("path_likely_valid", 0) > 0 and not success:
        notes.append("Path looks reachable but payload/model contract still fails. Keep payload fallback enabled and re-check transfer vs predict profile choice.")
    if classes.get("budget_exhausted", 0) > 0:
        notes.append("Probe budget exhausted. Increase --max-request-attempts for deeper diagnostics.")
    return notes[:6]


def _render_probe_dashboard_html(summary: dict[str, Any]) -> str:
    results = summary.get("results", []) if isinstance(summary.get("results"), list) else []
    success = summary.get("success") if isinstance(summary.get("success"), dict) else None
    dry_run = bool(summary.get("dry_run"))
    class_counts = Counter(
        str(item.get("classification", "other"))
        for item in results
        if isinstance(item, dict)
    )
    status_counts = Counter(
        str(item.get("status", "0"))
        for item in results
        if isinstance(item, dict)
    )
    ok_count = class_counts.get("ok", 0)
    dry_count = class_counts.get("dry_run", 0)
    success_count = ok_count + (dry_count if dry_run else 0)
    fail_count = max(0, len(results) - success_count)

    cards = _render_cards(
        [
            ("Run ID", summary.get("run_id", "-")),
            ("Model", summary.get("model_profile", "-")),
            ("Requests", summary.get("request_attempts", "-")),
            ("Endpoints", len(summary.get("endpoint_candidates", []) if isinstance(summary.get("endpoint_candidates"), list) else [])),
            ("Successful checks", success_count),
            ("Failed checks", fail_count),
            ("Dry run", _fmt_bool(dry_run)),
        ]
    )

    endpoint_list = summary.get("endpoint_candidates", [])
    endpoint_items = "".join(f"<li class=\"mono\">{_esc(item)}</li>" for item in endpoint_list) if isinstance(endpoint_list, list) else ""
    if not endpoint_items:
        endpoint_items = "<li>none</li>"

    probe_overview_kv = _render_kv_rows(
        [
            ("endpoint strategy", summary.get("endpoint_strategy", "-")),
            ("model profile", summary.get("model_profile", "-")),
            ("contract fallback", _fmt_bool(summary.get("contract_fallback"))),
            ("dry run", _fmt_bool(dry_run)),
            ("success", _fmt_bool(bool(success))),
            ("first success endpoint", success.get("endpoint", "-") if success else "-"),
            ("first success variant", success.get("request_variant_id", "-") if success else "-"),
        ]
    )
    overview_panel = (
        "<article class=\"panel\">"
        "<h2>Probe Overview</h2>"
        f"<div class=\"kv\">{probe_overview_kv}</div>"
        "</article>"
    )

    endpoints_panel = (
        "<article class=\"panel\">"
        "<h2>Endpoint Candidates</h2>"
        f"<ul class=\"list\">{endpoint_items}</ul>"
        "</article>"
    )

    count_chips = "".join(
        f"<span class=\"chip {_badge_class(name)}\"><span>{_esc(name)}</span><strong>{count}</strong></span>"
        for name, count in class_counts.most_common()
    ) or "<span class=\"chip badge-neutral\">none</span>"
    class_panel = (
        "<article class=\"panel\">"
        "<h2>Classification Mix</h2>"
        f"<div class=\"chips\">{count_chips}</div>"
        "</article>"
    )

    status_chips = "".join(
        f"<span class=\"chip {_badge_class(code)}\"><span>HTTP {code}</span><strong>{count}</strong></span>"
        for code, count in sorted(status_counts.items())
    ) or "<span class=\"chip badge-neutral\">none</span>"
    status_panel = (
        "<article class=\"panel\">"
        "<h2>Status Mix</h2>"
        f"<div class=\"chips\">{status_chips}</div>"
        "</article>"
    )

    recommendation_items = "".join(
        f"<li>{_esc(note)}</li>"
        for note in _probe_recommendations(results=results, success=success, dry_run=dry_run)
    ) or "<li>none</li>"
    recommendation_panel = (
        "<article class=\"panel\">"
        "<h2>Recommendations</h2>"
        f"<ul class=\"list\">{recommendation_items}</ul>"
        "</article>"
    )

    result_rows: list[str] = []
    for item in results[:120]:
        if not isinstance(item, dict):
            continue
        payload_summary = item.get("payload_summary", {})
        payload_keys = "-"
        if isinstance(payload_summary, dict):
            payload_keys = ",".join(str(k) for k in payload_summary.keys()) or "-"
        error_text = _short_text(item.get("error", ""), 180)
        result_rows.append(
            "<tr>"
            f"<td class=\"mono\">{_esc(item.get('endpoint_index', '-'))}:{_esc(item.get('request_variant_id', '-'))}</td>"
            f"<td class=\"mono\">{_esc(item.get('status', '-'))}</td>"
            f"<td><span class=\"badge {_badge_class(str(item.get('classification', '-')))}\">{_esc(item.get('classification', '-'))}</span></td>"
            f"<td class=\"mono\">{_esc(payload_keys)}</td>"
            f"<td class=\"mono\">{_esc(item.get('endpoint', '-'))}</td>"
            f"<td>{_esc(error_text)}</td>"
            "</tr>"
        )
    result_table = "".join(result_rows) or "<tr><td colspan=\"6\">no probe results</td></tr>"

    results_panel = (
        "<article class=\"panel\">"
        "<h2>Probe Results</h2>"
        "<table class=\"table-probe\">"
        "<thead><tr><th>Variant</th><th>Status</th><th>Classification</th><th>Payload</th><th>Endpoint</th><th>Error</th></tr></thead>"
        f"<tbody>{result_table}</tbody>"
        "</table>"
        "</article>"
    )

    if dry_run:
        badge = "dry_run"
    else:
        badge = "success" if success else "failed"
    return _dashboard_shell(
        title="NVIDIA Video Forge Probe Dashboard",
        subtitle="Route and payload-contract diagnostics for hosted NVIDIA endpoints.",
        badge=badge,
        cards_html=cards,
        sections_html=overview_panel + class_panel + status_panel + endpoints_panel + recommendation_panel + results_panel,
    )


def _try_write_generate_dashboard(
    *,
    manifest: dict[str, Any],
    qa_report: dict[str, Any],
    path: Path,
) -> bool:
    try:
        html_text = _render_generate_dashboard_html(manifest, qa_report)
        _write_text(path, html_text)
        return True
    except Exception as exc:  # pragma: no cover - non-critical report path
        _log(f"Could not write generate dashboard ({path}): {exc}")
        return False


def _try_write_probe_dashboard(*, summary: dict[str, Any], path: Path) -> bool:
    try:
        html_text = _render_probe_dashboard_html(summary)
        _write_text(path, html_text)
        return True
    except Exception as exc:  # pragma: no cover - non-critical report path
        _log(f"Could not write probe dashboard ({path}): {exc}")
        return False


def _default_out_dir(run_id: str) -> Path:
    return Path.cwd() / "output" / "nvidia-video-forge" / run_id


def _validate_generation_args(args: argparse.Namespace) -> None:
    if not args.hosted:
        _die("This skill supports only hosted NVIDIA NIM API. Use --hosted.")
    if args.http_retries < 0:
        _die("--http-retries must be >= 0")
    if args.max_request_attempts < 1:
        _die("--max-request-attempts must be >= 1")
    if args.nvcf_poll_seconds < 1:
        _die("--nvcf-poll-seconds must be >= 1")
    if args.pending_backoff_seconds < 0:
        _die("--pending-backoff-seconds must be >= 0")
    if args.pending_backoff_max_seconds < args.pending_backoff_seconds:
        _die("--pending-backoff-max-seconds must be >= --pending-backoff-seconds")
    if args.qa_timeout_seconds < 1:
        _die("--qa-timeout-seconds must be >= 1")
    if args.qa_http_timeout_seconds < 1:
        _die("--qa-http-timeout-seconds must be >= 1")
    if args.qa_ffprobe_timeout_seconds < 1:
        _die("--qa-ffprobe-timeout-seconds must be >= 1")
    if args.qa_ffmpeg_timeout_seconds < 1:
        _die("--qa-ffmpeg-timeout-seconds must be >= 1")
    if args.qa_http_timeout_seconds > args.qa_timeout_seconds:
        _die("--qa-http-timeout-seconds must be <= --qa-timeout-seconds")
    if args.qa_ffprobe_timeout_seconds > args.qa_timeout_seconds:
        _die("--qa-ffprobe-timeout-seconds must be <= --qa-timeout-seconds")
    if args.qa_ffmpeg_timeout_seconds > args.qa_timeout_seconds:
        _die("--qa-ffmpeg-timeout-seconds must be <= --qa-timeout-seconds")
    if args.voice_sample_rate < 8000 or args.voice_sample_rate > 96000:
        _die("--voice-sample-rate must be in range 8000..96000")
    if args.judge_max_iterations < 1:
        _die("--judge-max-iterations must be >= 1")
    if args.judge_max_minutes < 1:
        _die("--judge-max-minutes must be >= 1")
    if args.crawl_max_pages < 1:
        _die("--crawl-max-pages must be >= 1")
    if args.crawl_max_depth < 0:
        _die("--crawl-max-depth must be >= 0")
    if args.youtube_source_frame_count < 1:
        _die("--youtube-source-frame-count must be >= 1")
    if args.google_service_account_json:
        sa_path = _normalize_path(args.google_service_account_json)
        if not sa_path.exists():
            _die(f"Google service account JSON not found: {sa_path}")


def _manifest_attempt_record(
    *,
    attempt: int,
    prompt: str,
    candidates: list[dict[str, Any]],
    best_candidate: dict[str, Any] | None,
    pass_fail: bool | None,
    correction_notes: str,
    awaiting_judge: bool,
    judge_mode: str,
    bridge_paths: dict[str, str] | None,
) -> dict[str, Any]:
    return {
        "attempt": attempt,
        "prompt": prompt,
        "candidate_ids": [str(item.get("candidate_id")) for item in candidates],
        "best_candidate_id": str(best_candidate.get("candidate_id")) if best_candidate else None,
        "best_score": _to_float_or_none(best_candidate.get("aggregate_score")) if best_candidate else None,
        "pass_fail": pass_fail,
        "correction_notes": correction_notes,
        "awaiting_judge": awaiting_judge,
        "judge_mode": judge_mode,
        "bridge": bridge_paths or None,
    }


def _select_required_qa_fields(
    *,
    selected_candidate: dict[str, Any],
    threshold: float,
    model_profile: str,
) -> dict[str, Any]:
    qa_report = selected_candidate.get("qa")
    if not isinstance(qa_report, dict):
        qa_report = {}
    return {
        "technical_checks": qa_report.get("technical_checks", {}),
        "semantic_score": qa_report.get("semantic_score", 0.0),
        "temporal_score": qa_report.get("temporal_score", 0.0),
        "branding_score": qa_report.get("branding_score", qa_report.get("semantic_score", 0.0)),
        "instruction_score": qa_report.get("instruction_score", qa_report.get("semantic_score", 0.0)),
        "artifact_flags": qa_report.get("artifact_flags", []),
        "pass_fail": bool(qa_report.get("pass_fail")),
        "reasons": qa_report.get("reasons", []),
        "fix_instructions": qa_report.get("fix_instructions", []),
        "candidate_id": selected_candidate["candidate_id"],
        "aggregate_score": selected_candidate.get("aggregate_score"),
        "threshold": threshold,
        "model_profile": model_profile,
    }


def _write_ingest_artifacts(
    *,
    merged_inputs: dict[str, Any],
    base_out: Path,
    target_duration_seconds: int,
    remix_mode: str,
    compliance_mode: str,
    crawl_max_pages: int,
    crawl_max_depth: int,
    google_service_account_json: str,
    google_api_key_env: str,
    youtube_include_source_media: bool,
    youtube_source_frame_count: int,
    dry_run: bool,
) -> dict[str, Any]:
    asset_graph = build_asset_graph(
        input_images=merged_inputs["input_images"],
        input_videos=merged_inputs["input_videos"],
        input_audios=merged_inputs["input_audios"],
        input_product_images=merged_inputs["input_product_images"],
        input_person_images=merged_inputs["input_person_images"],
        input_urls=merged_inputs["input_urls"],
        input_blog_urls=merged_inputs["input_blog_urls"],
        input_youtube_urls=merged_inputs["input_youtube_urls"],
        style_url=merged_inputs["style_url"],
        brand_url=merged_inputs["brand_url"],
        brand_logo=merged_inputs["brand_logo"],
        overlay_templates=merged_inputs["overlay_templates"],
        overlay_files=merged_inputs["overlay_files"],
        crawl_max_pages=crawl_max_pages,
        crawl_max_depth=crawl_max_depth,
        compliance_mode=compliance_mode,
        youtube_source_root=base_out / "sources" / "youtube",
        google_service_account_json=google_service_account_json,
        google_api_key_env=google_api_key_env,
        youtube_include_source_media=youtube_include_source_media,
        youtube_source_frame_count=youtube_source_frame_count,
        dry_run=dry_run,
    )
    source_paths = write_asset_outputs(asset_graph, base_out)

    brand_profile = derive_brand_profile(
        asset_graph=asset_graph,
        brand_url=merged_inputs["brand_url"],
        style_url=merged_inputs["style_url"],
        brand_logo=merged_inputs["brand_logo"],
    )
    brand_profile_path = write_brand_profile(brand_profile, base_out)

    asr_plan: dict[str, Any] | None = None
    asr_plan_path: str | None = None
    if merged_inputs["input_audios"]:
        asr_plan = build_asr_plan(
            audio_paths=merged_inputs["input_audios"],
            target_duration_seconds=target_duration_seconds,
            dry_run=dry_run,
        )
        asr_plan_path = write_asr_outputs(asr_plan, base_out)

    overlay_plan = build_overlay_plan(
        overlay_templates=merged_inputs["overlay_templates"],
        overlay_files=merged_inputs["overlay_files"],
    )
    overlay_plan_path = write_overlay_plan(overlay_plan, base_out)

    planner_context = _build_prompt_planner_context(
        asset_graph=asset_graph,
        brand_profile=brand_profile,
        asr_plan=asr_plan,
        remix_mode=remix_mode,
        target_duration_seconds=target_duration_seconds,
    )

    return {
        "asset_graph": asset_graph,
        "asset_graph_path": source_paths["asset_graph"],
        "source_report_path": source_paths["source_report"],
        "brand_profile": brand_profile,
        "brand_profile_path": brand_profile_path,
        "asr_plan": asr_plan,
        "asr_plan_path": asr_plan_path,
        "overlay_plan": overlay_plan,
        "overlay_plan_path": overlay_plan_path,
        "planner_context": planner_context,
    }


def _cmd_ingest(args: argparse.Namespace) -> int:
    if args.crawl_max_pages < 1:
        _die("--crawl-max-pages must be >= 1")
    if args.crawl_max_depth < 0:
        _die("--crawl-max-depth must be >= 0")
    if args.youtube_source_frame_count < 1:
        _die("--youtube-source-frame-count must be >= 1")
    if args.google_service_account_json:
        sa_path = _normalize_path(args.google_service_account_json)
        if not sa_path.exists():
            _die(f"Google service account JSON not found: {sa_path}")

    merged_inputs = _merge_source_inputs(args)
    run_id = _run_id()
    base_out = _normalize_path(args.out_dir) if args.out_dir else _default_out_dir(run_id)
    base_out.mkdir(parents=True, exist_ok=True)

    artifacts = _write_ingest_artifacts(
        merged_inputs=merged_inputs,
        base_out=base_out,
        target_duration_seconds=args.target_duration_seconds,
        remix_mode=args.remix_mode,
        compliance_mode=args.compliance_mode,
        crawl_max_pages=args.crawl_max_pages,
        crawl_max_depth=args.crawl_max_depth,
        google_service_account_json=args.google_service_account_json,
        google_api_key_env=args.google_api_key_env,
        youtube_include_source_media=bool(args.youtube_include_source_media),
        youtube_source_frame_count=args.youtube_source_frame_count,
        dry_run=bool(args.dry_run),
    )

    print(
        json.dumps(
            {
                "run_id": run_id,
                "status": "completed",
                "out_dir": str(base_out),
                "asset_graph": artifacts["asset_graph_path"],
                "source_report": artifacts["source_report_path"],
                "brand_profile": artifacts["brand_profile_path"],
                "asr_plan": artifacts["asr_plan_path"],
                "overlay_plan": artifacts["overlay_plan_path"],
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


def _build_generation_manifest(
    *,
    run_id: str,
    timestamp: str,
    base_out: Path,
    model_profile: str,
    endpoint_candidates: list[str],
    args: argparse.Namespace,
    merged_inputs: dict[str, Any],
    ingest_artifacts: dict[str, Any],
    input_image: Path | None,
    input_video: Path | None,
    voice_audio: Path | None,
    voice_text: str,
    voice_enabled: bool,
    voice_function_id: str,
    voice_name: str,
    candidate_count: int,
    deadline_epoch: float,
) -> dict[str, Any]:
    manifest_path = base_out / "manifest.json"
    qa_json_path = base_out / "qa_report.json"
    qa_md_path = base_out / "qa_report.md"
    dashboard_path = base_out / args.html_report_name.strip()

    return {
        "run_id": run_id,
        "timestamp": timestamp,
        "runtime_mode": "hosted_nvidia_nim_api",
        "status": RUN_STATE_RUNNING,
        "run_state": {
            "state": RUN_STATE_RUNNING,
            "attempt": 0,
            "started_epoch": time.time(),
            "deadline_epoch": deadline_epoch,
            "max_iterations": args.judge_max_iterations,
            "max_minutes": args.judge_max_minutes,
            "judge_mode": args.judge_mode,
            "chat_bridge_mode": args.chat_bridge_mode,
        },
        "model_profile": model_profile,
        "params": {
            "prompt": args.prompt,
            "planner_context": ingest_artifacts["planner_context"],
            "quality": args.quality,
            "endpoint": endpoint_candidates[0],
            "endpoint_candidates": endpoint_candidates,
            "endpoint_strategy": args.endpoint_strategy,
            "contract_fallback": not args.disable_contract_fallback,
            "hosted": True,
            "num_candidates": candidate_count,
            "max_retries": args.max_retries,
            "http_retries": args.http_retries,
            "max_request_attempts": args.max_request_attempts,
            "seed": args.seed,
            "timeout": args.timeout,
            "nvcf_poll_seconds": _bounded_nvcf_poll_seconds(args.nvcf_poll_seconds),
            "pending_backoff_seconds": args.pending_backoff_seconds,
            "pending_backoff_max_seconds": args.pending_backoff_max_seconds,
            "qa_timeout_seconds": args.qa_timeout_seconds,
            "qa_http_timeout_seconds": args.qa_http_timeout_seconds,
            "qa_ffprobe_timeout_seconds": args.qa_ffprobe_timeout_seconds,
            "qa_ffmpeg_timeout_seconds": args.qa_ffmpeg_timeout_seconds,
            "qa_disable_opencv_fallback": bool(args.qa_disable_opencv_fallback),
            "qa_threshold": args.qa_threshold,
            "judge_model": args.judge_model,
            "judge_model_alias": args.judge_model_alias,
            "judge_mode": args.judge_mode,
            "judge_max_iterations": args.judge_max_iterations,
            "judge_max_minutes": args.judge_max_minutes,
            "chat_bridge_mode": args.chat_bridge_mode,
            "compliance_mode": args.compliance_mode,
            "crawl_max_pages": args.crawl_max_pages,
            "crawl_max_depth": args.crawl_max_depth,
            "google_service_account_json": str(_normalize_path(args.google_service_account_json))
            if args.google_service_account_json
            else "",
            "google_api_key_env": args.google_api_key_env,
            "youtube_include_source_media": bool(args.youtube_include_source_media),
            "youtube_source_frame_count": args.youtube_source_frame_count,
            "remix_mode": args.remix_mode,
            "target_duration_seconds": args.target_duration_seconds,
            "input_image": str(input_image) if input_image else None,
            "input_video": str(input_video) if input_video else None,
            "input_images": _serialize_path_list(merged_inputs["input_images"]),
            "input_videos": _serialize_path_list(merged_inputs["input_videos"]),
            "input_audios": _serialize_path_list(merged_inputs["input_audios"]),
            "input_product_images": _serialize_path_list(merged_inputs["input_product_images"]),
            "input_person_images": _serialize_path_list(merged_inputs["input_person_images"]),
            "input_urls": merged_inputs["input_urls"],
            "input_blog_urls": merged_inputs["input_blog_urls"],
            "input_youtube_urls": merged_inputs["input_youtube_urls"],
            "style_url": merged_inputs["style_url"],
            "brand_url": merged_inputs["brand_url"],
            "brand_logo": merged_inputs["brand_logo"],
            "overlay_templates": merged_inputs["overlay_templates"],
            "overlay_files": _serialize_path_list(merged_inputs["overlay_files"]),
            "voice_enabled": voice_enabled,
            "voice_audio": str(voice_audio) if voice_audio else None,
            "voice_text": voice_text if voice_text else None,
            "voice_model": args.voice_model if voice_text else None,
            "voice_function_id": voice_function_id if voice_text else None,
            "voice_language_code": args.voice_language_code if voice_text else None,
            "voice_name": voice_name if voice_name else None,
            "voice_sample_rate": args.voice_sample_rate if voice_text else None,
            "voice_server": args.voice_server if voice_text else None,
            "voice_gain_db": args.voice_gain_db if voice_enabled else None,
            "voice_cache_dir": str(_normalize_path(args.voice_cache_dir)) if voice_text else None,
            "skip_voice_bootstrap": bool(args.skip_voice_bootstrap) if voice_text else None,
            "api_key_env": args.api_key_env,
            "judge_base_url": args.judge_base_url,
            "dry_run": bool(args.dry_run),
        },
        "attempts": [],
        "pending_judge": None,
        "candidates": [],
        "selected_candidate": None,
        "outputs": {
            "video": None,
            "video_silent": None,
            "voice_audio": None,
            "manifest": str(manifest_path),
            "qa_report_json": str(qa_json_path),
            "qa_report_md": str(qa_md_path),
            "dashboard_html": str(dashboard_path) if not args.no_html_report else None,
            "asset_graph": ingest_artifacts["asset_graph_path"],
            "source_report": ingest_artifacts["source_report_path"],
            "brand_profile": ingest_artifacts["brand_profile_path"],
            "asr_plan": ingest_artifacts["asr_plan_path"],
            "overlay_plan": ingest_artifacts["overlay_plan_path"],
        },
        "errors": [],
    }


def _cmd_generate(args: argparse.Namespace) -> int:
    _validate_generation_args(args)
    if not args.html_report_name.strip():
        _die("--html-report-name must not be empty")

    merged_inputs = _merge_source_inputs(args)
    input_image = merged_inputs["primary_image"]
    input_video = merged_inputs["primary_video"]
    if input_image and input_video:
        _die("Use image or video as primary generation reference, not both")

    voice_audio = _normalize_path(args.voice_audio) if args.voice_audio else None
    voice_text = args.voice_text.strip()
    voice_enabled = bool(voice_audio or voice_text)
    if voice_audio and not voice_audio.exists():
        _die(f"Voice audio not found: {voice_audio}")
    if voice_audio and voice_text:
        _die("Use either --voice-audio or --voice-text, not both")
    if voice_enabled and not args.voice_server.strip():
        _die("--voice-server must not be empty when voice is enabled")

    voice_function_id = ""
    if voice_text:
        voice_function_id = _resolve_voice_function_id(args.voice_model, args.voice_function_id)
    voice_name = _resolve_voice_name(args.voice_model, args.voice_name) if voice_text else ""

    has_reference = bool(input_image or input_video)
    model_profile = _resolve_model_profile(args.model_profile, has_reference)
    endpoint_candidates = _endpoint_variants(
        model_profile=model_profile,
        explicit_endpoint=args.nim_endpoint.strip(),
        strategy=args.endpoint_strategy,
        has_reference=has_reference,
    )
    if not endpoint_candidates:
        _die("No endpoint candidates resolved for this run")
    for endpoint_candidate in endpoint_candidates:
        _validate_hosted_url(endpoint_candidate)

    if args.judge_mode == "nvidia_qa":
        _validate_hosted_url(args.judge_base_url)
    elif args.judge_mode in {"openai_api", "dual"}:
        _validate_https_url(args.judge_base_url)

    candidate_count = args.num_candidates
    if candidate_count is None:
        candidate_count = _default_candidate_count(args.quality)
    if candidate_count < 1:
        _die("--num-candidates must be >= 1")

    api_key = os.getenv(args.api_key_env, "").strip()
    if not api_key and not args.dry_run:
        _die(
            f"Missing API key env var: {args.api_key_env}. "
            "Set it before running live hosted NVIDIA requests."
        )

    run_id = _run_id()
    timestamp = _ts()
    run_started = time.time()
    deadline_epoch = _run_deadline_seconds(started_epoch=run_started, max_minutes=args.judge_max_minutes)
    base_out = _normalize_path(args.out_dir) if args.out_dir else _default_out_dir(run_id)
    base_out.mkdir(parents=True, exist_ok=True)
    manifest_path = base_out / "manifest.json"
    qa_json_path = base_out / "qa_report.json"
    qa_md_path = base_out / "qa_report.md"
    dashboard_path = base_out / args.html_report_name.strip()

    ingest_artifacts = _write_ingest_artifacts(
        merged_inputs=merged_inputs,
        base_out=base_out,
        target_duration_seconds=args.target_duration_seconds,
        remix_mode=args.remix_mode,
        compliance_mode=args.compliance_mode,
        crawl_max_pages=args.crawl_max_pages,
        crawl_max_depth=args.crawl_max_depth,
        google_service_account_json=args.google_service_account_json,
        google_api_key_env=args.google_api_key_env,
        youtube_include_source_media=bool(args.youtube_include_source_media),
        youtube_source_frame_count=args.youtube_source_frame_count,
        dry_run=bool(args.dry_run),
    )
    source_evidence = _youtube_source_evidence_from_asset_graph(ingest_artifacts["asset_graph"])

    manifest = _build_generation_manifest(
        run_id=run_id,
        timestamp=timestamp,
        base_out=base_out,
        model_profile=model_profile,
        endpoint_candidates=endpoint_candidates,
        args=args,
        merged_inputs=merged_inputs,
        ingest_artifacts=ingest_artifacts,
        input_image=input_image,
        input_video=input_video,
        voice_audio=voice_audio,
        voice_text=voice_text,
        voice_enabled=voice_enabled,
        voice_function_id=voice_function_id,
        voice_name=voice_name,
        candidate_count=candidate_count,
        deadline_epoch=deadline_epoch,
    )

    prompt_base = args.prompt.strip()
    planner_context = ingest_artifacts["planner_context"]
    if planner_context:
        prompt_base = f"{prompt_base}\n\n{planner_context}"

    nvcf_asset_cache: dict[str, dict[str, Any]] = {}
    all_candidates: list[dict[str, Any]] = []
    correction_notes = ""
    attempt = 1
    selected_candidate: dict[str, Any] | None = None
    selected_fields: dict[str, Any] = {}

    try:
        while not _is_budget_exhausted(
            attempt=attempt,
            max_iterations=args.judge_max_iterations,
            now_epoch=time.time(),
            deadline_epoch=deadline_epoch,
        ):
            attempt_prompt = _build_prompt(prompt_base, correction_notes, attempt)
            _log(f"Attempt {attempt}: generating {candidate_count} candidate(s)")
            attempt_candidates = _generate_attempt_candidates(
                attempt=attempt,
                attempt_prompt=attempt_prompt,
                candidate_count=candidate_count,
                seed=args.seed,
                base_out=base_out,
                model_profile=model_profile,
                quality=args.quality,
                input_image=input_image,
                input_video=input_video,
                endpoint_candidates=endpoint_candidates,
                disable_contract_fallback=bool(args.disable_contract_fallback),
                timeout=args.timeout,
                http_retries=args.http_retries,
                max_request_attempts=args.max_request_attempts,
                nvcf_poll_seconds=args.nvcf_poll_seconds,
                pending_backoff_seconds=args.pending_backoff_seconds,
                pending_backoff_max_seconds=args.pending_backoff_max_seconds,
                api_key=api_key,
                dry_run=bool(args.dry_run),
                nvcf_asset_cache=nvcf_asset_cache,
            )
            all_candidates.extend(attempt_candidates)
            manifest["candidates"] = all_candidates

            if args.judge_mode == "chat_bridge":
                bridge_paths = create_chat_bridge_package(
                    run_dir=base_out,
                    run_id=run_id,
                    attempt=attempt,
                    prompt=attempt_prompt,
                    judge_model_alias=args.judge_model_alias,
                    threshold=args.qa_threshold,
                    chat_bridge_mode=args.chat_bridge_mode,
                    candidates=attempt_candidates,
                    source_evidence=source_evidence,
                )
                manifest["attempts"].append(
                    _manifest_attempt_record(
                        attempt=attempt,
                        prompt=attempt_prompt,
                        candidates=attempt_candidates,
                        best_candidate=None,
                        pass_fail=None,
                        correction_notes=correction_notes,
                        awaiting_judge=True,
                        judge_mode=args.judge_mode,
                        bridge_paths=bridge_paths,
                    )
                )
                manifest["pending_judge"] = {
                    "attempt": attempt,
                    "prompt": attempt_prompt,
                    "candidate_ids": [item["candidate_id"] for item in attempt_candidates],
                    "threshold": args.qa_threshold,
                    "bridge": bridge_paths,
                }
                manifest["status"] = RUN_STATE_AWAITING_JUDGE
                manifest["run_state"]["state"] = RUN_STATE_AWAITING_JUDGE
                manifest["run_state"]["attempt"] = attempt
                _write_json(manifest_path, manifest)
                print(
                    json.dumps(
                        {
                            "run_id": run_id,
                            "status": RUN_STATE_AWAITING_JUDGE,
                            "out_dir": str(base_out),
                            "manifest": str(manifest_path),
                            "bridge": bridge_paths,
                            "resume_hint": f"video_forge.py resume --run-dir {base_out} --judge-response <path-to-judge_response.json>",
                        },
                        indent=2,
                        sort_keys=True,
                    )
                )
                return 3

            judged_candidates = _judge_attempt_with_qa(
                attempt_candidates=attempt_candidates,
                attempt_prompt=attempt_prompt,
                base_out=base_out,
                judge_model=args.judge_model,
                qa_threshold=args.qa_threshold,
                api_key_env=args.api_key_env,
                judge_base_url=args.judge_base_url,
                qa_timeout_seconds=args.qa_timeout_seconds,
                qa_http_timeout_seconds=args.qa_http_timeout_seconds,
                qa_ffprobe_timeout_seconds=args.qa_ffprobe_timeout_seconds,
                qa_ffmpeg_timeout_seconds=args.qa_ffmpeg_timeout_seconds,
                qa_disable_opencv_fallback=bool(args.qa_disable_opencv_fallback),
                dry_run=bool(args.dry_run),
            )
            best = _best_candidate(judged_candidates)
            pass_fail = bool(best.get("pass_fail"))
            manifest["attempts"].append(
                _manifest_attempt_record(
                    attempt=attempt,
                    prompt=attempt_prompt,
                    candidates=judged_candidates,
                    best_candidate=best,
                    pass_fail=pass_fail,
                    correction_notes=correction_notes,
                    awaiting_judge=False,
                    judge_mode=args.judge_mode,
                    bridge_paths=None,
                )
            )

            if pass_fail:
                selected_candidate = best
                selected_fields = _select_required_qa_fields(
                    selected_candidate=best,
                    threshold=args.qa_threshold,
                    model_profile=model_profile,
                )
                break

            correction_notes = _build_correction_notes(best.get("qa", {}))

            if args.judge_mode == "dual":
                bridge_paths = create_chat_bridge_package(
                    run_dir=base_out,
                    run_id=run_id,
                    attempt=attempt,
                    prompt=attempt_prompt,
                    judge_model_alias=args.judge_model_alias,
                    threshold=args.qa_threshold,
                    chat_bridge_mode=args.chat_bridge_mode,
                    candidates=judged_candidates,
                    source_evidence=source_evidence,
                )
                manifest["pending_judge"] = {
                    "attempt": attempt,
                    "prompt": attempt_prompt,
                    "candidate_ids": [item["candidate_id"] for item in judged_candidates],
                    "threshold": args.qa_threshold,
                    "bridge": bridge_paths,
                }
                manifest["status"] = RUN_STATE_AWAITING_JUDGE
                manifest["run_state"]["state"] = RUN_STATE_AWAITING_JUDGE
                manifest["run_state"]["attempt"] = attempt
                _write_json(manifest_path, manifest)
                print(
                    json.dumps(
                        {
                            "run_id": run_id,
                            "status": RUN_STATE_AWAITING_JUDGE,
                            "out_dir": str(base_out),
                            "manifest": str(manifest_path),
                            "bridge": bridge_paths,
                            "resume_hint": f"video_forge.py resume --run-dir {base_out} --judge-response <path-to-judge_response.json>",
                        },
                        indent=2,
                        sort_keys=True,
                    )
                )
                return 3

            attempt += 1

        if selected_candidate is None and all_candidates:
            selected_candidate = _best_candidate(all_candidates)
            if selected_candidate.get("qa"):
                selected_fields = _select_required_qa_fields(
                    selected_candidate=selected_candidate,
                    threshold=args.qa_threshold,
                    model_profile=model_profile,
                )
            else:
                selected_fields = {
                    "technical_checks": {},
                    "semantic_score": 0.0,
                    "temporal_score": 0.0,
                    "branding_score": 0.0,
                    "instruction_score": 0.0,
                    "artifact_flags": [],
                    "pass_fail": False,
                    "reasons": ["Iteration budget exhausted before QA pass."],
                    "fix_instructions": [],
                    "candidate_id": selected_candidate["candidate_id"],
                    "aggregate_score": selected_candidate.get("aggregate_score"),
                    "threshold": args.qa_threshold,
                    "model_profile": model_profile,
                }

        if not selected_candidate:
            _die("No candidate was produced")

        _write_json(qa_json_path, selected_fields)
        _write_text(
            qa_md_path,
            _qa_report_markdown(selected_fields, selected_candidate["candidate_id"], args.qa_threshold),
        )

        if bool(selected_fields.get("pass_fail")):
            outputs = _apply_voice_and_overlays(
                selected_path=Path(str(selected_candidate["path"])),
                base_out=base_out,
                voice_enabled=voice_enabled,
                voice_audio=voice_audio,
                voice_text=voice_text,
                voice_model=args.voice_model,
                voice_function_id=voice_function_id,
                voice_name=voice_name,
                voice_language_code=args.voice_language_code,
                voice_sample_rate=args.voice_sample_rate,
                voice_server=args.voice_server,
                voice_cache_dir=_normalize_path(args.voice_cache_dir),
                skip_voice_bootstrap=bool(args.skip_voice_bootstrap),
                voice_gain_db=args.voice_gain_db,
                overlay_templates=merged_inputs["overlay_templates"],
                overlay_files=merged_inputs["overlay_files"],
                overlay_plan=ingest_artifacts["overlay_plan"],
                api_key=api_key,
                dry_run=bool(args.dry_run),
            )
            manifest["outputs"]["video"] = outputs["video"]
            manifest["outputs"]["video_silent"] = outputs["video_silent"]
            manifest["outputs"]["voice_audio"] = outputs["voice_audio"]
            if outputs.get("overlay_plan"):
                manifest["outputs"]["overlay_plan"] = outputs["overlay_plan"]
            manifest["status"] = RUN_STATE_COMPLETED
            manifest["run_state"]["state"] = RUN_STATE_COMPLETED
            manifest["selected_candidate"] = {
                "candidate_id": selected_candidate["candidate_id"],
                "path": selected_candidate["path"],
                "aggregate_score": selected_candidate.get("aggregate_score"),
                "pass_fail": True,
                "voice_applied": voice_enabled,
                "voice": outputs.get("voice"),
            }
        else:
            rejected_video = _copy_final_video(Path(str(selected_candidate["path"])), base_out, suffix="rejected")
            manifest["outputs"]["video"] = str(rejected_video)
            manifest["status"] = RUN_STATE_FAILED
            manifest["run_state"]["state"] = RUN_STATE_FAILED
            manifest["selected_candidate"] = {
                "candidate_id": selected_candidate["candidate_id"],
                "path": selected_candidate["path"],
                "aggregate_score": selected_candidate.get("aggregate_score"),
                "pass_fail": False,
                "voice_applied": False,
            }
            manifest["errors"].append("All candidates failed QA/judge threshold")

        if not args.no_html_report:
            if not _try_write_generate_dashboard(
                manifest=manifest,
                qa_report=selected_fields,
                path=dashboard_path,
            ):
                manifest["outputs"]["dashboard_html"] = None

        _write_json(manifest_path, manifest)
        print(
            json.dumps(
                {
                    "run_id": run_id,
                    "status": manifest["status"],
                    "out_dir": str(base_out),
                    "manifest": str(manifest_path),
                    "qa_report": str(qa_json_path),
                    "video": manifest["outputs"]["video"],
                    "dashboard": manifest["outputs"].get("dashboard_html"),
                    "selected_candidate": manifest["selected_candidate"],
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 0 if manifest["status"] == RUN_STATE_COMPLETED else 2

    except PipelineError as exc:
        manifest["status"] = RUN_STATE_FAILED
        manifest["run_state"]["state"] = RUN_STATE_FAILED
        manifest["errors"].append(str(exc))
        manifest["candidates"] = all_candidates
        if not args.no_html_report:
            if not _try_write_generate_dashboard(
                manifest=manifest,
                qa_report={},
                path=dashboard_path,
            ):
                manifest["outputs"]["dashboard_html"] = None
        _write_json(manifest_path, manifest)
        print(f"Error: {exc}", file=sys.stderr)
        return 1


def _find_candidate(manifest: dict[str, Any], candidate_id: str) -> dict[str, Any] | None:
    candidates = manifest.get("candidates", [])
    if not isinstance(candidates, list):
        return None
    for row in candidates:
        if isinstance(row, dict) and str(row.get("candidate_id")) == candidate_id:
            return row
    return None


def _cmd_resume(args: argparse.Namespace) -> int:
    run_dir = _normalize_path(args.run_dir)
    manifest_path = run_dir / "manifest.json"
    if not manifest_path.exists():
        _die(f"Manifest not found: {manifest_path}")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        _die("Manifest must be a JSON object")
    if str(manifest.get("status")) != RUN_STATE_AWAITING_JUDGE:
        _die(f"Run is not awaiting judge. Current status: {manifest.get('status')}")

    pending = manifest.get("pending_judge")
    if not isinstance(pending, dict):
        _die("Manifest is missing pending_judge metadata")
    params = manifest.get("params")
    if not isinstance(params, dict):
        _die("Manifest is missing params object")

    run_id = str(manifest.get("run_id", "")).strip()
    attempt = _safe_int(pending.get("attempt"), 0)
    if attempt < 1:
        _die("Invalid pending attempt in manifest")
    candidate_ids = [str(item) for item in pending.get("candidate_ids", []) if str(item).strip()]
    if not candidate_ids:
        _die("pending_judge has no candidate_ids")
    threshold = _safe_float(pending.get("threshold", params.get("qa_threshold", 0.82)))

    judge_response_path = _normalize_path(args.judge_response)
    if not judge_response_path.exists():
        _die(f"Judge response not found: {judge_response_path}")

    judge_payload = load_bridge_response(judge_response_path)
    normalized = normalize_bridge_response(
        judge_payload,
        run_id=run_id,
        attempt=attempt,
        candidate_ids=candidate_ids,
        threshold=threshold,
    )

    for candidate_id, eval_item in normalized["candidates"].items():
        candidate = _find_candidate(manifest, candidate_id)
        if candidate is None:
            continue
        qa_report = _bridge_candidate_to_qa(
            candidate_eval=eval_item,
            threshold=threshold,
            judge_notes=normalized.get("reasons", []),
        )
        candidate["qa"] = qa_report
        candidate["aggregate_score"] = qa_report.get("aggregate_score")
        candidate["pass_fail"] = bool(qa_report.get("pass_fail"))
        candidate["qa_report"] = str(run_dir / f"{candidate_id}_qa.json")
        _write_json(Path(candidate["qa_report"]), qa_report)

    best_candidate_id = str(normalized.get("best_candidate_id", "")).strip()
    selected_candidate = _find_candidate(manifest, best_candidate_id)
    if selected_candidate is None:
        _die(f"Best candidate not found in manifest: {best_candidate_id}")
    selected_qa = selected_candidate.get("qa")
    if not isinstance(selected_qa, dict):
        _die("Selected candidate missing normalized QA payload after judge resume")

    attempts = manifest.get("attempts")
    if not isinstance(attempts, list):
        attempts = []
        manifest["attempts"] = attempts
    existing_attempt = None
    for row in attempts:
        if isinstance(row, dict) and _safe_int(row.get("attempt"), 0) == attempt:
            existing_attempt = row
            break
    correction_notes = _collect_correction_notes(
        normalized.get("overall_feedback", ""),
        "; ".join(normalized.get("reasons", [])),
        "; ".join(selected_qa.get("fix_instructions", [])),
    )
    if existing_attempt is None:
        attempts.append(
            _manifest_attempt_record(
                attempt=attempt,
                prompt=str(pending.get("prompt", "")),
                candidates=[_find_candidate(manifest, cid) or {} for cid in candidate_ids],
                best_candidate=selected_candidate,
                pass_fail=bool(normalized.get("pass_fail")),
                correction_notes=correction_notes,
                awaiting_judge=False,
                judge_mode=str(params.get("judge_mode", DEFAULT_JUDGE_MODE)),
                bridge_paths=pending.get("bridge") if isinstance(pending.get("bridge"), dict) else None,
            )
        )
    else:
        existing_attempt["best_candidate_id"] = selected_candidate.get("candidate_id")
        existing_attempt["best_score"] = selected_candidate.get("aggregate_score")
        existing_attempt["pass_fail"] = bool(normalized.get("pass_fail"))
        existing_attempt["correction_notes"] = correction_notes
        existing_attempt["awaiting_judge"] = False

    qa_json_path = Path(str(manifest.get("outputs", {}).get("qa_report_json", run_dir / "qa_report.json")))
    qa_md_path = Path(str(manifest.get("outputs", {}).get("qa_report_md", run_dir / "qa_report.md")))
    model_profile = str(manifest.get("model_profile", "auto"))
    required_fields = _select_required_qa_fields(
        selected_candidate=selected_candidate,
        threshold=threshold,
        model_profile=model_profile,
    )

    dry_run = _safe_bool(params.get("dry_run"))
    api_key_env = str(params.get("api_key_env", "NVIDIA_API_KEY"))
    api_key = os.getenv(api_key_env, "").strip()
    if not api_key and not dry_run:
        _die(f"Missing API key env var for resume: {api_key_env}")

    if bool(normalized.get("pass_fail")) and bool(required_fields.get("pass_fail")):
        voice_enabled = _safe_bool(params.get("voice_enabled"))
        voice_audio = _optional_path(params.get("voice_audio"))
        voice_text = str(params.get("voice_text", "")).strip()
        overlay_templates = [str(item).strip() for item in params.get("overlay_templates", []) if str(item).strip()] if isinstance(params.get("overlay_templates"), list) else []
        overlay_files = _manifest_params_paths(params, "overlay_files")
        overlay_plan = build_overlay_plan(
            overlay_templates=overlay_templates,
            overlay_files=overlay_files,
        )
        outputs = _apply_voice_and_overlays(
            selected_path=Path(str(selected_candidate["path"])),
            base_out=run_dir,
            voice_enabled=voice_enabled,
            voice_audio=voice_audio,
            voice_text=voice_text,
            voice_model=str(params.get("voice_model") or "magpie_multilingual"),
            voice_function_id=str(params.get("voice_function_id") or ""),
            voice_name=str(params.get("voice_name") or ""),
            voice_language_code=str(params.get("voice_language_code") or "en-US"),
            voice_sample_rate=_safe_int(params.get("voice_sample_rate"), 44100),
            voice_server=str(params.get("voice_server") or RIVA_SERVER_DEFAULT),
            voice_cache_dir=_normalize_path(str(params.get("voice_cache_dir") or "~/.cache/nvidia-video-forge/riva")),
            skip_voice_bootstrap=_safe_bool(params.get("skip_voice_bootstrap")),
            voice_gain_db=_safe_float(params.get("voice_gain_db", 0.0)),
            overlay_templates=overlay_templates,
            overlay_files=overlay_files,
            overlay_plan=overlay_plan,
            api_key=api_key,
            dry_run=dry_run,
        )
        manifest["outputs"]["video"] = outputs["video"]
        manifest["outputs"]["video_silent"] = outputs["video_silent"]
        manifest["outputs"]["voice_audio"] = outputs["voice_audio"]
        if outputs.get("overlay_plan"):
            manifest["outputs"]["overlay_plan"] = outputs["overlay_plan"]
        manifest["status"] = RUN_STATE_COMPLETED
        manifest["run_state"]["state"] = RUN_STATE_COMPLETED
        manifest["selected_candidate"] = {
            "candidate_id": selected_candidate["candidate_id"],
            "path": selected_candidate["path"],
            "aggregate_score": selected_candidate.get("aggregate_score"),
            "pass_fail": True,
            "voice_applied": voice_enabled,
            "voice": outputs.get("voice"),
        }
        manifest["pending_judge"] = None
        _write_json(qa_json_path, required_fields)
        _write_text(
            qa_md_path,
            _qa_report_markdown(required_fields, selected_candidate["candidate_id"], threshold),
        )
        dashboard_target = manifest.get("outputs", {}).get("dashboard_html")
        if isinstance(dashboard_target, str) and dashboard_target.strip():
            _try_write_generate_dashboard(
                manifest=manifest,
                qa_report=required_fields,
                path=Path(dashboard_target),
            )
        _write_json(manifest_path, manifest)
        print(
            json.dumps(
                {
                    "run_id": run_id,
                    "status": RUN_STATE_COMPLETED,
                    "manifest": str(manifest_path),
                    "qa_report": str(qa_json_path),
                    "video": manifest["outputs"]["video"],
                    "selected_candidate": manifest["selected_candidate"],
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 0

    max_iterations = _safe_int(params.get("judge_max_iterations"), 6)
    max_minutes = _safe_int(params.get("judge_max_minutes"), 45)
    started_epoch = _to_float_or_none(manifest.get("run_state", {}).get("started_epoch")) or time.time()
    deadline_epoch = _to_float_or_none(manifest.get("run_state", {}).get("deadline_epoch")) or _run_deadline_seconds(
        started_epoch=started_epoch,
        max_minutes=max_minutes,
    )
    next_attempt = attempt + 1
    if _is_budget_exhausted(
        attempt=next_attempt,
        max_iterations=max_iterations,
        now_epoch=time.time(),
        deadline_epoch=deadline_epoch,
    ):
        rejected_video = _copy_final_video(Path(str(selected_candidate["path"])), run_dir, suffix="rejected")
        manifest["outputs"]["video"] = str(rejected_video)
        manifest["status"] = RUN_STATE_FAILED
        manifest["run_state"]["state"] = RUN_STATE_FAILED
        manifest["selected_candidate"] = {
            "candidate_id": selected_candidate["candidate_id"],
            "path": selected_candidate["path"],
            "aggregate_score": selected_candidate.get("aggregate_score"),
            "pass_fail": False,
            "voice_applied": False,
        }
        manifest["pending_judge"] = None
        manifest["errors"].append("Judge rejected candidate and iteration budget exhausted.")
        _write_json(qa_json_path, required_fields)
        _write_text(
            qa_md_path,
            _qa_report_markdown(required_fields, selected_candidate["candidate_id"], threshold),
        )
        _write_json(manifest_path, manifest)
        print(
            json.dumps(
                {
                    "run_id": run_id,
                    "status": RUN_STATE_FAILED,
                    "manifest": str(manifest_path),
                    "video": manifest["outputs"]["video"],
                    "selected_candidate": manifest["selected_candidate"],
                },
                indent=2,
                sort_keys=True,
            )
        )
        return 2

    prompt_base = str(params.get("prompt", "")).strip()
    planner_context = str(params.get("planner_context", "")).strip()
    if planner_context:
        prompt_base = f"{prompt_base}\n\n{planner_context}"
    attempt_prompt = _build_prompt(prompt_base, correction_notes, next_attempt)

    input_image = _optional_path(params.get("input_image"))
    input_video = _optional_path(params.get("input_video"))
    endpoint_candidates = [str(item).strip() for item in params.get("endpoint_candidates", []) if str(item).strip()] if isinstance(params.get("endpoint_candidates"), list) else []
    if not endpoint_candidates:
        endpoint_candidates = _endpoint_variants(
            model_profile=str(manifest.get("model_profile", "predict1")),
            explicit_endpoint="",
            strategy=str(params.get("endpoint_strategy", "profile_fallback")),
            has_reference=bool(input_image or input_video),
        )
    candidate_count = _safe_int(params.get("num_candidates"), 1)
    if candidate_count < 1:
        candidate_count = 1

    next_candidates = _generate_attempt_candidates(
        attempt=next_attempt,
        attempt_prompt=attempt_prompt,
        candidate_count=candidate_count,
        seed=_safe_int(params.get("seed"), 0) if params.get("seed") is not None else None,
        base_out=run_dir,
        model_profile=str(manifest.get("model_profile", "predict1")),
        quality=str(params.get("quality", "max")),
        input_image=input_image,
        input_video=input_video,
        endpoint_candidates=endpoint_candidates,
        disable_contract_fallback=not _safe_bool(params.get("contract_fallback", True)),
        timeout=_safe_int(params.get("timeout"), 300),
        http_retries=_safe_int(params.get("http_retries"), 1),
        max_request_attempts=_safe_int(params.get("max_request_attempts"), 40),
        nvcf_poll_seconds=_safe_int(params.get("nvcf_poll_seconds"), 120),
        pending_backoff_seconds=_safe_float(params.get("pending_backoff_seconds", 2.0)),
        pending_backoff_max_seconds=_safe_float(params.get("pending_backoff_max_seconds", 8.0)),
        api_key=api_key,
        dry_run=dry_run,
        nvcf_asset_cache={},
    )
    candidates = manifest.get("candidates")
    if not isinstance(candidates, list):
        candidates = []
        manifest["candidates"] = candidates
    candidates.extend(next_candidates)

    source_evidence: list[dict[str, Any]] = []
    outputs = manifest.get("outputs")
    if isinstance(outputs, dict):
        asset_graph_raw = str(outputs.get("asset_graph", "")).strip()
        if asset_graph_raw:
            asset_graph_path = _normalize_path(asset_graph_raw)
            if asset_graph_path.exists():
                try:
                    source_evidence = _youtube_source_evidence_from_asset_graph(
                        _load_json_object(asset_graph_path)
                    )
                except Exception:
                    source_evidence = []

    bridge_paths = create_chat_bridge_package(
        run_dir=run_dir,
        run_id=run_id,
        attempt=next_attempt,
        prompt=attempt_prompt,
        judge_model_alias=str(params.get("judge_model_alias", DEFAULT_JUDGE_MODEL_ALIAS)),
        threshold=threshold,
        chat_bridge_mode=str(params.get("chat_bridge_mode", "agent_resume")),
        candidates=next_candidates,
        source_evidence=source_evidence,
    )
    attempts.append(
        _manifest_attempt_record(
            attempt=next_attempt,
            prompt=attempt_prompt,
            candidates=next_candidates,
            best_candidate=None,
            pass_fail=None,
            correction_notes=correction_notes,
            awaiting_judge=True,
            judge_mode=str(params.get("judge_mode", DEFAULT_JUDGE_MODE)),
            bridge_paths=bridge_paths,
        )
    )
    manifest["pending_judge"] = {
        "attempt": next_attempt,
        "prompt": attempt_prompt,
        "candidate_ids": [item["candidate_id"] for item in next_candidates],
        "threshold": threshold,
        "bridge": bridge_paths,
    }
    manifest["status"] = RUN_STATE_AWAITING_JUDGE
    manifest["run_state"]["state"] = RUN_STATE_AWAITING_JUDGE
    manifest["run_state"]["attempt"] = next_attempt
    _write_json(manifest_path, manifest)

    print(
        json.dumps(
            {
                "run_id": run_id,
                "status": RUN_STATE_AWAITING_JUDGE,
                "manifest": str(manifest_path),
                "bridge": bridge_paths,
                "resume_hint": f"video_forge.py resume --run-dir {run_dir} --judge-response <path-to-judge_response.json>",
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 3


def _cmd_qa(args: argparse.Namespace) -> int:
    _validate_hosted_url(args.base_url)
    if args.timeout_seconds < 1:
        _die("--timeout-seconds must be >= 1")
    if args.http_timeout_seconds < 1:
        _die("--http-timeout-seconds must be >= 1")
    if args.ffprobe_timeout_seconds < 1:
        _die("--ffprobe-timeout-seconds must be >= 1")
    if args.ffmpeg_timeout_seconds < 1:
        _die("--ffmpeg-timeout-seconds must be >= 1")
    if args.http_timeout_seconds > args.timeout_seconds:
        _die("--http-timeout-seconds must be <= --timeout-seconds")
    if args.ffprobe_timeout_seconds > args.timeout_seconds:
        _die("--ffprobe-timeout-seconds must be <= --timeout-seconds")
    if args.ffmpeg_timeout_seconds > args.timeout_seconds:
        _die("--ffmpeg-timeout-seconds must be <= --timeout-seconds")

    qa_script = _qa_script_path()
    if not qa_script.exists():
        _die(f"QA script not found: {qa_script}")

    cmd = [
        sys.executable,
        str(qa_script),
        "--video",
        args.video,
        "--prompt",
        args.prompt,
        "--judge-model",
        args.judge_model,
        "--threshold",
        str(args.threshold),
        "--base-url",
        args.base_url,
        "--api-key-env",
        args.api_key_env,
        "--timeout",
        str(args.http_timeout_seconds),
        "--ffprobe-timeout-seconds",
        str(args.ffprobe_timeout_seconds),
        "--ffmpeg-timeout-seconds",
        str(args.ffmpeg_timeout_seconds),
    ]
    if args.disable_opencv_fallback:
        cmd.append("--disable-opencv-fallback")
    if args.soft_fail:
        cmd.append("--soft-fail")
    if args.json_out:
        cmd.extend(["--json-out", args.json_out])
    if args.dry_run:
        cmd.append("--dry-run")

    try:
        proc = subprocess.run(cmd, text=True, capture_output=True, timeout=args.timeout_seconds)
    except subprocess.TimeoutExpired as exc:
        _die(
            "QA wrapper command timed out after "
            f"{args.timeout_seconds}s. Partial output: "
            f"{(exc.stdout or '').strip() or (exc.stderr or '').strip() or '<empty>'}"
        )
    if proc.stdout:
        print(proc.stdout.rstrip())
    if proc.stderr:
        print(proc.stderr.rstrip(), file=sys.stderr)

    if args.schema_profile == "bridge":
        report_obj: dict[str, Any] | None = None
        if args.json_out:
            out_path = _normalize_path(args.json_out)
            if out_path.exists():
                try:
                    payload = json.loads(out_path.read_text(encoding="utf-8"))
                    if isinstance(payload, dict):
                        report_obj = payload
                except json.JSONDecodeError as exc:
                    _die(f"Invalid QA JSON for bridge profile: {exc}")
        if report_obj is None and proc.stdout.strip():
            try:
                payload = json.loads(proc.stdout)
                if isinstance(payload, dict):
                    report_obj = payload
            except json.JSONDecodeError:
                report_obj = None
        if report_obj is not None:
            required = ["semantic_score", "temporal_score", "artifact_flags", "reasons", "pass_fail"]
            missing = [item for item in required if item not in report_obj]
            if missing:
                _die("Bridge schema profile validation failed. Missing fields: " + ", ".join(missing))
    return proc.returncode


def _cmd_voice(args: argparse.Namespace) -> int:
    if not args.hosted:
        _die("This skill supports only hosted NVIDIA NIM API. Use --hosted.")

    if args.sample_rate < 8000 or args.sample_rate > 96000:
        _die("--sample-rate must be in range 8000..96000")
    if not args.server.strip():
        _die("--server must not be empty")

    api_key = os.getenv(args.api_key_env, "").strip()
    if not api_key and not args.dry_run:
        _die(
            f"Missing API key env var: {args.api_key_env}. "
            "Set it before running live hosted NVIDIA requests."
        )

    out_path = _normalize_path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    cache_dir = _normalize_path(args.cache_dir)

    audio_path, meta = _synthesize_voice_audio_riva(
        out_path=out_path,
        text=args.text.strip(),
        model=args.voice_model,
        explicit_function_id=args.voice_function_id,
        voice_name=args.voice_name,
        language_code=args.language_code,
        sample_rate=args.sample_rate,
        server=args.server.strip(),
        cache_dir=cache_dir,
        skip_bootstrap=args.skip_bootstrap,
        api_key=api_key,
        dry_run=args.dry_run,
    )

    print(
        json.dumps(
            {
                "status": "completed",
                "audio": str(audio_path),
                "bytes": audio_path.stat().st_size if audio_path.exists() else 0,
                "meta": meta,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0


def _cmd_probe(args: argparse.Namespace) -> int:
    if not args.hosted:
        _die("This skill supports only hosted NVIDIA NIM API. Use --hosted.")

    if args.input_image and args.input_video:
        _die("Use either --input-image or --input-video, not both in one probe")

    input_image = _normalize_path(args.input_image) if args.input_image else None
    input_video = _normalize_path(args.input_video) if args.input_video else None
    if input_image and not input_image.exists():
        _die(f"Input image not found: {input_image}")
    if input_video and not input_video.exists():
        _die(f"Input video not found: {input_video}")

    has_reference = bool(input_image or input_video)
    model_profile = _resolve_model_profile(args.model_profile, has_reference)
    endpoint_candidates = _endpoint_variants(
        model_profile=model_profile,
        explicit_endpoint=args.nim_endpoint.strip(),
        strategy=args.endpoint_strategy,
        has_reference=has_reference,
    )
    if not endpoint_candidates:
        _die("No endpoint candidates resolved for probe")
    for endpoint_candidate in endpoint_candidates:
        _validate_hosted_url(endpoint_candidate)

    api_key = os.getenv(args.api_key_env, "").strip()
    if not api_key and not args.dry_run:
        _die(
            f"Missing API key env var: {args.api_key_env}. "
            "Set it before running live hosted NVIDIA requests."
        )

    if args.max_request_attempts < 1:
        _die("--max-request-attempts must be >= 1")
    if args.http_retries < 0:
        _die("--http-retries must be >= 0")
    if args.nvcf_poll_seconds < 1:
        _die("--nvcf-poll-seconds must be >= 1")
    if args.pending_backoff_seconds < 0:
        _die("--pending-backoff-seconds must be >= 0")
    if args.pending_backoff_max_seconds < args.pending_backoff_seconds:
        _die("--pending-backoff-max-seconds must be >= --pending-backoff-seconds")
    if not args.html_report_name.strip():
        _die("--html-report-name must not be empty")

    run_id = _run_id()
    timestamp = _ts()

    json_path = _normalize_path(args.json_out) if args.json_out else None
    html_path: Path | None = None
    if not args.no_html_report:
        if args.html_out.strip():
            html_path = _normalize_path(args.html_out)
        elif json_path is not None:
            html_path = json_path.parent / args.html_report_name.strip()
        else:
            html_path = Path.cwd() / "output" / "nvidia-video-forge" / run_id / args.html_report_name.strip()

    payload: dict[str, Any] | None = None

    results: list[dict[str, Any]] = []
    request_attempts = 0
    success: dict[str, Any] | None = None
    nvcf_asset_cache: dict[str, dict[str, Any]] = {}

    for endpoint_idx, endpoint_candidate in enumerate(endpoint_candidates, start=1):
        nvcf_assets: dict[str, Any] | None = None
        if _is_nvcf_exec_endpoint(endpoint_candidate):
            try:
                if endpoint_candidate not in nvcf_asset_cache:
                    nvcf_asset_cache[endpoint_candidate] = _prepare_nvcf_assets_for_endpoint(
                        endpoint=endpoint_candidate,
                        input_image=input_image,
                        input_video=input_video,
                        api_key=api_key,
                        timeout=args.timeout,
                        dry_run=args.dry_run,
                    )
                nvcf_assets = nvcf_asset_cache[endpoint_candidate]
                request_variants = _request_variants_for_nvcf_exec(
                    prompt=args.prompt,
                    input_flag=str(nvcf_assets.get("input_flag", "")),
                    input_asset_ids=list(nvcf_assets.get("asset_ids", [])),
                    poll_duration_seconds=_bounded_nvcf_poll_seconds(args.nvcf_poll_seconds),
                    enable_contract_fallback=not args.disable_contract_fallback,
                )
            except PipelineError as exc:
                results.append(
                    {
                        "endpoint": endpoint_candidate,
                        "endpoint_index": endpoint_idx,
                        "request_variant_index": 0,
                        "request_variant_id": "nvcf_prepare",
                        "status": 0,
                        "classification": "other",
                        "error": str(exc),
                        "payload_summary": {},
                    }
                )
                continue
        else:
            if payload is None:
                payload = _build_payload(
                    prompt=args.prompt,
                    model_profile=model_profile,
                    quality=args.quality,
                    input_image=input_image,
                    input_video=input_video,
                    seed=args.seed,
                )
            request_variants = _request_variants_for_endpoint(
                endpoint=endpoint_candidate,
                payload=payload,
                enable_contract_fallback=not args.disable_contract_fallback,
            )
        for request_idx, request_variant in enumerate(request_variants, start=1):
            request_payload = request_variant["payload"]
            request_variant_id = str(request_variant["id"])
            pending_round = 0

            while True:
                if request_attempts >= args.max_request_attempts:
                    results.append(
                        {
                            "endpoint": endpoint_candidate,
                            "endpoint_index": endpoint_idx,
                            "request_variant_index": request_idx,
                            "request_variant_id": "budget_exhausted",
                            "status": 0,
                            "classification": "budget_exhausted",
                            "error": (
                                f"Request budget exhausted at {args.max_request_attempts}. "
                                "Increase --max-request-attempts for deeper probe."
                            ),
                        }
                    )
                    break

                request_attempts += 1

                if args.dry_run:
                    result = {
                        "endpoint": endpoint_candidate,
                        "endpoint_index": endpoint_idx,
                        "request_variant_index": request_idx,
                        "request_variant_id": request_variant_id,
                        "status": 0,
                        "classification": "dry_run",
                        "error": "",
                        "payload_summary": _summarize_payload(request_payload),
                    }
                    if nvcf_assets is not None:
                        result["nvcf_assets"] = nvcf_assets.get("uploaded_assets", [])
                    results.append(result)
                    if success is None:
                        success = {
                            "dry_run": True,
                            "endpoint": endpoint_candidate,
                            "request_variant_id": request_variant_id,
                        }
                    break

                try:
                    body, content_type = _post_json_with_retry(
                        url=endpoint_candidate,
                        payload=request_payload,
                        api_key=api_key,
                        timeout=args.timeout,
                        max_retries=args.http_retries,
                    )
                    video_bytes, mime = _extract_video_bytes(body, content_type, api_key, args.timeout)
                    result = {
                        "endpoint": endpoint_candidate,
                        "endpoint_index": endpoint_idx,
                        "request_variant_index": request_idx,
                        "request_variant_id": request_variant_id,
                        "status": 200,
                        "classification": "ok",
                        "error": "",
                        "mime": mime,
                        "bytes": len(video_bytes),
                        "payload_summary": _summarize_payload(request_payload),
                    }
                    if nvcf_assets is not None:
                        result["nvcf_assets"] = nvcf_assets.get("uploaded_assets", [])
                    results.append(result)
                    success = result
                    break
                except NVCFPendingError as exc:
                    pending_round += 1
                    result = {
                        "endpoint": endpoint_candidate,
                        "endpoint_index": endpoint_idx,
                        "request_variant_index": request_idx,
                        "request_variant_id": request_variant_id,
                        "status": 202,
                        "classification": "pending",
                        "error": str(exc),
                        "payload_summary": _summarize_payload(request_payload),
                    }
                    if nvcf_assets is not None:
                        result["nvcf_assets"] = nvcf_assets.get("uploaded_assets", [])
                    results.append(result)
                    if request_attempts >= args.max_request_attempts:
                        break
                    wait_s = min(
                        args.pending_backoff_max_seconds,
                        args.pending_backoff_seconds * float(1 + min(pending_round - 1, 4)),
                    )
                    if wait_s > 0:
                        _log(f"probe: pending result, retrying same variant in {wait_s:.1f}s")
                        time.sleep(wait_s)
                    continue
                except HTTPRequestError as exc:
                    result = {
                        "endpoint": endpoint_candidate,
                        "endpoint_index": endpoint_idx,
                        "request_variant_index": request_idx,
                        "request_variant_id": request_variant_id,
                        "status": exc.status,
                        "classification": _classify_probe_failure(exc.status, exc.body),
                        "error": exc.body,
                        "payload_summary": _summarize_payload(request_payload),
                    }
                    if nvcf_assets is not None:
                        result["nvcf_assets"] = nvcf_assets.get("uploaded_assets", [])
                    results.append(result)
                    break
                except PipelineError as exc:
                    result = {
                        "endpoint": endpoint_candidate,
                        "endpoint_index": endpoint_idx,
                        "request_variant_index": request_idx,
                        "request_variant_id": request_variant_id,
                        "status": 0,
                        "classification": "other",
                        "error": str(exc),
                        "payload_summary": _summarize_payload(request_payload),
                    }
                    if nvcf_assets is not None:
                        result["nvcf_assets"] = nvcf_assets.get("uploaded_assets", [])
                    results.append(result)
                    break

            if success and not args.exhaustive:
                break

        if success and not args.exhaustive:
            break

    summary = {
        "run_id": run_id,
        "timestamp": timestamp,
        "dry_run": bool(args.dry_run),
        "model_profile": model_profile,
        "endpoint_strategy": args.endpoint_strategy,
        "contract_fallback": not args.disable_contract_fallback,
        "endpoint_candidates": endpoint_candidates,
        "request_attempts": request_attempts,
        "nvcf_poll_seconds": _bounded_nvcf_poll_seconds(args.nvcf_poll_seconds),
        "pending_backoff_seconds": args.pending_backoff_seconds,
        "pending_backoff_max_seconds": args.pending_backoff_max_seconds,
        "success": success,
        "results": results,
        "outputs": {
            "json": str(json_path) if json_path else None,
            "dashboard_html": str(html_path) if html_path else None,
        },
    }
    if html_path is not None:
        if not _try_write_probe_dashboard(summary=summary, path=html_path):
            summary["outputs"]["dashboard_html"] = None
    if json_path:
        _write_json(json_path, summary)
    print(json.dumps(summary, indent=2, sort_keys=True))
    return 0 if (args.dry_run or success) else 2


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="NVIDIA Video Forge (hosted NVIDIA NIM API only)")
    subparsers = parser.add_subparsers(dest="command", required=True)

    gen = subparsers.add_parser("generate", help="Generate videos and run QA gating")
    gen.add_argument("--prompt", required=True)
    gen.add_argument("--input-image", action="append", default=[], help="Reference image path (repeatable).")
    gen.add_argument("--input-video", action="append", default=[], help="Reference video path (repeatable).")
    gen.add_argument("--input-audio", action="append", default=[], help="Input audio/podcast path (repeatable).")
    gen.add_argument("--input-url", action="append", default=[], help="Web URL source (repeatable).")
    gen.add_argument("--input-youtube-url", action="append", default=[], help="YouTube URL source (repeatable).")
    gen.add_argument("--input-blog-url", action="append", default=[], help="Blog/article URL source (repeatable).")
    gen.add_argument("--input-product-image", action="append", default=[], help="Product image path (repeatable).")
    gen.add_argument("--input-person-image", action="append", default=[], help="Person image path (repeatable).")
    gen.add_argument("--style-url", default="")
    gen.add_argument("--brand-url", default="")
    gen.add_argument("--brand-logo", default="", help="Brand logo path or URL.")
    gen.add_argument("--overlay-template", action="append", default=[], help="Overlay template name (repeatable).")
    gen.add_argument("--overlay-file", action="append", default=[], help="Overlay alpha/video file path (repeatable).")
    gen.add_argument("--target-duration-seconds", type=int, default=0)
    gen.add_argument(
        "--remix-mode",
        default="structure_preserve",
        choices=["structure_preserve", "content_rebuild", "direct_restyle"],
    )
    gen.add_argument(
        "--voice-text",
        default="",
        help="Optional narration text. Uses NVIDIA Riva TTS when set.",
    )
    gen.add_argument(
        "--voice-audio",
        default="",
        help="Optional existing narration audio file to mux into the final video.",
    )
    gen.add_argument(
        "--voice-model",
        default="magpie_multilingual",
        choices=["magpie_multilingual", "magpie_zeroshot", "fastpitch_hifigan"],
        help="NVIDIA Riva TTS model profile used when --voice-text is set.",
    )
    gen.add_argument(
        "--voice-function-id",
        default="",
        help="Override NVCF function id (UUID or pexec URL containing UUID) for voice synthesis.",
    )
    gen.add_argument("--voice-language-code", default="en-US")
    gen.add_argument("--voice-name", default="")
    gen.add_argument("--voice-sample-rate", type=int, default=44100)
    gen.add_argument("--voice-server", default=RIVA_SERVER_DEFAULT)
    gen.add_argument("--voice-gain-db", type=float, default=0.0)
    gen.add_argument(
        "--voice-cache-dir",
        default="~/.cache/nvidia-video-forge/riva",
        help="Cache directory for auto-bootstrapped NVIDIA Riva client runtime.",
    )
    gen.add_argument(
        "--skip-voice-bootstrap",
        action="store_true",
        help="Fail instead of auto-installing Riva runtime dependencies when missing.",
    )
    gen.add_argument(
        "--model-profile",
        default="auto",
        choices=["auto", "predict1", "transfer1", "transfer2_5"],
    )
    gen.add_argument("--quality", default="max", choices=["max", "balanced", "fast"])
    gen.add_argument("--nim-endpoint", default="")
    gen.add_argument(
        "--endpoint-strategy",
        default="profile_fallback",
        choices=["strict", "profile_fallback"],
        help="strict=single endpoint only, profile_fallback=try profile endpoint variants",
    )
    gen.add_argument(
        "--disable-contract-fallback",
        action="store_true",
        help="Disable payload contract wrappers (inputs/input/data fallbacks)",
    )
    gen.add_argument(
        "--hosted",
        action="store_true",
        help="Required flag: use hosted NVIDIA NIM API (self-hosted unsupported)",
    )
    gen.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    gen.add_argument("--num-candidates", type=int, default=None)
    gen.add_argument("--max-retries", type=int, default=2)
    gen.add_argument("--out-dir", default="")
    gen.add_argument("--no-html-report", action="store_true")
    gen.add_argument(
        "--html-report-name",
        default="run_dashboard.html",
        help="Dashboard filename written into --out-dir",
    )
    gen.add_argument("--dry-run", action="store_true")

    gen.add_argument("--seed", type=int, default=None)
    gen.add_argument("--timeout", type=int, default=300)
    gen.add_argument(
        "--http-retries",
        type=int,
        default=1,
        help="Retries per HTTP request on transient errors (429/5xx)",
    )
    gen.add_argument(
        "--max-request-attempts",
        type=int,
        default=40,
        help="Global request budget per candidate across endpoint/payload variants",
    )
    gen.add_argument(
        "--nvcf-poll-seconds",
        type=int,
        default=120,
        help="NVCF pollDurationSeconds value for exec/functions requests (clamped to 30..600).",
    )
    gen.add_argument(
        "--pending-backoff-seconds",
        type=float,
        default=2.0,
        help="Delay before retrying a request variant when NVCF response status is pending.",
    )
    gen.add_argument(
        "--pending-backoff-max-seconds",
        type=float,
        default=8.0,
        help="Maximum delay for pending-status backoff retries.",
    )
    gen.add_argument(
        "--qa-timeout-seconds",
        type=int,
        default=240,
        help="Timeout for each QA subprocess invocation.",
    )
    gen.add_argument(
        "--qa-http-timeout-seconds",
        type=int,
        default=120,
        help="HTTP timeout for the judge request inside QA subprocess.",
    )
    gen.add_argument(
        "--qa-ffprobe-timeout-seconds",
        type=int,
        default=20,
        help="Timeout for ffprobe metadata extraction inside QA subprocess.",
    )
    gen.add_argument(
        "--qa-ffmpeg-timeout-seconds",
        type=int,
        default=30,
        help="Timeout per ffmpeg frame extraction inside QA subprocess.",
    )
    gen.add_argument(
        "--qa-disable-opencv-fallback",
        action="store_true",
        help="Disable OpenCV fallback in QA subprocess (strict FFmpeg-only debugging).",
    )
    gen.add_argument("--qa-threshold", type=float, default=0.82)
    gen.add_argument("--judge-model", default=DEFAULT_JUDGE_MODEL)
    gen.add_argument(
        "--judge-mode",
        default=DEFAULT_JUDGE_MODE,
        choices=["chat_bridge", "nvidia_qa", "openai_api", "dual"],
    )
    gen.add_argument("--judge-model-alias", default=DEFAULT_JUDGE_MODEL_ALIAS)
    gen.add_argument("--judge-max-iterations", type=int, default=6)
    gen.add_argument("--judge-max-minutes", type=int, default=45)
    gen.add_argument(
        "--chat-bridge-mode",
        default="agent_resume",
        choices=["agent_resume", "terminal_paste", "file_baton"],
    )
    gen.add_argument(
        "--judge-base-url",
        default=os.getenv("NVIDIA_OPENAI_BASE_URL", DEFAULT_JUDGE_BASE_URL),
    )
    gen.add_argument(
        "--compliance-mode",
        default="override",
        choices=["strict", "warn", "override"],
    )
    gen.add_argument("--crawl-max-pages", type=int, default=50)
    gen.add_argument("--crawl-max-depth", type=int, default=3)
    gen.add_argument(
        "--google-service-account-json",
        default=os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", ""),
        help="Path to Google service account JSON used for YouTube Data API lookups.",
    )
    gen.add_argument(
        "--google-api-key-env",
        default="GOOGLE_API_KEY",
        help="Environment variable name for YouTube Data API key fallback.",
    )
    gen.add_argument(
        "--youtube-include-source-media",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Enable downloading YouTube source media for visual bridge evidence.",
    )
    gen.add_argument(
        "--youtube-source-frame-count",
        type=int,
        default=12,
        help="Number of source keyframes extracted per YouTube input.",
    )

    qa = subparsers.add_parser("qa", help="Run QA gate against an existing video")
    qa.add_argument("--video", required=True)
    qa.add_argument("--prompt", required=True)
    qa.add_argument("--judge-model", default=DEFAULT_JUDGE_MODEL)
    qa.add_argument("--threshold", type=float, default=0.82)
    qa.add_argument("--json-out", default="")
    qa.add_argument("--timeout-seconds", type=int, default=240)
    qa.add_argument("--http-timeout-seconds", type=int, default=120)
    qa.add_argument("--ffprobe-timeout-seconds", type=int, default=20)
    qa.add_argument("--ffmpeg-timeout-seconds", type=int, default=30)
    qa.add_argument("--disable-opencv-fallback", action="store_true")
    qa.add_argument(
        "--soft-fail",
        action="store_true",
        help="Return QA failure JSON on processing errors instead of wrapper error exit.",
    )

    qa.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    qa.add_argument(
        "--base-url",
        default=os.getenv("NVIDIA_OPENAI_BASE_URL", DEFAULT_JUDGE_BASE_URL),
    )
    qa.add_argument("--dry-run", action="store_true")
    qa.add_argument(
        "--schema-profile",
        default="standard",
        choices=["standard", "bridge"],
        help="Validation profile. bridge = compatibility checks for chat-bridge response schema fields.",
    )

    ingest = subparsers.add_parser("ingest", help="Run source adapters only and write source artifacts")
    ingest.add_argument("--input-image", action="append", default=[])
    ingest.add_argument("--input-video", action="append", default=[])
    ingest.add_argument("--input-audio", action="append", default=[])
    ingest.add_argument("--input-url", action="append", default=[])
    ingest.add_argument("--input-youtube-url", action="append", default=[])
    ingest.add_argument("--input-blog-url", action="append", default=[])
    ingest.add_argument("--input-product-image", action="append", default=[])
    ingest.add_argument("--input-person-image", action="append", default=[])
    ingest.add_argument("--style-url", default="")
    ingest.add_argument("--brand-url", default="")
    ingest.add_argument("--brand-logo", default="")
    ingest.add_argument("--overlay-template", action="append", default=[])
    ingest.add_argument("--overlay-file", action="append", default=[])
    ingest.add_argument(
        "--remix-mode",
        default="structure_preserve",
        choices=["structure_preserve", "content_rebuild", "direct_restyle"],
    )
    ingest.add_argument("--target-duration-seconds", type=int, default=0)
    ingest.add_argument(
        "--compliance-mode",
        default="override",
        choices=["strict", "warn", "override"],
    )
    ingest.add_argument("--crawl-max-pages", type=int, default=50)
    ingest.add_argument("--crawl-max-depth", type=int, default=3)
    ingest.add_argument(
        "--google-service-account-json",
        default=os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", ""),
        help="Path to Google service account JSON used for YouTube Data API lookups.",
    )
    ingest.add_argument(
        "--google-api-key-env",
        default="GOOGLE_API_KEY",
        help="Environment variable name for YouTube Data API key fallback.",
    )
    ingest.add_argument(
        "--youtube-include-source-media",
        action=argparse.BooleanOptionalAction,
        default=True,
        help="Enable downloading YouTube source media for visual evidence extraction.",
    )
    ingest.add_argument(
        "--youtube-source-frame-count",
        type=int,
        default=12,
        help="Number of source keyframes extracted per YouTube input.",
    )
    ingest.add_argument("--out-dir", default="")
    ingest.add_argument("--dry-run", action="store_true")

    resume = subparsers.add_parser("resume", help="Resume a run awaiting chat-bridge judge response")
    resume.add_argument("--run-dir", required=True, help="Absolute run output directory containing manifest.json")
    resume.add_argument("--judge-response", required=True, help="Path to judge_response.json")

    voice = subparsers.add_parser("voice", help="Synthesize narration audio via NVIDIA Riva TTS")
    voice.add_argument("--text", required=True)
    voice.add_argument("--out", required=True, help="Output WAV path")
    voice.add_argument(
        "--voice-model",
        default="magpie_multilingual",
        choices=["magpie_multilingual", "magpie_zeroshot", "fastpitch_hifigan"],
    )
    voice.add_argument("--voice-function-id", default="")
    voice.add_argument("--language-code", default="en-US")
    voice.add_argument("--voice-name", default="")
    voice.add_argument("--sample-rate", type=int, default=44100)
    voice.add_argument("--server", default=RIVA_SERVER_DEFAULT)
    voice.add_argument("--cache-dir", default="~/.cache/nvidia-video-forge/riva")
    voice.add_argument("--skip-bootstrap", action="store_true")
    voice.add_argument(
        "--hosted",
        action="store_true",
        help="Required flag: use hosted NVIDIA NIM API (self-hosted unsupported)",
    )
    voice.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    voice.add_argument("--dry-run", action="store_true")

    probe = subparsers.add_parser("probe", help="Probe hosted endpoint and payload contracts")
    probe.add_argument("--prompt", default="video probe")
    probe.add_argument("--input-image", default="")
    probe.add_argument("--input-video", default="")
    probe.add_argument(
        "--model-profile",
        default="auto",
        choices=["auto", "predict1", "transfer1", "transfer2_5"],
    )
    probe.add_argument("--quality", default="fast", choices=["max", "balanced", "fast"])
    probe.add_argument("--nim-endpoint", default="")
    probe.add_argument(
        "--endpoint-strategy",
        default="profile_fallback",
        choices=["strict", "profile_fallback"],
    )
    probe.add_argument("--disable-contract-fallback", action="store_true")
    probe.add_argument(
        "--hosted",
        action="store_true",
        help="Required flag: use hosted NVIDIA NIM API (self-hosted unsupported)",
    )
    probe.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    probe.add_argument("--timeout", type=int, default=120)
    probe.add_argument("--http-retries", type=int, default=0)
    probe.add_argument("--max-request-attempts", type=int, default=20)
    probe.add_argument(
        "--nvcf-poll-seconds",
        type=int,
        default=120,
        help="NVCF pollDurationSeconds value for exec/functions requests (clamped to 30..600).",
    )
    probe.add_argument(
        "--pending-backoff-seconds",
        type=float,
        default=2.0,
        help="Delay before retrying a request variant when NVCF response status is pending.",
    )
    probe.add_argument(
        "--pending-backoff-max-seconds",
        type=float,
        default=8.0,
        help="Maximum delay for pending-status backoff retries.",
    )
    probe.add_argument("--seed", type=int, default=None)
    probe.add_argument("--json-out", default="")
    probe.add_argument("--no-html-report", action="store_true")
    probe.add_argument(
        "--html-report-name",
        default="probe_dashboard.html",
        help="Default dashboard filename (used if --html-out is not set)",
    )
    probe.add_argument("--html-out", default="")
    probe.add_argument(
        "--exhaustive",
        action="store_true",
        help="Probe all endpoint/payload variants even after first success",
    )
    probe.add_argument("--dry-run", action="store_true")

    return parser


def main() -> int:
    parser = _build_parser()
    args = parser.parse_args()

    try:
        if args.command == "generate":
            return _cmd_generate(args)
        if args.command == "resume":
            return _cmd_resume(args)
        if args.command == "ingest":
            return _cmd_ingest(args)
        if args.command == "qa":
            return _cmd_qa(args)
        if args.command == "voice":
            return _cmd_voice(args)
        if args.command == "probe":
            return _cmd_probe(args)
        _die(f"Unsupported command: {args.command}")
        return 1
    except PipelineError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
