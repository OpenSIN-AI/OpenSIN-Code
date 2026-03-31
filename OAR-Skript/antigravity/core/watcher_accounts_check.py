import json, time
from .utils_log import log

_QUOTA_EXHAUSTED_THRESHOLD = 0.05
_CACHED_QUOTA_MAX_AGE_MS = 30 * 60 * 1000
_ACCOUNTS_MTIME_SENTINEL: dict = {}


def _check_accounts_blocked(accounts_path) -> bool:
    if not accounts_path.exists():
        return False
    try:
        data = json.load(open(accounts_path))
        accounts = data.get("accounts", [])
        if not accounts:
            return False
        now_ms = int(time.time() * 1000)

        # --- Prüfung 1: rateLimitResetTimes (harter Block) ---
        blocked_hard = sum(
            1
            for acc in accounts
            if acc.get("rateLimitResetTimes")
            and any(
                v > now_ms
                for v in acc["rateLimitResetTimes"].values()
                if isinstance(v, (int, float))
            )
        )
        if blocked_hard > 0 and blocked_hard >= len(accounts):
            log(
                f"[watcher] All {blocked_hard} account(s) blocked via rateLimitResetTimes"
            )
            return True

        # --- Prüfung 1b: accounts.json recently modified + has ANY rateLimitResetTimes ---
        # Catches cases where the plugin wrote rateLimitResetTimes to disk but they
        # expired before the watcher polled (e.g. short hourly cooldown written then read).
        # We detect the *write event* via mtime change — a fresh write in the last poll
        # window (≤20s) with any rateLimitResetTimes key present means a fresh block.
        try:
            mtime = accounts_path.stat().st_mtime
            last_seen_mtime = _ACCOUNTS_MTIME_SENTINEL.get(str(accounts_path), 0)
            mtime_fresh = (time.time() - mtime) <= 20 and mtime != last_seen_mtime
            _ACCOUNTS_MTIME_SENTINEL[str(accounts_path)] = mtime
            if mtime_fresh:
                any_rlt = any(bool(acc.get("rateLimitResetTimes")) for acc in accounts)
                if any_rlt:
                    log(
                        "[watcher] accounts.json freshly written with rateLimitResetTimes — triggering rotation"
                    )
                    return True
        except Exception:
            pass

        # --- Prüfung 2: cachedQuota.claude.remainingFraction (weiches Limit / Weekly Quota) ---
        # opencode wirft "All N account(s) rate-limited for claude. Quota resets in Xh"
        # wenn kein Account für claude verfügbar ist — das speichert es NICHT in rateLimitResetTimes,
        # sondern ergibt sich aus erschöpfter cachedQuota. Wir detecten das hier direkt.
        updated_at = data.get("cachedQuotaUpdatedAt")  # legacy top-level field
        blocked_quota = 0
        enabled_accounts = [a for a in accounts if a.get("enabled", True)]
        for acc in enabled_accounts:
            cq = acc.get("cachedQuota", {})
            cq_updated = acc.get("cachedQuotaUpdatedAt", 0)
            if not cq:
                continue
            # Quota-Cache zu alt → ignorieren
            if cq_updated and (now_ms - cq_updated) > _CACHED_QUOTA_MAX_AGE_MS:
                continue
            claude_quota = cq.get("claude", {})
            if not claude_quota:
                continue
            remaining = claude_quota.get("remainingFraction")
            if remaining is not None and remaining < _QUOTA_EXHAUSTED_THRESHOLD:
                blocked_quota += 1
                log(
                    f"[watcher] Account {acc.get('email', '?')} claude quota exhausted "
                    f"(remainingFraction={remaining:.3f} < {_QUOTA_EXHAUSTED_THRESHOLD})"
                )

        if blocked_quota > 0 and blocked_quota >= len(enabled_accounts):
            log(
                f"[watcher] All {blocked_quota} account(s) blocked via cachedQuota.claude (weekly quota exhausted)"
            )
            return True

    except Exception as e:
        log(f"[watcher] _check_accounts_blocked error: {e}", "WARN")
    return False
