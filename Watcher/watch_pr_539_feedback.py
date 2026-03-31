#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import signal
import subprocess
import sys
import time
from pathlib import Path


PR_NUMBER = int(os.environ.get("PR_WATCH_NUMBER", "539"))
REMOTE_REPO = os.environ.get(
    "PR_WATCH_REMOTE_REPO", "NoeFabris/opencode-antigravity-auth"
)
LOCAL_REPO = Path(
    os.environ.get(
        "PR_WATCH_LOCAL_REPO", str(Path.home() / "dev/opencode-antigravity-auth-pr")
    )
)
STATE_DIR = Path(
    os.environ.get("PR_WATCH_STATE_DIR", str(Path.home() / ".local/state/pr-539-watch"))
)
STATE_FILE = STATE_DIR / "state.json"
WORKER_PID_FILE = STATE_DIR / "worker.pid"
WATCH_LOG = STATE_DIR / "watch.log"
SUMMARY_FILE = STATE_DIR / "latest-feedback-summary.txt"
POLL_INTERVAL = int(
    os.environ.get("PR_WATCH_INTERVAL", os.environ.get("PR539_WATCH_INTERVAL", "180"))
)
IGNORE_AUTHORS = {
    author.strip()
    for author in os.environ.get("PR_WATCH_IGNORE_AUTHORS", "Delqhi").split(",")
    if author.strip()
}
NOISE_PREFIXES = (
    "/",
    "thanks",
    "thank you",
    "lgtm",
    "looks good",
    "approved",
    "ship it",
)
NOISE_SUBSTRINGS = (
    "no response needed",
    "no action needed",
    "automated review",
    "this is an automated",
    "codecov",
    "copilot",
    "claude code",
)


def ensure_state_dir() -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)


def log_line(message: str) -> None:
    ensure_state_dir()
    with WATCH_LOG.open("a") as fh:
        fh.write(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}\n")


def pid_alive(pid: int) -> bool:
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def load_state() -> dict:
    ensure_state_dir()
    if not STATE_FILE.exists():
        return {"seen": []}
    try:
        return json.loads(STATE_FILE.read_text())
    except Exception:
        return {"seen": []}


def save_state(state: dict) -> None:
    ensure_state_dir()
    STATE_FILE.write_text(json.dumps(state, indent=2))


def write_summary(events: list[dict]) -> None:
    ensure_state_dir()
    if not events:
        SUMMARY_FILE.write_text("No actionable feedback captured yet.\n")
        return

    lines = [
        f"PR #{PR_NUMBER} feedback summary",
        f"repo: {REMOTE_REPO}",
        f"updated: {time.strftime('%Y-%m-%d %H:%M:%S')}",
        "",
    ]
    for event in events:
        body = (event.get("body") or "").strip().replace("\n", " ")
        body = body[:1200]
        state = f" [{event.get('state')}]" if event.get("state") else ""
        lines.append(
            f"- {event['kind']}{state} by {event['author']} at {event['createdAt']}"
        )
        lines.append(f"  {body}")
    SUMMARY_FILE.write_text("\n".join(lines) + "\n")


def run_gh_json(args: list[str]) -> dict:
    raw = subprocess.check_output(args, text=True, cwd=str(LOCAL_REPO))
    return json.loads(raw)


def fetch_events() -> list[dict]:
    data = run_gh_json(
        [
            "gh",
            "pr",
            "view",
            str(PR_NUMBER),
            "-R",
            REMOTE_REPO,
            "--json",
            "comments,reviews,url,title",
        ]
    )
    events: list[dict] = []
    for comment in data.get("comments", []):
        events.append(
            {
                "kind": "comment",
                "id": str(comment.get("id")),
                "author": ((comment.get("author") or {}).get("login") or "unknown"),
                "createdAt": comment.get("createdAt") or "",
                "body": comment.get("body") or "",
                "url": comment.get("url") or data.get("url") or "",
            }
        )
    for review in data.get("reviews", []):
        events.append(
            {
                "kind": "review",
                "id": str(review.get("id")),
                "author": ((review.get("author") or {}).get("login") or "unknown"),
                "createdAt": review.get("submittedAt") or review.get("createdAt") or "",
                "body": review.get("body") or "",
                "state": review.get("state") or "",
                "url": review.get("url") or data.get("url") or "",
            }
        )
    events.sort(key=lambda item: item.get("createdAt", ""))
    return events


def is_actionable_event(event: dict) -> bool:
    author = (event.get("author") or "").strip()
    if not author:
        return False
    if author in IGNORE_AUTHORS:
        return False
    if author.endswith("[bot]"):
        return False

    body = (event.get("body") or "").strip()
    if not body:
        return False

    normalized = " ".join(body.lower().split())
    if len(normalized) < 6:
        return False
    if any(normalized.startswith(prefix) for prefix in NOISE_PREFIXES):
        return False
    if any(fragment in normalized for fragment in NOISE_SUBSTRINGS):
        return False

    state = (event.get("state") or "").strip().upper()
    if event.get("kind") == "review" and state == "APPROVED" and len(normalized) < 40:
        return False

    return True


def notify(text: str) -> None:
    try:
        subprocess.run(
            [
                "osascript",
                "-e",
                f"display notification {json.dumps(text)} with title {json.dumps(f'PR #{PR_NUMBER} Feedback')}",
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass


def spawn_followup(events: list[dict]) -> None:
    ensure_state_dir()
    if WORKER_PID_FILE.exists():
        try:
            pid = int(WORKER_PID_FILE.read_text().strip())
        except Exception:
            pid = 0
        if pid and pid_alive(pid):
            log_line("follow-up worker already running; skipping spawn")
            return
        WORKER_PID_FILE.unlink(missing_ok=True)

    summary_lines = []
    for event in events:
        body = (event.get("body") or "").strip().replace("\n", " ")
        body = body[:600]
        summary_lines.append(
            f"- {event['kind']} by {event['author']} at {event['createdAt']}: {body}"
        )
    summary = "\n".join(summary_lines)
    prompt = (
        f"PR #{PR_NUMBER} in {REMOTE_REPO} received new feedback. "
        f"Review the latest PR comments/reviews with gh, apply any requested changes on the current branch in this repo, "
        f"run npm run build and npm test, push updates if needed, and comment on the PR summarizing your response. "
        f"Focus only on newly arrived feedback.\n\nNew feedback:\n{summary}"
    )
    log_path = STATE_DIR / f"followup-{int(time.time())}.log"
    with log_path.open("a") as fh:
        proc = subprocess.Popen(
            ["opencode", "run", prompt],
            cwd=str(LOCAL_REPO),
            stdout=fh,
            stderr=subprocess.STDOUT,
            text=True,
        )
    WORKER_PID_FILE.write_text(str(proc.pid))
    notify(
        f"New PR #{PR_NUMBER} feedback detected; launched automatic follow-up worker."
    )
    log_line(f"spawned follow-up worker pid={proc.pid} log={log_path}")


def check_once(initialize_only: bool = False) -> int:
    state = load_state()
    seen = set(state.get("seen", []))
    events = fetch_events()
    all_ids = {f"{event['kind']}:{event['id']}" for event in events}
    new_events = [
        event
        for event in events
        if f"{event['kind']}:{event['id']}" not in seen and is_actionable_event(event)
    ]
    state["seen"] = sorted(all_ids)
    save_state(state)
    if initialize_only:
        write_summary([])
        log_line(f"initialized watcher state with {len(all_ids)} events")
        return 0
    if new_events:
        log_line(f"detected {len(new_events)} new feedback event(s)")
        write_summary(new_events)
        spawn_followup(new_events)
        return 1
    write_summary([])
    log_line("no new feedback")
    return 0


def loop() -> int:
    running = True

    def handle_signal(signum, _frame):
        nonlocal running
        log_line(f"received signal {signum}; stopping watcher")
        running = False

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    if not STATE_FILE.exists():
        check_once(initialize_only=True)

    while running:
        try:
            check_once(initialize_only=False)
        except Exception as exc:
            log_line(f"watcher error: {exc}")
        for _ in range(POLL_INTERVAL):
            if not running:
                break
            time.sleep(1)
    return 0


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "once"
    if mode == "once":
        return check_once(initialize_only=not STATE_FILE.exists())
    if mode == "loop":
        return loop()
    print("usage: watch_pr_539_feedback.py [once|loop]", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
