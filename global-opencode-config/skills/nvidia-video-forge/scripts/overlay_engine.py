#!/usr/bin/env python3
"""Video overlay helpers based on FFmpeg filtergraphs."""

from __future__ import annotations

import json
from pathlib import Path
import shutil
import subprocess
from typing import Any


def _template_filters(template_name: str) -> list[str]:
    name = template_name.strip().lower()
    if name == "world_news":
        return [
            "drawbox=x=0:y=ih*0.82:w=iw:h=ih*0.18:color=black@0.45:t=fill",
            "drawbox=x=0:y=0:w=iw:h=ih*0.08:color=black@0.35:t=fill",
        ]
    if name == "headline_strip":
        return ["drawbox=x=0:y=ih*0.85:w=iw:h=ih*0.15:color=black@0.55:t=fill"]
    return []


def build_overlay_plan(
    *,
    overlay_templates: list[str],
    overlay_files: list[Path],
) -> dict[str, Any]:
    templates = [item.strip() for item in overlay_templates if item and item.strip()]
    files = [str(path.resolve()) for path in overlay_files if path.exists()]
    return {
        "templates": templates,
        "files": files,
        "enabled": bool(templates or files),
    }


def apply_overlays(
    *,
    input_video: Path,
    output_video: Path,
    overlay_templates: list[str],
    overlay_files: list[Path],
    dry_run: bool,
) -> Path:
    output_video.parent.mkdir(parents=True, exist_ok=True)

    if dry_run:
        shutil.copy2(input_video, output_video)
        return output_video

    existing_files = [path for path in overlay_files if path.exists()]
    template_filters: list[str] = []
    for template in overlay_templates:
        template_filters.extend(_template_filters(template))

    inputs = ["-i", str(input_video)]
    for overlay_file in existing_files:
        inputs.extend(["-i", str(overlay_file)])

    filter_parts: list[str] = []
    base_label = "[0:v]"
    current_label = base_label

    if template_filters:
        for idx, flt in enumerate(template_filters, start=1):
            next_label = f"[t{idx}]"
            filter_parts.append(f"{current_label}{flt}{next_label}")
            current_label = next_label

    for idx, _overlay in enumerate(existing_files, start=1):
        next_label = f"[o{idx}]"
        filter_parts.append(f"{current_label}[{idx}:v]overlay=W-w-32:32{next_label}")
        current_label = next_label

    if filter_parts:
        filter_parts.append(f"{current_label}format=yuv420p[vout]")
        filter_complex = ";".join(filter_parts)
        cmd = [
            "ffmpeg",
            "-y",
            *inputs,
            "-filter_complex",
            filter_complex,
            "-map",
            "[vout]",
            "-map",
            "0:a?",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-c:a",
            "aac",
            "-shortest",
            str(output_video),
        ]
    else:
        cmd = [
            "ffmpeg",
            "-y",
            "-i",
            str(input_video),
            "-c",
            "copy",
            str(output_video),
        ]

    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip() or "ffmpeg overlay failed")

    return output_video


def write_overlay_plan(plan: dict[str, Any], out_dir: Path) -> str:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "overlay_plan.json"
    path.write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return str(path.resolve())
