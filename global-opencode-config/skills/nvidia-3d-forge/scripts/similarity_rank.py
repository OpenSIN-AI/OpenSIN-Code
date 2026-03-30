#!/usr/bin/env python3
"""Deterministic image similarity scorer for candidate ranking.

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
import json
from pathlib import Path
from typing import Tuple

from PIL import Image, ImageFilter, ImageOps


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Deterministic image similarity scorer")
    p.add_argument("--reference-image", required=True)
    p.add_argument("--candidate-image", required=True)
    p.add_argument("--threshold", type=float, default=0.72)
    p.add_argument("--size", type=int, default=128)
    p.add_argument("--dry-run", action="store_true")
    return p.parse_args()


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
    # 768 bins
    num = 0.0
    den = 0.0
    for x, y in zip(ah, bh):
        num += min(x, y)
        den += max(x, y)
    if den <= 0:
        return 0.0
    return max(0.0, min(1.0, num / den))


def edge_similarity(a: Image.Image, b: Image.Image, size: int) -> float:
    ea = ImageOps.grayscale(a).resize((size, size), Image.Resampling.BILINEAR).filter(ImageFilter.FIND_EDGES)
    eb = ImageOps.grayscale(b).resize((size, size), Image.Resampling.BILINEAR).filter(ImageFilter.FIND_EDGES)
    pa = list(ea.getdata())
    pb = list(eb.getdata())
    if not pa or len(pa) != len(pb):
        return 0.0
    diff = sum(abs(x - y) for x, y in zip(pa, pb)) / (255.0 * len(pa))
    return max(0.0, min(1.0, 1.0 - diff))


def silhouette_fill(img: Image.Image, size: int) -> float:
    g = ImageOps.grayscale(img).resize((size, size), Image.Resampling.BILINEAR)
    px = list(g.getdata())
    if not px:
        return 0.0
    # non-black proxy for occupied silhouette in rendered probes
    active = sum(1 for v in px if v > 12)
    return active / len(px)


def score_pair(ref_path: Path, cand_path: Path, size: int) -> Tuple[float, list[str], dict]:
    ref = Image.open(ref_path).convert("RGB")
    cand = Image.open(cand_path).convert("RGB")

    d = dhash_similarity(ref, cand, size=16)
    h = histogram_similarity(ref, cand)
    e = edge_similarity(ref, cand, size=size)
    rf = silhouette_fill(ref, size=size)
    cf = silhouette_fill(cand, size=size)
    fill_delta = abs(rf - cf)

    score = (0.45 * d) + (0.30 * e) + (0.25 * h)
    if fill_delta > 0.45:
        score -= 0.20
    elif fill_delta > 0.30:
        score -= 0.10

    score = max(0.0, min(1.0, score))

    mismatches: list[str] = []
    if d < 0.55:
        mismatches.append("shape hash mismatch")
    if e < 0.45:
        mismatches.append("edge structure mismatch")
    if h < 0.35:
        mismatches.append("color/material mismatch")
    if fill_delta > 0.30:
        mismatches.append("silhouette occupancy mismatch")

    metrics = {
        "dhash": round(d, 4),
        "edge": round(e, 4),
        "histogram": round(h, 4),
        "ref_fill": round(rf, 4),
        "cand_fill": round(cf, 4),
        "fill_delta": round(fill_delta, 4),
    }
    return score, mismatches, metrics


def main() -> int:
    args = parse_args()
    if args.dry_run:
        print(json.dumps({"pass": True, "score": 1.0, "notes": "dry-run", "mismatches": []}))
        return 0

    ref_path = Path(args.reference_image).expanduser().resolve()
    cand_path = Path(args.candidate_image).expanduser().resolve()
    if not ref_path.exists():
        print(json.dumps({"pass": False, "score": 0.0, "notes": f"reference missing: {ref_path}", "mismatches": ["missing_reference"]}))
        return 0
    if not cand_path.exists():
        print(json.dumps({"pass": False, "score": 0.0, "notes": f"candidate missing: {cand_path}", "mismatches": ["missing_candidate"]}))
        return 0

    try:
        score, mismatches, metrics = score_pair(ref_path, cand_path, args.size)
    except Exception as exc:
        print(json.dumps({"pass": False, "score": 0.0, "notes": f"scoring error: {exc}", "mismatches": ["scoring_error"]}))
        return 0

    passed = score >= float(args.threshold)
    notes = f"dhash={metrics['dhash']}, edge={metrics['edge']}, hist={metrics['histogram']}, fill_delta={metrics['fill_delta']}"
    out = {
        "pass": passed,
        "score": round(score, 4),
        "notes": notes,
        "mismatches": mismatches,
        "metrics": metrics,
    }
    print(json.dumps(out))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
