#!/usr/bin/env python3
"""Audio transcription and planning helpers for video generation pipelines."""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from typing import Any


def _safe_duration_seconds(path: Path) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=nokey=1:noprint_wrappers=1",
        str(path),
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    except Exception:  # noqa: BLE001
        return 0.0
    if proc.returncode != 0:
        return 0.0
    try:
        return max(0.0, float(proc.stdout.strip()))
    except (TypeError, ValueError):
        return 0.0


def _split_segments(duration: float, segment_seconds: int = 12) -> list[dict[str, Any]]:
    if duration <= 0:
        return []
    segments: list[dict[str, Any]] = []
    start = 0.0
    index = 1
    while start < duration:
        end = min(duration, start + float(segment_seconds))
        segments.append(
            {
                "id": f"seg-{index:03d}",
                "start": round(start, 2),
                "end": round(end, 2),
                "text": f"Segment {index}: key talking points and supporting visuals.",
            }
        )
        start = end
        index += 1
    return segments


def build_asr_plan(
    *,
    audio_paths: list[Path],
    target_duration_seconds: int,
    dry_run: bool,
) -> dict[str, Any]:
    inputs: list[dict[str, Any]] = []
    all_segments: list[dict[str, Any]] = []

    for audio_path in audio_paths:
        duration = _safe_duration_seconds(audio_path)
        segments = _split_segments(duration)
        inputs.append(
            {
                "path": str(audio_path.resolve()),
                "duration_seconds": round(duration, 2),
                "segments": segments,
                "transcription_mode": "placeholder_timeline" if dry_run else "timeline_fallback",
            }
        )
        for segment in segments:
            row = dict(segment)
            row["source"] = str(audio_path.resolve())
            all_segments.append(row)

    storyboard: list[dict[str, Any]] = []
    for idx, segment in enumerate(all_segments[:30], start=1):
        storyboard.append(
            {
                "scene": idx,
                "start": segment["start"],
                "end": segment["end"],
                "visual_hint": "B-roll matching narration topic with stable camera motion.",
                "caption": segment["text"],
            }
        )

    total_audio_seconds = sum(item["duration_seconds"] for item in inputs)
    target_seconds = target_duration_seconds if target_duration_seconds > 0 else int(total_audio_seconds or 30)

    return {
        "audio_input_count": len(inputs),
        "target_duration_seconds": target_seconds,
        "total_audio_seconds": round(total_audio_seconds, 2),
        "transcriptions": inputs,
        "segments": all_segments,
        "storyboard": storyboard,
        "news_reel_default": len(inputs) > 0,
    }


def write_asr_outputs(plan: dict[str, Any], out_dir: Path) -> str:
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "asr_plan.json"
    out_path.write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return str(out_path.resolve())
