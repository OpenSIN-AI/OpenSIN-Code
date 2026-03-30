#!/usr/bin/env python3
"""Chat-bridge judge contracts for NVIDIA Video Forge.

This module intentionally does not call codex exec or external judge APIs.
It creates handoff artifacts that can be reviewed in the same Codex chat
session, then validates the structured response for resume workflows.
"""

from __future__ import annotations

import json
from pathlib import Path
import subprocess
from typing import Any


def _as_float(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    return text in {"1", "true", "yes", "y", "on"}


def bridge_judge_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "run_id",
            "attempt",
            "pass_fail",
            "best_candidate_id",
            "overall_feedback",
            "reasons",
            "candidates",
        ],
        "properties": {
            "run_id": {"type": "string", "minLength": 1},
            "attempt": {"type": "integer", "minimum": 1},
            "pass_fail": {"type": "boolean"},
            "best_candidate_id": {"type": "string", "minLength": 1},
            "overall_feedback": {"type": "string"},
            "reasons": {"type": "array", "items": {"type": "string"}},
            "candidates": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "candidate_id",
                        "semantic_score",
                        "temporal_score",
                        "branding_score",
                        "instruction_score",
                        "technical_ok",
                        "artifact_flags",
                        "reasons",
                        "fix_instructions",
                    ],
                    "properties": {
                        "candidate_id": {"type": "string", "minLength": 1},
                        "semantic_score": {"type": "number", "minimum": 0, "maximum": 1},
                        "temporal_score": {"type": "number", "minimum": 0, "maximum": 1},
                        "branding_score": {"type": "number", "minimum": 0, "maximum": 1},
                        "instruction_score": {"type": "number", "minimum": 0, "maximum": 1},
                        "technical_ok": {"type": "boolean"},
                        "artifact_flags": {"type": "array", "items": {"type": "string"}},
                        "reasons": {"type": "array", "items": {"type": "string"}},
                        "fix_instructions": {"type": "array", "items": {"type": "string"}},
                        "hard_fail": {"type": "boolean"},
                        "aggregate_score": {"type": "number", "minimum": 0, "maximum": 1},
                        "pass_fail": {"type": "boolean"},
                    },
                },
            },
        },
    }


def _candidate_aggregate_score(item: dict[str, Any]) -> float:
    semantic = max(0.0, min(1.0, _as_float(item.get("semantic_score"))))
    temporal = max(0.0, min(1.0, _as_float(item.get("temporal_score"))))
    branding = max(0.0, min(1.0, _as_float(item.get("branding_score"))))
    instruction = max(0.0, min(1.0, _as_float(item.get("instruction_score"))))
    technical = 1.0 if _as_bool(item.get("technical_ok")) else 0.0
    penalty = 0.01 * len(item.get("artifact_flags", []))
    score = (semantic * 0.45) + (temporal * 0.25) + (branding * 0.15) + (technical * 0.10) + (instruction * 0.05) - penalty
    return round(max(0.0, min(1.0, score)), 4)


def _candidate_pass(item: dict[str, Any], threshold: float) -> bool:
    hard_fail = _as_bool(item.get("hard_fail"))
    if hard_fail:
        return False
    semantic = _as_float(item.get("semantic_score"))
    temporal = _as_float(item.get("temporal_score"))
    technical_ok = _as_bool(item.get("technical_ok"))
    return bool(technical_ok and semantic >= threshold and temporal >= threshold)


def normalize_bridge_response(
    response: dict[str, Any],
    *,
    run_id: str,
    attempt: int,
    candidate_ids: list[str],
    threshold: float,
) -> dict[str, Any]:
    if not isinstance(response, dict):
        raise ValueError("Judge response must be a JSON object")
    if str(response.get("run_id", "")).strip() != run_id:
        raise ValueError(f"Judge response run_id mismatch: expected {run_id}")
    if int(response.get("attempt", 0) or 0) != attempt:
        raise ValueError(f"Judge response attempt mismatch: expected {attempt}")

    candidate_set = set(candidate_ids)
    candidates_payload = response.get("candidates")
    if not isinstance(candidates_payload, list) or not candidates_payload:
        raise ValueError("Judge response must include non-empty candidates array")

    normalized_candidates: dict[str, dict[str, Any]] = {}
    for raw_item in candidates_payload:
        if not isinstance(raw_item, dict):
            continue
        candidate_id = str(raw_item.get("candidate_id", "")).strip()
        if not candidate_id or candidate_id not in candidate_set:
            continue
        item = dict(raw_item)
        if "aggregate_score" not in item:
            item["aggregate_score"] = _candidate_aggregate_score(item)
        else:
            item["aggregate_score"] = round(max(0.0, min(1.0, _as_float(item["aggregate_score"]))), 4)
        if "pass_fail" not in item:
            item["pass_fail"] = _candidate_pass(item, threshold)
        else:
            item["pass_fail"] = _as_bool(item["pass_fail"])
        normalized_candidates[candidate_id] = item

    if not normalized_candidates:
        raise ValueError("Judge response does not contain valid candidate entries")

    best_candidate_id = str(response.get("best_candidate_id", "")).strip()
    if best_candidate_id not in normalized_candidates:
        best_candidate_id = max(
            normalized_candidates.items(),
            key=lambda kv: (1 if _as_bool(kv[1].get("pass_fail")) else 0, _as_float(kv[1].get("aggregate_score"))),
        )[0]

    pass_fail = _as_bool(response.get("pass_fail"))
    if not pass_fail:
        pass_fail = _as_bool(normalized_candidates[best_candidate_id].get("pass_fail"))

    reasons = response.get("reasons")
    if not isinstance(reasons, list):
        reasons = []
    reasons_clean = [str(item).strip() for item in reasons if str(item).strip()]

    overall_feedback = str(response.get("overall_feedback", "")).strip()
    if not overall_feedback:
        overall_feedback = "No overall feedback provided."

    return {
        "run_id": run_id,
        "attempt": attempt,
        "pass_fail": pass_fail,
        "best_candidate_id": best_candidate_id,
        "overall_feedback": overall_feedback,
        "reasons": reasons_clean,
        "candidates": normalized_candidates,
    }


def _write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    _write_text(path, json.dumps(payload, indent=2, sort_keys=True) + "\n")


def _extract_candidate_frames(video_path: Path, out_dir: Path, frame_count: int = 3) -> list[Path]:
    if not video_path.exists():
        return []
    if video_path.stat().st_size < 4096:
        # Skip expensive ffmpeg retries for dry-run placeholders/non-video blobs.
        return []

    out_dir.mkdir(parents=True, exist_ok=True)
    frames: list[Path] = []
    for index in range(1, frame_count + 1):
        frame_path = out_dir / f"frame_{index}.jpg"
        cmd = [
            "ffmpeg",
            "-v",
            "error",
            "-nostdin",
            "-y",
            "-i",
            str(video_path),
            "-vf",
            f"select='eq(n\\,{index * 8})'",
            "-vframes",
            "1",
            str(frame_path),
        ]
        try:
            subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=6)
            if frame_path.exists() and frame_path.stat().st_size > 0:
                frames.append(frame_path.resolve())
        except Exception:
            # Best-effort extraction only; keep bridge flow resilient.
            continue
    return frames


def create_chat_bridge_package(
    *,
    run_dir: Path,
    run_id: str,
    attempt: int,
    prompt: str,
    judge_model_alias: str,
    threshold: float,
    chat_bridge_mode: str,
    candidates: list[dict[str, Any]],
    source_evidence: list[dict[str, Any]] | None = None,
) -> dict[str, str]:
    bridge_root = run_dir / "bridge" / f"attempt-{attempt:02d}"
    bridge_root.mkdir(parents=True, exist_ok=True)

    schema_path = bridge_root / "judge_schema.json"
    request_json_path = bridge_root / "judge_request.json"
    request_md_path = bridge_root / "judge_request.md"
    response_template_path = bridge_root / "judge_response.template.json"

    candidate_rows: list[dict[str, Any]] = []
    for row in candidates:
        candidate_path = Path(str(row.get("path", ""))).resolve()
        evidence_dir = bridge_root / "evidence" / str(row.get("candidate_id", "candidate"))
        frame_paths = _extract_candidate_frames(candidate_path, evidence_dir, frame_count=3)
        candidate_rows.append(
            {
                "candidate_id": row.get("candidate_id"),
                "attempt": row.get("attempt"),
                "index": row.get("index"),
                "video_path": str(candidate_path),
                "bytes": row.get("bytes"),
                "mime": row.get("mime", "video/mp4"),
                "frame_paths": [str(path) for path in frame_paths],
                "response": row.get("response", {}),
            }
        )

    request_payload = {
        "run_id": run_id,
        "attempt": attempt,
        "judge_mode": "chat_bridge",
        "judge_model_alias": judge_model_alias,
        "chat_bridge_mode": chat_bridge_mode,
        "threshold": threshold,
        "prompt": prompt,
        "source_evidence": source_evidence or [],
        "candidate_count": len(candidate_rows),
        "candidates": candidate_rows,
        "response_contract": bridge_judge_schema(),
    }
    _write_json(request_json_path, request_payload)
    _write_json(schema_path, bridge_judge_schema())

    template = {
        "run_id": run_id,
        "attempt": attempt,
        "pass_fail": False,
        "best_candidate_id": candidate_rows[0]["candidate_id"] if candidate_rows else "",
        "overall_feedback": "Replace with your decision.",
        "reasons": ["Add concrete acceptance/rejection reasons."],
        "candidates": [
            {
                "candidate_id": row["candidate_id"],
                "semantic_score": 0.0,
                "temporal_score": 0.0,
                "branding_score": 0.0,
                "instruction_score": 0.0,
                "technical_ok": True,
                "artifact_flags": [],
                "reasons": [],
                "fix_instructions": [],
                "hard_fail": False,
            }
            for row in candidate_rows
        ],
    }
    _write_json(response_template_path, template)

    lines: list[str] = []
    lines.append("# NVIDIA Video Forge Chat-Bridge Judge Request")
    lines.append("")
    lines.append(f"- run_id: `{run_id}`")
    lines.append(f"- attempt: `{attempt}`")
    lines.append(f"- judge_model_alias: `{judge_model_alias}`")
    lines.append(f"- threshold: `{threshold}`")
    lines.append("")
    lines.append("## Instructions")
    lines.append("")
    lines.append("1. Review source evidence and all candidate videos/keyframes.")
    lines.append("2. Fill `judge_response.json` using `judge_schema.json`.")
    lines.append("3. Keep scores in range `0..1` and provide concrete fix instructions.")
    lines.append("")
    if source_evidence:
        lines.append("## Source Evidence")
        lines.append("")
        for source in source_evidence:
            label = str(source.get("label", "source")).strip() or "source"
            lines.append(f"### {label}")
            lines.append(f"- source_type: `{source.get('source_type', 'unknown')}`")
            lines.append(f"- url: `{source.get('url', '')}`")
            if source.get("title"):
                lines.append(f"- title: `{source.get('title')}`")
            if source.get("video_path"):
                lines.append(f"- video: `{source.get('video_path')}`")
            transcript_excerpt = str(source.get("transcript_excerpt", "")).strip()
            if transcript_excerpt:
                lines.append(f"- transcript_excerpt: `{transcript_excerpt}`")
            lines.append("")
            frame_paths = source.get("frame_paths", [])
            if isinstance(frame_paths, list) and frame_paths:
                for idx, frame in enumerate(frame_paths, start=1):
                    lines.append(f"- source frame {idx}: `{frame}`")
                    lines.append(f"![{label}-frame-{idx}]({frame})")
                    lines.append("")
            else:
                lines.append("- no extracted source frames")
                lines.append("")

    lines.append("## Prompt")
    lines.append("")
    lines.append(prompt)
    lines.append("")
    lines.append("## Candidates")
    lines.append("")
    for row in candidate_rows:
        lines.append(f"### {row['candidate_id']}")
        lines.append(f"- video: `{row['video_path']}`")
        lines.append(f"- bytes: `{row['bytes']}`")
        lines.append("")
        frame_paths = row.get("frame_paths", [])
        if frame_paths:
            for idx, frame in enumerate(frame_paths, start=1):
                lines.append(f"- frame {idx}: `{frame}`")
                lines.append(f"![{row['candidate_id']}-frame-{idx}]({frame})")
                lines.append("")
        else:
            lines.append("- no extracted frames")
            lines.append("")
    _write_text(request_md_path, "\n".join(lines).strip() + "\n")

    return {
        "bridge_dir": str(bridge_root.resolve()),
        "judge_schema": str(schema_path.resolve()),
        "judge_request_json": str(request_json_path.resolve()),
        "judge_request_md": str(request_md_path.resolve()),
        "judge_response_template": str(response_template_path.resolve()),
    }


def load_bridge_response(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(payload, dict):
        raise ValueError("Judge response must be a JSON object")
    return payload
