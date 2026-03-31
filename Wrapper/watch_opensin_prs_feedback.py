#!/usr/bin/env python3
"""Lightweight watcher for OpenSIN PRs #18 and #19.

Polls GitHub every 3 minutes, logs new review comments/approvals/merges,
and writes a plain-text summary for operator review.
"""

from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = os.environ.get("PR_WATCH_REMOTE_REPO", "SIN-Solver/OpenSIN")
PR_NUMBERS = [18, 19]
STATE_DIR = Path(
    os.environ.get("PR_WATCH_STATE_DIR", Path.home() / ".local/state/opensin-pr-watch")
)
STATE_FILE = STATE_DIR / "state.json"
SUMMARY_FILE = STATE_DIR / "latest-feedback-summary.txt"
WATCH_LOG = STATE_DIR / "watch.log"
POLL_INTERVAL = int(os.environ.get("PR_WATCH_INTERVAL", "180"))
IGNORE_AUTHORS = {"github-actions[bot]", "codecov", "copilot-pull-request-reviewer"}

_running = True


def sig_handler(sig, frame):
    global _running
    _running = False


signal.signal(signal.SIGTERM, sig_handler)
signal.signal(signal.SIGINT, sig_handler)


def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    line = f"[{ts}] {msg}"
    print(line, flush=True)
    with open(WATCH_LOG, "a") as f:
        f.write(line + "\n")


def gh(*args) -> dict | list:
    result = subprocess.run(
        ["gh", *args, "--json", *[a for a in args if a.startswith("--")]],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return {}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {}


def fetch_pr_state(pr: int) -> dict:
    """Fetch PR state: title, state, reviews, comments."""
    result = subprocess.run(
        [
            "gh",
            "pr",
            "view",
            str(pr),
            "--repo",
            REPO,
            "--json",
            "number,title,state,mergedAt,reviews,comments,reviewRequests,isDraft",
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return {}
    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {}


def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {"prs": {}}


def save_state(state: dict) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))


def write_summary(events: list[str]) -> None:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        f"# OpenSIN PR Watcher — {ts}",
        f"Watching PRs: {PR_NUMBERS}",
        f"Repo: {REPO}",
        "",
    ]
    lines += events if events else ["No new events since last poll."]
    SUMMARY_FILE.write_text("\n".join(lines) + "\n")


def check_prs(state: dict) -> list[str]:
    events = []
    for pr_num in PR_NUMBERS:
        data = fetch_pr_state(pr_num)
        if not data:
            log(f"PR #{pr_num}: failed to fetch state")
            continue

        pr_state_key = str(pr_num)
        prev = state["prs"].get(pr_state_key, {})

        pr_status = data.get("state", "UNKNOWN")
        merged_at = data.get("mergedAt")
        title = data.get("title", "")

        # Detect merge
        if merged_at and not prev.get("mergedAt"):
            events.append(f"🎉 PR #{pr_num} MERGED: {title}")
            log(f"PR #{pr_num} merged at {merged_at}")

        # Detect new reviews
        reviews = data.get("reviews", [])
        prev_review_ids = set(prev.get("reviewIds", []))
        for review in reviews:
            rid = review.get("id", "")
            author = review.get("author", {}).get("login", "")
            if rid in prev_review_ids or author in IGNORE_AUTHORS:
                continue
            state_val = review.get("state", "")
            body = (review.get("body") or "")[:120]
            events.append(f"📝 PR #{pr_num} review [{state_val}] by @{author}: {body}")
            log(f"PR #{pr_num} new review {rid} from {author}: {state_val}")

        # Detect new comments
        comments = data.get("comments", [])
        prev_comment_ids = set(prev.get("commentIds", []))
        for comment in comments:
            cid = str(comment.get("id", ""))
            author = comment.get("author", {}).get("login", "")
            if cid in prev_comment_ids or author in IGNORE_AUTHORS:
                continue
            body = (comment.get("body") or "")[:120]
            events.append(f"💬 PR #{pr_num} comment by @{author}: {body}")
            log(f"PR #{pr_num} new comment {cid} from {author}")

        # Save updated state
        state["prs"][pr_state_key] = {
            "state": pr_status,
            "mergedAt": merged_at,
            "title": title,
            "reviewIds": [r.get("id", "") for r in reviews],
            "commentIds": [str(c.get("id", "")) for c in comments],
        }

    return events


def loop() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    log(f"OpenSIN PR watcher starting. Watching PRs {PR_NUMBERS} on {REPO}")
    state = load_state()
    while _running:
        try:
            events = check_prs(state)
            save_state(state)
            write_summary(events)
            if events:
                log(f"New events: {len(events)}")
        except Exception as e:
            log(f"ERROR in poll loop: {e}")
        time.sleep(POLL_INTERVAL)
    log("Watcher stopped.")


def status() -> None:
    state = load_state()
    print(f"Watching: {PR_NUMBERS} on {REPO}")
    for pr_num in PR_NUMBERS:
        info = state["prs"].get(str(pr_num), {})
        print(
            f"  PR #{pr_num}: state={info.get('state', '?')} merged={info.get('mergedAt', 'no')} title={info.get('title', '')[:60]}"
        )
    if SUMMARY_FILE.exists():
        print("\n--- Latest summary ---")
        print(SUMMARY_FILE.read_text())


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "loop"
    if cmd == "loop":
        loop()
    elif cmd == "status":
        status()
    elif cmd == "check":
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        state = load_state()
        events = check_prs(state)
        save_state(state)
        write_summary(events)
        print("\n".join(events) if events else "No new events.")
    else:
        print(f"Unknown command: {cmd}. Use loop|status|check")
        sys.exit(1)
