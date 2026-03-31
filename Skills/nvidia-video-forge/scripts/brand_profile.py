#!/usr/bin/env python3
"""Brand profile extraction helpers."""

from __future__ import annotations

from collections import Counter
import json
from pathlib import Path
import re
from typing import Any


def _top_items(values: list[str], limit: int = 8) -> list[str]:
    normalized = [value.strip() for value in values if value and value.strip()]
    if not normalized:
        return []
    counter = Counter(normalized)
    return [item for item, _count in counter.most_common(limit)]


def derive_brand_profile(
    *,
    asset_graph: dict[str, Any],
    brand_url: str,
    style_url: str,
    brand_logo: str,
) -> dict[str, Any]:
    pages = asset_graph.get("web_pages", [])
    css_sources: list[str] = []
    titles: list[str] = []
    logo_candidates: list[str] = []

    for page in pages:
        if not isinstance(page, dict):
            continue
        title = str(page.get("title", "")).strip()
        if title:
            titles.append(title)
        text_excerpt = str(page.get("text_excerpt", ""))
        css_sources.append(text_excerpt)
        for image_url in page.get("image_urls", []) or []:
            text = str(image_url).strip()
            if text:
                logo_candidates.append(text)

    raw_css = "\n".join(css_sources)
    hex_colors = re.findall(r"#[0-9a-fA-F]{3,8}", raw_css)
    font_matches = re.findall(r"font-family\s*:\s*([^;]+);", raw_css, flags=re.IGNORECASE)
    fonts: list[str] = []
    for chunk in font_matches:
        for token in chunk.split(","):
            clean = token.strip().strip("\"'")
            if clean:
                fonts.append(clean)

    if brand_logo.strip():
        logo_candidates.insert(0, brand_logo.strip())

    top_title = titles[0] if titles else ""
    tone_keywords = []
    if top_title:
        tone_keywords.extend([token for token in re.split(r"[^a-zA-Z0-9]+", top_title.lower()) if len(token) >= 4][:10])

    return {
        "brand_url": brand_url.strip(),
        "style_url": style_url.strip(),
        "title_candidates": titles[:20],
        "primary_title": top_title,
        "palette_hex": _top_items(hex_colors, limit=12),
        "font_candidates": _top_items(fonts, limit=10),
        "logo_candidates": _top_items(logo_candidates, limit=15),
        "tone_keywords": _top_items(tone_keywords, limit=10),
    }


def write_brand_profile(profile: dict[str, Any], out_dir: Path) -> str:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "brand_profile.json"
    path.write_text(json.dumps(profile, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return str(path.resolve())
