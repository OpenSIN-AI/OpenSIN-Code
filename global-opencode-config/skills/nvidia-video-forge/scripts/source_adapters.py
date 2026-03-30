#!/usr/bin/env python3
"""Source adapters for multi-input video workflows."""

from __future__ import annotations

import json
import mimetypes
import os
from pathlib import Path
import re
import subprocess
import sys
from typing import Any
from urllib.parse import parse_qs, urljoin, urlparse
from urllib.request import Request, urlopen


def _now_iso() -> str:
    import time

    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _norm_url(url: str) -> str:
    return str(url or "").strip()


def _safe_read_url(url: str, timeout: int = 20) -> str:
    req = Request(
        url=url,
        method="GET",
        headers={
            "User-Agent": "nvidia-video-forge/1.0 (+source-adapter)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def _extract_links(base_url: str, html_text: str) -> list[str]:
    links: list[str] = []
    for raw in re.findall(r"""href=["']([^"'#]+)["']""", html_text, flags=re.IGNORECASE):
        url = _norm_url(raw)
        if not url:
            continue
        full = urljoin(base_url, url)
        if full.startswith("http://") or full.startswith("https://"):
            links.append(full)
    deduped: list[str] = []
    seen: set[str] = set()
    for url in links:
        if url in seen:
            continue
        seen.add(url)
        deduped.append(url)
    return deduped


def _extract_images(base_url: str, html_text: str) -> list[str]:
    urls: list[str] = []
    for raw in re.findall(r"""(?:src|content)=["']([^"'#]+)["']""", html_text, flags=re.IGNORECASE):
        value = _norm_url(raw)
        if not value:
            continue
        full = urljoin(base_url, value)
        lower = full.lower()
        if any(lower.endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif"]):
            urls.append(full)
    deduped: list[str] = []
    seen: set[str] = set()
    for url in urls:
        if url in seen:
            continue
        seen.add(url)
        deduped.append(url)
    return deduped


def _extract_title(html_text: str) -> str:
    match = re.search(r"<title[^>]*>(.*?)</title>", html_text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return " ".join(match.group(1).split()).strip()


def _extract_text_excerpt(html_text: str, max_chars: int = 1200) -> str:
    no_script = re.sub(r"<script[\s\S]*?</script>", " ", html_text, flags=re.IGNORECASE)
    no_style = re.sub(r"<style[\s\S]*?</style>", " ", no_script, flags=re.IGNORECASE)
    plain = re.sub(r"<[^>]+>", " ", no_style)
    plain = " ".join(plain.split())
    return plain[:max_chars]


def _crawl_site(seed_url: str, *, max_pages: int, max_depth: int) -> list[dict[str, Any]]:
    seed = _norm_url(seed_url)
    if not seed:
        return []
    parsed_seed = urlparse(seed)
    host = parsed_seed.netloc.lower()
    queue: list[tuple[str, int]] = [(seed, 0)]
    seen: set[str] = set()
    pages: list[dict[str, Any]] = []

    while queue and len(pages) < max_pages:
        current, depth = queue.pop(0)
        if current in seen:
            continue
        seen.add(current)
        try:
            html_text = _safe_read_url(current)
        except Exception as exc:  # noqa: BLE001
            pages.append({"url": current, "depth": depth, "error": str(exc)})
            continue

        page = {
            "url": current,
            "depth": depth,
            "title": _extract_title(html_text),
            "text_excerpt": _extract_text_excerpt(html_text),
            "image_urls": _extract_images(current, html_text)[:40],
            "links": [],
        }
        pages.append(page)

        if depth >= max_depth:
            continue
        for link in _extract_links(current, html_text):
            parsed_link = urlparse(link)
            if parsed_link.netloc.lower() != host:
                continue
            if link in seen:
                continue
            page["links"].append(link)
            queue.append((link, depth + 1))
    return pages


def _media_meta(path: Path) -> dict[str, Any]:
    mime, _ = mimetypes.guess_type(path.name)
    return {
        "path": str(path.resolve()),
        "exists": path.exists(),
        "bytes": path.stat().st_size if path.exists() else 0,
        "mime": mime or "application/octet-stream",
    }


def _youtube_video_id(url: str) -> str:
    raw = _norm_url(url)
    if not raw:
        return ""
    parsed = urlparse(raw)
    host = parsed.netloc.lower()
    path = parsed.path.strip("/")
    if host.endswith("youtu.be"):
        return path.split("/")[0] if path else ""
    if "youtube.com" in host:
        if path == "watch":
            return parse_qs(parsed.query).get("v", [""])[0]
        if path.startswith("shorts/"):
            return path.split("/", 1)[1].split("/")[0]
        if path.startswith("live/"):
            return path.split("/", 1)[1].split("/")[0]
        if path.startswith("embed/"):
            return path.split("/", 1)[1].split("/")[0]
    return ""


def _youtube_metadata_yt_dlp(url: str) -> dict[str, Any]:
    cmd = ["yt-dlp", "--skip-download", "--dump-single-json", url]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=45)
    except Exception as exc:  # noqa: BLE001
        return {"url": url, "error": str(exc)}
    if proc.returncode != 0:
        return {"url": url, "error": proc.stderr.strip() or proc.stdout.strip() or "yt-dlp failed"}
    try:
        payload = json.loads(proc.stdout)
    except Exception as exc:  # noqa: BLE001
        return {"url": url, "error": f"Invalid yt-dlp JSON: {exc}"}
    return {
        "url": url,
        "id": str(payload.get("id", "")),
        "title": str(payload.get("title", "")),
        "channel": str(payload.get("channel", "")),
        "uploader": str(payload.get("uploader", "")),
        "duration": payload.get("duration"),
        "thumbnail": payload.get("thumbnail"),
        "webpage_url": payload.get("webpage_url"),
        "description_excerpt": str(payload.get("description", ""))[:800],
    }


def _youtube_metadata_google_api(
    *,
    video_id: str,
    service_account_json: str,
    google_api_key_env: str,
) -> dict[str, Any]:
    result: dict[str, Any] = {"video_id": video_id, "auth_attempts": []}
    if not video_id:
        result["error"] = "missing_video_id"
        return result

    runner = r"""
import json
import os
import sys
from pathlib import Path

video_id = sys.argv[1]
service_account_json = sys.argv[2]
google_api_key_env = sys.argv[3]
result = {"video_id": video_id, "auth_attempts": []}

def add_payload(response, mode):
    items = response.get("items", []) if isinstance(response, dict) else []
    if not items:
        result["auth_attempts"].append({"mode": mode, "ok": False, "error": "no_items"})
        return False
    item = items[0]
    snippet = item.get("snippet", {}) if isinstance(item.get("snippet"), dict) else {}
    content = item.get("contentDetails", {}) if isinstance(item.get("contentDetails"), dict) else {}
    stats = item.get("statistics", {}) if isinstance(item.get("statistics"), dict) else {}
    status = item.get("status", {}) if isinstance(item.get("status"), dict) else {}
    result["source"] = mode
    result["title"] = str(snippet.get("title", ""))
    result["channel_title"] = str(snippet.get("channelTitle", ""))
    result["published_at"] = str(snippet.get("publishedAt", ""))
    result["description_excerpt"] = str(snippet.get("description", ""))[:800]
    result["duration_iso8601"] = str(content.get("duration", ""))
    result["definition"] = str(content.get("definition", ""))
    result["caption"] = str(content.get("caption", ""))
    result["view_count"] = str(stats.get("viewCount", ""))
    result["like_count"] = str(stats.get("likeCount", ""))
    result["privacy_status"] = str(status.get("privacyStatus", ""))
    thumbs = snippet.get("thumbnails", {}) if isinstance(snippet.get("thumbnails"), dict) else {}
    high = thumbs.get("high", {}) if isinstance(thumbs.get("high"), dict) else {}
    result["thumbnail"] = str(high.get("url", ""))
    result["auth_attempts"].append({"mode": mode, "ok": True})
    return True

try:
    from googleapiclient.discovery import build
except Exception as exc:
    result["error"] = f"googleapiclient unavailable: {exc}"
    print(json.dumps(result))
    raise SystemExit(0)

service_account_path = Path(service_account_json).expanduser().resolve() if service_account_json else None
if service_account_path and service_account_path.exists():
    try:
        from google.oauth2 import service_account
        creds = service_account.Credentials.from_service_account_file(
            str(service_account_path),
            scopes=["https://www.googleapis.com/auth/youtube.readonly"],
        )
        service = build("youtube", "v3", credentials=creds, cache_discovery=False)
        response = service.videos().list(part="snippet,contentDetails,statistics,status", id=video_id, maxResults=1).execute()
        if add_payload(response, "google_api_service_account"):
            print(json.dumps(result))
            raise SystemExit(0)
    except Exception as exc:
        result["auth_attempts"].append({"mode": "service_account", "ok": False, "error": str(exc)})
elif service_account_json:
    result["auth_attempts"].append({"mode": "service_account", "ok": False, "error": "service_account_file_missing"})

api_key = os.getenv(google_api_key_env, "").strip()
if api_key:
    try:
        service = build("youtube", "v3", developerKey=api_key, cache_discovery=False)
        response = service.videos().list(part="snippet,contentDetails,statistics,status", id=video_id, maxResults=1).execute()
        if add_payload(response, "google_api_key"):
            print(json.dumps(result))
            raise SystemExit(0)
    except Exception as exc:
        result["auth_attempts"].append({"mode": "api_key", "ok": False, "error": str(exc), "env": google_api_key_env})
else:
    result["auth_attempts"].append({"mode": "api_key", "ok": False, "error": "missing_api_key_env", "env": google_api_key_env})

result["error"] = "google_api_lookup_failed"
print(json.dumps(result))
"""

    try:
        proc = subprocess.run(
            [sys.executable, "-c", runner, video_id, service_account_json, google_api_key_env],
            capture_output=True,
            text=True,
            timeout=25,
        )
    except subprocess.TimeoutExpired:
        result["error"] = "google_api_timeout"
        return result
    except Exception as exc:  # noqa: BLE001
        result["error"] = f"google_api_subprocess_error: {exc}"
        return result

    output = (proc.stdout or "").strip()
    if not output:
        result["error"] = (proc.stderr or "").strip() or "google_api_empty_response"
        return result
    try:
        payload = json.loads(output)
    except json.JSONDecodeError:
        result["error"] = output[:300]
        return result
    if not isinstance(payload, dict):
        result["error"] = "google_api_non_object_response"
        return result
    return payload


def _extract_video_frames(video_path: Path, out_dir: Path, frame_count: int) -> list[str]:
    if not video_path.exists():
        return []
    if frame_count < 1:
        return []

    out_dir.mkdir(parents=True, exist_ok=True)
    pattern = out_dir / "frame_%03d.jpg"
    cmd = [
        "ffmpeg",
        "-v",
        "error",
        "-nostdin",
        "-y",
        "-i",
        str(video_path),
        "-vf",
        "fps=1,scale='min(1280,iw)':-2",
        "-frames:v",
        str(frame_count),
        str(pattern),
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=80)
    except Exception:
        return []
    if proc.returncode != 0:
        return []
    return [str(path.resolve()) for path in sorted(out_dir.glob("frame_*.jpg")) if path.exists() and path.stat().st_size > 0]


def _download_youtube_video(url: str, out_dir: Path, video_id: str) -> tuple[Path | None, str | None]:
    out_dir.mkdir(parents=True, exist_ok=True)
    template = out_dir / f"{video_id or 'youtube_source'}.%(ext)s"
    cmd = [
        "yt-dlp",
        "--no-playlist",
        "--no-part",
        "--merge-output-format",
        "mp4",
        "-f",
        "mp4[height<=1080]/mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "-o",
        str(template),
        url,
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)
    if proc.returncode != 0:
        err = proc.stderr.strip() or proc.stdout.strip() or "yt-dlp download failed"
        return None, err

    candidates = sorted(out_dir.glob(f"{video_id or 'youtube_source'}.*"))
    for candidate in candidates:
        if candidate.suffix.lower() in {".mp4", ".mkv", ".webm", ".mov"} and candidate.exists() and candidate.stat().st_size > 0:
            return candidate.resolve(), None
    return None, "download completed but output media file not found"


def _youtube_source_bundle(
    *,
    url: str,
    source_root: Path,
    compliance_mode: str,
    dry_run: bool,
    include_source_media: bool,
    source_frame_count: int,
    service_account_json: str,
    google_api_key_env: str,
) -> dict[str, Any]:
    raw_url = _norm_url(url)
    video_id = _youtube_video_id(raw_url)
    yt_meta = _youtube_metadata_yt_dlp(raw_url)
    google_meta = _youtube_metadata_google_api(
        video_id=video_id or str(yt_meta.get("id", "")),
        service_account_json=service_account_json,
        google_api_key_env=google_api_key_env,
    )

    item: dict[str, Any] = {
        "url": raw_url,
        "id": video_id or str(yt_meta.get("id", "")),
        "title": str(google_meta.get("title") or yt_meta.get("title") or ""),
        "channel": str(google_meta.get("channel_title") or yt_meta.get("channel") or yt_meta.get("uploader") or ""),
        "duration": yt_meta.get("duration"),
        "thumbnail": str(google_meta.get("thumbnail") or yt_meta.get("thumbnail") or ""),
        "webpage_url": str(yt_meta.get("webpage_url") or raw_url),
        "google_api": google_meta,
        "yt_dlp": yt_meta,
        "source_media": {
            "enabled": bool(include_source_media),
            "downloaded": False,
            "video_path": "",
            "frame_paths": [],
            "download_error": "",
            "download_skipped_reason": "",
        },
    }

    if not include_source_media:
        item["source_media"]["download_skipped_reason"] = "youtube_source_media_disabled"
        return item
    if compliance_mode == "strict":
        item["source_media"]["download_skipped_reason"] = "compliance_mode_strict_blocks_media_download"
        return item
    if dry_run:
        item["source_media"]["download_skipped_reason"] = "dry_run"
        return item

    media_dir = source_root / (item["id"] or "unknown")
    video_path, download_error = _download_youtube_video(raw_url, media_dir, item["id"])
    if video_path is None:
        item["source_media"]["download_error"] = download_error or "download_failed"
        return item

    frame_paths = _extract_video_frames(
        video_path=video_path,
        out_dir=media_dir / "frames",
        frame_count=max(1, int(source_frame_count)),
    )
    item["source_media"]["downloaded"] = True
    item["source_media"]["video_path"] = str(video_path)
    item["source_media"]["frame_paths"] = frame_paths
    return item


def build_asset_graph(
    *,
    input_images: list[Path],
    input_videos: list[Path],
    input_audios: list[Path],
    input_product_images: list[Path],
    input_person_images: list[Path],
    input_urls: list[str],
    input_blog_urls: list[str],
    input_youtube_urls: list[str],
    style_url: str,
    brand_url: str,
    brand_logo: str,
    overlay_templates: list[str],
    overlay_files: list[Path],
    crawl_max_pages: int,
    crawl_max_depth: int,
    compliance_mode: str,
    youtube_source_root: Path,
    google_service_account_json: str,
    google_api_key_env: str,
    youtube_include_source_media: bool,
    youtube_source_frame_count: int,
    dry_run: bool,
) -> dict[str, Any]:
    warnings: list[str] = []
    effective_max_pages = max(1, int(crawl_max_pages))
    effective_max_depth = max(0, int(crawl_max_depth))
    if compliance_mode == "strict":
        effective_max_pages = min(effective_max_pages, 20)
        effective_max_depth = min(effective_max_depth, 1)
        warnings.append("compliance_mode=strict limits crawl breadth/depth")
    elif compliance_mode == "warn":
        warnings.append("compliance_mode=warn does not block crawling; review rights/compliance manually")

    pages: list[dict[str, Any]] = []
    crawl_targets = [u for u in input_urls + input_blog_urls if _norm_url(u)]
    for seed in crawl_targets:
        pages.extend(
            _crawl_site(
                seed,
                max_pages=max_pages_per_target(effective_max_pages, len(crawl_targets)),
                max_depth=effective_max_depth,
            )
        )

    if style_url and _norm_url(style_url) not in crawl_targets:
        pages.extend(
            _crawl_site(
                style_url,
                max_pages=max_pages_per_target(effective_max_pages, len(crawl_targets) + 1),
                max_depth=effective_max_depth,
            )
        )
    if brand_url and _norm_url(brand_url) not in crawl_targets and _norm_url(brand_url) != _norm_url(style_url):
        pages.extend(
            _crawl_site(
                brand_url,
                max_pages=max_pages_per_target(effective_max_pages, len(crawl_targets) + 1),
                max_depth=effective_max_depth,
            )
        )

    youtube_items = [
        _youtube_source_bundle(
            url=_norm_url(url),
            source_root=youtube_source_root,
            compliance_mode=compliance_mode,
            dry_run=dry_run,
            include_source_media=youtube_include_source_media,
            source_frame_count=youtube_source_frame_count,
            service_account_json=google_service_account_json,
            google_api_key_env=google_api_key_env,
        )
        for url in input_youtube_urls
        if _norm_url(url)
    ]

    return {
        "timestamp": _now_iso(),
        "compliance_mode": compliance_mode,
        "compliance_warnings": warnings,
        "crawl_policy": {
            "requested_max_pages": crawl_max_pages,
            "requested_max_depth": crawl_max_depth,
            "effective_max_pages": effective_max_pages,
            "effective_max_depth": effective_max_depth,
        },
        "youtube_ingest": {
            "source_media_enabled": bool(youtube_include_source_media),
            "source_frame_count": max(1, int(youtube_source_frame_count)),
            "google_service_account_json": str(Path(google_service_account_json).expanduser().resolve()) if google_service_account_json else "",
            "google_api_key_env": google_api_key_env,
            "dry_run": bool(dry_run),
        },
        "inputs": {
            "images": [_media_meta(path) for path in input_images],
            "videos": [_media_meta(path) for path in input_videos],
            "audios": [_media_meta(path) for path in input_audios],
            "product_images": [_media_meta(path) for path in input_product_images],
            "person_images": [_media_meta(path) for path in input_person_images],
            "urls": [_norm_url(url) for url in input_urls if _norm_url(url)],
            "blog_urls": [_norm_url(url) for url in input_blog_urls if _norm_url(url)],
            "youtube_urls": [_norm_url(url) for url in input_youtube_urls if _norm_url(url)],
            "style_url": _norm_url(style_url),
            "brand_url": _norm_url(brand_url),
            "brand_logo": _norm_url(brand_logo),
            "overlay_templates": [item.strip() for item in overlay_templates if item.strip()],
            "overlay_files": [_media_meta(path) for path in overlay_files],
        },
        "web_pages": pages,
        "youtube_items": youtube_items,
    }


def max_pages_per_target(total_max_pages: int, target_count: int) -> int:
    count = max(1, target_count)
    return max(1, int(total_max_pages / count))


def write_asset_outputs(asset_graph: dict[str, Any], out_dir: Path) -> dict[str, str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    asset_graph_path = out_dir / "asset_graph.json"
    report_path = out_dir / "source_report.md"
    asset_graph_path.write_text(json.dumps(asset_graph, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    pages = asset_graph.get("web_pages", [])
    youtube_items = asset_graph.get("youtube_items", [])
    inputs = asset_graph.get("inputs", {})
    yt_cfg = asset_graph.get("youtube_ingest", {})

    lines: list[str] = []
    lines.append("# Source Report")
    lines.append("")
    lines.append(f"- compliance_mode: `{asset_graph.get('compliance_mode', 'override')}`")
    warnings = asset_graph.get("compliance_warnings", [])
    if isinstance(warnings, list) and warnings:
        lines.append(f"- compliance_warnings: `{'; '.join(str(item) for item in warnings)}`")
    policy = asset_graph.get("crawl_policy", {})
    if isinstance(policy, dict):
        lines.append(
            "- crawl_policy: "
            f"requested_pages={policy.get('requested_max_pages')}, "
            f"requested_depth={policy.get('requested_max_depth')}, "
            f"effective_pages={policy.get('effective_max_pages')}, "
            f"effective_depth={policy.get('effective_max_depth')}"
        )
    if isinstance(yt_cfg, dict):
        lines.append(
            "- youtube_ingest: "
            f"source_media_enabled={yt_cfg.get('source_media_enabled')}, "
            f"source_frame_count={yt_cfg.get('source_frame_count')}, "
            f"google_api_env={yt_cfg.get('google_api_key_env')}"
        )
    lines.append(f"- web_pages: `{len(pages)}`")
    lines.append(f"- youtube_items: `{len(youtube_items)}`")
    lines.append("")
    lines.append("## Input Summary")
    lines.append("")
    lines.append(f"- images: `{len(inputs.get('images', []))}`")
    lines.append(f"- videos: `{len(inputs.get('videos', []))}`")
    lines.append(f"- audios: `{len(inputs.get('audios', []))}`")
    lines.append(f"- product_images: `{len(inputs.get('product_images', []))}`")
    lines.append(f"- person_images: `{len(inputs.get('person_images', []))}`")
    lines.append(f"- urls: `{len(inputs.get('urls', []))}`")
    lines.append(f"- blog_urls: `{len(inputs.get('blog_urls', []))}`")
    lines.append(f"- youtube_urls: `{len(inputs.get('youtube_urls', []))}`")
    lines.append("")
    lines.append("## Top Web Pages")
    lines.append("")
    for page in pages[:20]:
        lines.append(f"- `{page.get('url', '')}` depth=`{page.get('depth', 0)}` title=`{page.get('title', '')}`")
    lines.append("")
    lines.append("## YouTube")
    lines.append("")
    for item in youtube_items[:20]:
        source_media = item.get("source_media", {}) if isinstance(item.get("source_media"), dict) else {}
        downloaded = bool(source_media.get("downloaded"))
        frame_count = len(source_media.get("frame_paths", [])) if isinstance(source_media.get("frame_paths"), list) else 0
        google_source = item.get("google_api", {}).get("source") if isinstance(item.get("google_api"), dict) else None
        if item.get("error"):
            lines.append(f"- `{item.get('url', '')}` error: `{item.get('error', '')}`")
            continue
        lines.append(
            f"- `{item.get('title', '')}` (`{item.get('url', '')}`) "
            f"google_source=`{google_source or 'none'}` downloaded=`{downloaded}` frames=`{frame_count}`"
        )
        if source_media.get("download_error"):
            lines.append(f"  - download_error: `{source_media.get('download_error')}`")
        if source_media.get("download_skipped_reason"):
            lines.append(f"  - skipped: `{source_media.get('download_skipped_reason')}`")
    report_path.write_text("\n".join(lines).strip() + "\n", encoding="utf-8")
    return {
        "asset_graph": str(asset_graph_path.resolve()),
        "source_report": str(report_path.resolve()),
    }
