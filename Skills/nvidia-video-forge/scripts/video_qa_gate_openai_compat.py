#!/usr/bin/env python3
"""Strict hosted-NVIDIA video QA gate with technical and semantic checks.

Prints JSON on stdout:
{
  "technical_checks": {...},
  "semantic_score": 0.0,
  "temporal_score": 0.0,
  "artifact_flags": [],
  "pass_fail": false,
  "reasons": []
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
import subprocess
import sys
import tempfile
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

DEFAULT_BASE_URL = "https://integrate.api.nvidia.com/v1"
DEFAULT_JUDGE_MODEL = "meta/llama-3.2-11b-vision-instruct"
DEFAULT_JUDGE_HTTP_TIMEOUT_SECONDS = 120
DEFAULT_FFPROBE_TIMEOUT_SECONDS = 20
DEFAULT_FFMPEG_TIMEOUT_SECONDS = 30
SEVERE_ARTIFACT_TERMS = {
    "flicker",
    "frame corruption",
    "heavy blocking",
    "severe blur",
    "identity drift",
    "warping",
    "temporal collapse",
}


class QAError(RuntimeError):
    """Raised when QA cannot produce a reliable decision."""


class JudgeHTTPError(QAError):
    """Raised when judge endpoint responds with non-retryable HTTP errors."""

    def __init__(self, status: int, body: str):
        super().__init__(f"HTTP {status} from judge endpoint: {body}")
        self.status = status
        self.body = body


def _die(message: str) -> None:
    raise QAError(message)


def _progress(message: str) -> None:
    print(f"[video-qa] {message}", file=sys.stderr, flush=True)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="QA gate for hosted NVIDIA NIM video outputs")
    parser.add_argument("--video", required=True, help="Path to generated video")
    parser.add_argument("--prompt", required=True, help="Original generation prompt")
    parser.add_argument("--judge-model", default=DEFAULT_JUDGE_MODEL)
    parser.add_argument("--threshold", type=float, default=0.82)
    parser.add_argument("--json-out", default="")

    parser.add_argument("--api-key-env", default="NVIDIA_API_KEY")
    parser.add_argument("--base-url", default=os.getenv("NVIDIA_OPENAI_BASE_URL", DEFAULT_BASE_URL))
    parser.add_argument(
        "--timeout",
        type=int,
        default=DEFAULT_JUDGE_HTTP_TIMEOUT_SECONDS,
        help="HTTP timeout (seconds) per judge API request.",
    )
    parser.add_argument(
        "--ffprobe-timeout-seconds",
        type=int,
        default=DEFAULT_FFPROBE_TIMEOUT_SECONDS,
        help="Timeout (seconds) for ffprobe metadata extraction.",
    )
    parser.add_argument(
        "--ffmpeg-timeout-seconds",
        type=int,
        default=DEFAULT_FFMPEG_TIMEOUT_SECONDS,
        help="Timeout (seconds) per ffmpeg frame extraction call.",
    )
    parser.add_argument("--http-retries", type=int, default=2)
    parser.add_argument("--temperature", type=float, default=0.0)
    parser.add_argument("--max-tokens", type=int, default=500)
    parser.add_argument("--frame-count", type=int, default=3)
    parser.add_argument(
        "--disable-opencv-fallback",
        action="store_true",
        help="Disable OpenCV fallback when ffprobe/ffmpeg probing fails.",
    )
    parser.add_argument("--min-duration", type=float, default=1.0)
    parser.add_argument("--min-fps", type=float, default=12.0)
    parser.add_argument("--min-short-edge", type=int, default=512)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--soft-fail",
        action="store_true",
        help="Return a failing JSON report instead of exiting non-zero on processing errors",
    )
    return parser.parse_args()


def _validate_hosted_base_url(base_url: str) -> None:
    parsed = urlparse(base_url)
    if parsed.scheme != "https":
        _die(f"Base URL must use https: {base_url}")
    host = parsed.netloc.lower()
    if not host or "api.nvidia.com" not in host:
        _die(f"Base URL must target NVIDIA hosted API domains: {base_url}")


def _run_checked(cmd: list[str], *, timeout_seconds: int, step_label: str) -> str:
    try:
        proc = subprocess.run(cmd, text=True, capture_output=True, timeout=timeout_seconds)
    except subprocess.TimeoutExpired as exc:
        partial = (exc.stderr or "").strip() or (exc.stdout or "").strip() or "<empty>"
        raise QAError(f"{step_label} timed out after {timeout_seconds}s. Partial output: {partial}")
    if proc.returncode != 0:
        joined = " ".join(cmd)
        stderr = proc.stderr.strip() or "<empty>"
        raise QAError(f"Command failed ({proc.returncode}) during {step_label}: {joined}\nSTDERR:\n{stderr}")
    return proc.stdout


def _parse_ratio(value: str) -> float:
    raw = (value or "").strip()
    if not raw:
        return 0.0
    if "/" in raw:
        left, right = raw.split("/", 1)
        try:
            num = float(left)
            den = float(right)
            if den == 0:
                return 0.0
            return num / den
        except ValueError:
            return 0.0
    try:
        return float(raw)
    except ValueError:
        return 0.0


def _safe_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _load_cv2() -> Any:
    try:
        import cv2  # type: ignore
    except Exception as exc:  # pragma: no cover - dependency/runtime-specific
        _die(f"OpenCV fallback unavailable: {exc}")
    return cv2


def _probe_video(
    path: Path,
    *,
    min_duration: float,
    min_fps: float,
    min_short_edge: int,
    ffprobe_timeout_seconds: int,
) -> dict[str, Any]:
    if not path.exists():
        _die(f"Video does not exist: {path}")

    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        str(path),
    ]
    _progress(f"ffprobe metadata from {path}")
    raw = _run_checked(cmd, timeout_seconds=ffprobe_timeout_seconds, step_label="ffprobe")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        _die(f"ffprobe returned invalid JSON: {exc}")

    streams = data.get("streams", []) if isinstance(data, dict) else []
    video_stream: dict[str, Any] | None = None
    for stream in streams:
        if isinstance(stream, dict) and stream.get("codec_type") == "video":
            video_stream = stream
            break

    format_obj = data.get("format", {}) if isinstance(data, dict) else {}
    duration = _safe_float(format_obj.get("duration"))
    width = int(video_stream.get("width", 0) or 0) if video_stream else 0
    height = int(video_stream.get("height", 0) or 0) if video_stream else 0
    fps = _parse_ratio(str(video_stream.get("r_frame_rate", ""))) if video_stream else 0.0

    short_edge_value = min(width, height) if width and height else 0
    has_video_stream = video_stream is not None
    duration_ok = duration >= min_duration
    fps_ok = fps >= min_fps
    short_edge_ok = short_edge_value >= min_short_edge

    technical_checks = {
        "decode_ok": has_video_stream,
        "has_video_stream": has_video_stream,
        "duration_seconds": round(duration, 4),
        "fps": round(fps, 4),
        "width": width,
        "height": height,
        "short_edge": short_edge_value,
        "size_bytes": path.stat().st_size,
        "duration_ok": duration_ok,
        "fps_ok": fps_ok,
        "short_edge_ok": short_edge_ok,
        "thresholds": {
            "min_duration": min_duration,
            "min_fps": min_fps,
            "min_short_edge": min_short_edge,
        },
        "metadata_source": "ffprobe",
    }
    return technical_checks


def _probe_video_opencv(
    path: Path,
    *,
    min_duration: float,
    min_fps: float,
    min_short_edge: int,
    probe_warning: str,
) -> dict[str, Any]:
    cv2 = _load_cv2()
    _progress(f"OpenCV fallback probe for {path}")
    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        _die("OpenCV could not open video for fallback probe")
    try:
        width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH) or 0)
        height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT) or 0)
        fps = _safe_float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        frame_total = _safe_float(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0)
        duration = (frame_total / fps) if (frame_total > 0.0 and fps > 0.0) else 0.0

        decode_ok = False
        ok, _frame = capture.read()
        if ok:
            decode_ok = True
    finally:
        capture.release()

    short_edge_value = min(width, height) if width and height else 0
    technical_checks = {
        "decode_ok": decode_ok,
        "has_video_stream": decode_ok,
        "duration_seconds": round(duration, 4),
        "fps": round(fps, 4),
        "width": width,
        "height": height,
        "short_edge": short_edge_value,
        "size_bytes": path.stat().st_size,
        "duration_ok": duration >= min_duration,
        "fps_ok": fps >= min_fps,
        "short_edge_ok": short_edge_value >= min_short_edge,
        "thresholds": {
            "min_duration": min_duration,
            "min_fps": min_fps,
            "min_short_edge": min_short_edge,
        },
        "metadata_source": "opencv",
        "probe_warning": probe_warning,
    }
    return technical_checks


def _frame_times(duration: float, count: int) -> list[float]:
    count = max(1, min(6, count))
    if duration <= 0.0:
        return [0.0] * count

    times: list[float] = []
    for idx in range(count):
        frac = (idx + 1) / (count + 1)
        ts = duration * frac
        ts = max(0.0, min(max(0.0, duration - 0.05), ts))
        times.append(ts)
    return times


def _extract_frame_data_urls(
    video: Path,
    duration: float,
    frame_count: int,
    *,
    ffmpeg_timeout_seconds: int,
) -> list[str]:
    data_urls: list[str] = []
    sample_times = _frame_times(duration, frame_count)
    with tempfile.TemporaryDirectory(prefix="video-qa-") as tmp_dir:
        tmp_root = Path(tmp_dir)
        for idx, ts in enumerate(sample_times, start=1):
            frame_path = tmp_root / f"frame_{idx}.jpg"
            cmd = [
                "ffmpeg",
                "-y",
                "-ss",
                f"{ts:.3f}",
                "-i",
                str(video),
                "-frames:v",
                "1",
                "-q:v",
                "2",
                str(frame_path),
            ]
            _progress(f"extracting frame {idx}/{len(sample_times)} at {ts:.3f}s")
            _run_checked(
                cmd,
                timeout_seconds=ffmpeg_timeout_seconds,
                step_label=f"ffmpeg frame extraction {idx}/{len(sample_times)}",
            )
            if not frame_path.exists() or frame_path.stat().st_size <= 0:
                _die(f"Failed to extract frame at {ts:.3f}s")
            data_urls.append(_image_to_data_url(frame_path))
    return data_urls


def _extract_frame_data_urls_opencv(video: Path, duration: float, frame_count: int) -> list[str]:
    cv2 = _load_cv2()
    _progress(f"OpenCV fallback frame extraction for {video}")
    capture = cv2.VideoCapture(str(video))
    if not capture.isOpened():
        _die("OpenCV could not open video for fallback frame extraction")

    try:
        fps = _safe_float(capture.get(cv2.CAP_PROP_FPS) or 0.0)
        frame_total = int(_safe_float(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0))
        effective_duration = duration
        if effective_duration <= 0.0 and fps > 0.0 and frame_total > 0:
            effective_duration = frame_total / fps

        sample_times = _frame_times(effective_duration, frame_count)
        if not sample_times:
            sample_times = [0.0]

        data_urls: list[str] = []
        for idx, ts in enumerate(sample_times, start=1):
            target_index = 0
            if fps > 0.0:
                target_index = int(max(0.0, ts) * fps)
            elif frame_total > 0:
                frac = idx / (len(sample_times) + 1)
                target_index = int(max(0, min(frame_total - 1, round(frame_total * frac))))

            capture.set(cv2.CAP_PROP_POS_FRAMES, float(target_index))
            ok, frame = capture.read()
            if not ok or frame is None:
                _die(f"OpenCV frame extraction failed at index {target_index}")

            ok_enc, encoded = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
            if not ok_enc:
                _die(f"OpenCV JPEG encoding failed for frame index {target_index}")
            blob = encoded.tobytes()
            if not blob:
                _die(f"OpenCV produced empty frame bytes for frame index {target_index}")
            b64 = base64.b64encode(blob).decode("ascii")
            data_urls.append(f"data:image/jpeg;base64,{b64}")

        return data_urls
    finally:
        capture.release()


def _image_to_data_url(path: Path) -> str:
    blob = path.read_bytes()
    if not blob:
        _die(f"Image is empty: {path}")
    mime, _ = mimetypes.guess_type(path.name)
    if not mime:
        mime = "image/jpeg"
    b64 = base64.b64encode(blob).decode("ascii")
    return f"data:{mime};base64,{b64}"


def _post_json(
    url: str,
    payload: dict[str, Any],
    api_key: str,
    timeout: int,
    retries: int,
) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    for attempt in range(1, retries + 2):
        req = Request(
            url=url,
            method="POST",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            data=body,
        )
        try:
            with urlopen(req, timeout=timeout) as response:
                raw = response.read().decode("utf-8")
            try:
                parsed = json.loads(raw)
            except json.JSONDecodeError as exc:
                _die(f"Judge endpoint returned invalid JSON: {exc}")
            if not isinstance(parsed, dict):
                _die("Judge endpoint response must be a JSON object")
            return parsed
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            if attempt <= retries and exc.code in {429, 500, 502, 503, 504}:
                time.sleep(float(2 ** (attempt - 1)))
                continue
            raise JudgeHTTPError(exc.code, detail)
        except URLError as exc:
            if attempt <= retries:
                time.sleep(float(2 ** (attempt - 1)))
                continue
            _die(f"Network error while calling judge endpoint: {exc}")

    _die("Judge endpoint retry loop exhausted")
    return {}


def _extract_text_content(message_content: Any) -> str:
    if isinstance(message_content, str):
        return message_content
    if isinstance(message_content, list):
        chunks: list[str] = []
        for item in message_content:
            if isinstance(item, dict):
                if item.get("type") in {"text", "output_text"} and isinstance(item.get("text"), str):
                    chunks.append(item["text"])
                elif isinstance(item.get("content"), str):
                    chunks.append(item["content"])
        return "\n".join(chunks).strip()
    return ""


def _extract_json_object(raw_text: str) -> dict[str, Any]:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\n?", "", text)
        text = re.sub(r"\n?```$", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        heuristic = _heuristic_judge_object_from_text(text)
        if heuristic is not None:
            return heuristic
        snippet = " ".join(text.split())[:220] if text else "<empty>"
        _die(f"Judge model output did not contain a JSON object. Raw snippet: {snippet}")

    fragment = text[start : end + 1]
    try:
        obj = json.loads(fragment)
    except json.JSONDecodeError as exc:
        heuristic = _heuristic_judge_object_from_text(text)
        if heuristic is not None:
            return heuristic
        _die(f"Judge model JSON parse failed: {exc}")
    if not isinstance(obj, dict):
        _die("Judge model output JSON must be an object")
    return obj


def _heuristic_judge_object_from_text(text: str) -> dict[str, Any] | None:
    normalized = " ".join((text or "").strip().split())
    if not normalized:
        return None

    sem_match = re.search(r"semantic\s*score[^0-9]*([01](?:\.\d+)?)", normalized, flags=re.IGNORECASE)
    temp_match = re.search(r"temporal\s*score[^0-9]*([01](?:\.\d+)?)", normalized, flags=re.IGNORECASE)
    if not sem_match and not temp_match:
        return None

    semantic_score = _safe_float(sem_match.group(1) if sem_match else 0.0)
    temporal_score = _safe_float(temp_match.group(1) if temp_match else 0.0)

    artifact_flags: list[str] = []
    reasons: list[str] = []

    artifact_match = re.search(r"artifact\s*flags[^[]*\[([^\]]*)\]", normalized, flags=re.IGNORECASE)
    if artifact_match:
        artifact_flags = _clean_inline_list_tokens(artifact_match.group(1))

    reasons_match = re.search(r"reasons?[^[]*\[([^\]]*)\]", normalized, flags=re.IGNORECASE)
    if reasons_match:
        reasons = _clean_inline_list_tokens(reasons_match.group(1))

    hard_fail = bool(
        re.search(r"hard[_\s-]*fail[^a-z0-9]*(true|yes|1)\b", normalized, flags=re.IGNORECASE)
    )
    if not reasons:
        reasons = ["Heuristic parse from non-JSON judge output"]

    return {
        "semantic_score": semantic_score,
        "temporal_score": temporal_score,
        "artifact_flags": artifact_flags,
        "reasons": reasons,
        "hard_fail": hard_fail,
    }


def _clean_inline_list_tokens(raw: str) -> list[str]:
    values: list[str] = []
    for part in (raw or "").split(","):
        token = part.strip().strip("\"'`")
        if token:
            values.append(token)
    return values


def _judge_max_images_from_error(detail: str) -> int | None:
    match = re.search(r"At most\s+(\d+)\s+image", detail, flags=re.IGNORECASE)
    if not match:
        return None
    try:
        value = int(match.group(1))
    except ValueError:
        return None
    return max(0, value)


def _normalize_list(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _clamp_score(value: Any) -> float:
    score = _safe_float(value)
    score = max(0.0, min(1.0, score))
    return round(score, 4)


def _has_severe_artifacts(artifact_flags: list[str]) -> bool:
    lowered = " | ".join(flag.lower() for flag in artifact_flags)
    return any(term in lowered for term in SEVERE_ARTIFACT_TERMS)


def _semantic_temporal_eval(
    *,
    args: argparse.Namespace,
    prompt: str,
    frame_data_urls: list[str],
    api_key: str,
) -> tuple[float, float, list[str], list[str], bool]:
    endpoint = args.base_url.rstrip("/") + "/chat/completions"
    requested_frames = list(frame_data_urls)
    response_obj: dict[str, Any] | None = None

    for _attempt in range(2):
        content: list[dict[str, Any]] = [
            {
                "type": "text",
                "text": (
                    "You are a strict enterprise video QA judge. "
                    "Evaluate prompt alignment, visual quality, and temporal consistency from sampled frames. "
                    "Return JSON only with keys: semantic_score (0..1), temporal_score (0..1), "
                    "artifact_flags (string array), reasons (string array), hard_fail (boolean)."
                ),
            },
            {
                "type": "text",
                "text": f"Target prompt: {prompt}",
            },
        ]

        for data_url in requested_frames:
            content.append({"type": "image_url", "image_url": {"url": data_url}})

        payload: dict[str, Any] = {
            "model": args.judge_model,
            "temperature": args.temperature,
            "max_tokens": args.max_tokens,
            "response_format": {"type": "json_object"},
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "Be strict. Flag artifacts aggressively. "
                        "Use hard_fail=true for severe quality defects or clear prompt mismatch."
                    ),
                },
                {"role": "user", "content": content},
            ],
        }

        _progress(
            "calling judge endpoint "
            f"{endpoint} (model={args.judge_model}, timeout={args.timeout}s, retries={args.http_retries}, "
            f"frames={len(requested_frames)})"
        )
        try:
            response_obj = _post_json(endpoint, payload, api_key, args.timeout, args.http_retries)
            break
        except JudgeHTTPError as exc:
            max_images = _judge_max_images_from_error(exc.body) if exc.status == 400 else None
            if max_images is not None and max_images >= 1 and max_images < len(requested_frames):
                requested_frames = requested_frames[:max_images]
                _progress(
                    f"judge image limit detected (max={max_images}); retrying with {len(requested_frames)} frame(s)"
                )
                continue
            raise

    if response_obj is None:
        _die("Judge response unavailable after retry logic")

    choices = response_obj.get("choices")
    if not isinstance(choices, list) or not choices:
        _die("Judge response missing choices")

    first = choices[0] if isinstance(choices[0], dict) else {}
    message = first.get("message", {}) if isinstance(first, dict) else {}
    content_raw = message.get("content") if isinstance(message, dict) else ""
    text = _extract_text_content(content_raw)
    if not text:
        _die("Judge response content is empty")

    parsed = _extract_json_object(text)

    semantic_score = _clamp_score(parsed.get("semantic_score"))
    temporal_score = _clamp_score(parsed.get("temporal_score"))
    artifact_flags = _normalize_list(parsed.get("artifact_flags"))
    reasons = _normalize_list(parsed.get("reasons"))
    hard_fail = bool(parsed.get("hard_fail", False)) or _has_severe_artifacts(artifact_flags)

    return semantic_score, temporal_score, artifact_flags, reasons, hard_fail


def _build_report(
    technical_checks: dict[str, Any],
    semantic_score: float,
    temporal_score: float,
    artifact_flags: list[str],
    reasons: list[str],
    hard_fail: bool,
    threshold: float,
) -> dict[str, Any]:
    threshold = max(0.0, min(1.0, threshold))
    technical_pass = bool(
        technical_checks.get("decode_ok")
        and technical_checks.get("duration_ok")
        and technical_checks.get("fps_ok")
        and technical_checks.get("short_edge_ok")
    )

    pass_fail = bool(
        technical_pass
        and not hard_fail
        and semantic_score >= threshold
        and temporal_score >= threshold
    )

    report_reasons = list(reasons)
    if not technical_checks.get("decode_ok"):
        report_reasons.append("Video stream is not decodable")
    if not technical_checks.get("duration_ok"):
        report_reasons.append("Duration is too short")
    if not technical_checks.get("fps_ok"):
        report_reasons.append("Frame rate is too low")
    if not technical_checks.get("short_edge_ok"):
        report_reasons.append("Resolution short edge is below 512")
    if semantic_score < threshold:
        report_reasons.append(f"Semantic score below threshold ({semantic_score} < {threshold})")
    if temporal_score < threshold:
        report_reasons.append(f"Temporal score below threshold ({temporal_score} < {threshold})")
    if hard_fail:
        report_reasons.append("Hard-fail artifact or severe prompt mismatch detected")

    dedup_reasons: list[str] = []
    seen: set[str] = set()
    for reason in report_reasons:
        key = reason.strip()
        if key and key not in seen:
            dedup_reasons.append(key)
            seen.add(key)

    return {
        "technical_checks": technical_checks,
        "semantic_score": semantic_score,
        "temporal_score": temporal_score,
        "artifact_flags": artifact_flags,
        "pass_fail": pass_fail,
        "reasons": dedup_reasons,
    }


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def _soft_fail_report(message: str) -> dict[str, Any]:
    return {
        "technical_checks": {
            "decode_ok": False,
            "duration_ok": False,
            "fps_ok": False,
            "short_edge_ok": False,
        },
        "semantic_score": 0.0,
        "temporal_score": 0.0,
        "artifact_flags": ["qa_error"],
        "pass_fail": False,
        "reasons": [message],
    }


def main() -> int:
    args = _parse_args()

    try:
        _validate_hosted_base_url(args.base_url)
        if args.timeout < 1:
            _die("--timeout must be >= 1")
        if args.ffprobe_timeout_seconds < 1:
            _die("--ffprobe-timeout-seconds must be >= 1")
        if args.ffmpeg_timeout_seconds < 1:
            _die("--ffmpeg-timeout-seconds must be >= 1")
        if args.http_retries < 0:
            _die("--http-retries must be >= 0")
        if args.frame_count < 1:
            _die("--frame-count must be >= 1")

        video_path = Path(args.video).expanduser().resolve()

        if args.dry_run:
            report = {
                "technical_checks": {
                    "decode_ok": True,
                    "has_video_stream": True,
                    "duration_seconds": 4.0,
                    "fps": 24.0,
                    "width": 1280,
                    "height": 720,
                    "size_bytes": 123456,
                    "duration_ok": True,
                    "fps_ok": True,
                    "short_edge_ok": True,
                },
                "semantic_score": 0.9,
                "temporal_score": 0.88,
                "artifact_flags": [],
                "pass_fail": True,
                "reasons": ["dry-run synthetic result"],
            }
        else:
            api_key = os.getenv(args.api_key_env, "").strip()
            if not api_key:
                _die(f"Missing API key env var: {args.api_key_env}")

            technical_probe_warning = ""
            try:
                technical_checks = _probe_video(
                    video_path,
                    min_duration=args.min_duration,
                    min_fps=args.min_fps,
                    min_short_edge=args.min_short_edge,
                    ffprobe_timeout_seconds=args.ffprobe_timeout_seconds,
                )
            except QAError as exc:
                if args.disable_opencv_fallback:
                    raise
                technical_probe_warning = str(exc)
                _progress(f"ffprobe probe failed, switching to OpenCV fallback: {technical_probe_warning}")
                technical_checks = _probe_video_opencv(
                    video_path,
                    min_duration=args.min_duration,
                    min_fps=args.min_fps,
                    min_short_edge=args.min_short_edge,
                    probe_warning=technical_probe_warning,
                )

            technical_pass = bool(
                technical_checks.get("decode_ok")
                and technical_checks.get("duration_ok")
                and technical_checks.get("fps_ok")
                and technical_checks.get("short_edge_ok")
            )

            if technical_pass:
                duration = _safe_float(technical_checks.get("duration_seconds"))
                try:
                    frame_data_urls = _extract_frame_data_urls(
                        video_path,
                        duration,
                        args.frame_count,
                        ffmpeg_timeout_seconds=args.ffmpeg_timeout_seconds,
                    )
                except QAError as exc:
                    if args.disable_opencv_fallback:
                        raise
                    _progress(f"ffmpeg frame extraction failed, switching to OpenCV fallback: {exc}")
                    frame_data_urls = _extract_frame_data_urls_opencv(
                        video_path,
                        duration,
                        args.frame_count,
                    )
                try:
                    semantic_score, temporal_score, artifact_flags, reasons, hard_fail = _semantic_temporal_eval(
                        args=args,
                        prompt=args.prompt,
                        frame_data_urls=frame_data_urls,
                        api_key=api_key,
                    )
                except QAError as exc:
                    if not args.soft_fail:
                        raise
                    semantic_score = 0.0
                    temporal_score = 0.0
                    artifact_flags = ["qa_error"]
                    reasons = [str(exc)]
                    hard_fail = True
            else:
                semantic_score = 0.0
                temporal_score = 0.0
                artifact_flags = ["technical_gate_failed"]
                reasons = ["Technical gate failed before semantic evaluation"]
                hard_fail = True

            report = _build_report(
                technical_checks,
                semantic_score,
                temporal_score,
                artifact_flags,
                reasons,
                hard_fail,
                args.threshold,
            )

        if args.json_out:
            _write_json(Path(args.json_out).expanduser().resolve(), report)

        print(json.dumps(report, indent=2, sort_keys=True))
        return 0 if report.get("pass_fail") else 2

    except QAError as exc:
        if args.soft_fail:
            report = _soft_fail_report(str(exc))
            if args.json_out:
                _write_json(Path(args.json_out).expanduser().resolve(), report)
            print(json.dumps(report, indent=2, sort_keys=True))
            return 2
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
