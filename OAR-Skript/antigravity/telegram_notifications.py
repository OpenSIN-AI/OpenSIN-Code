"""Telegram rotation notifications with real savings calculation."""

import json
import subprocess
import urllib.request
import urllib.parse
from pathlib import Path

TELEGRAM_CONFIG = Path.home() / ".config" / "opencode" / "telegram_config.json"
MILESTONE_STATE = (
    Path.home() / ".local" / "share" / "opencode" / "savings_milestone.json"
)
EUR_RATE = 0.92


def _send(msg: str, prefix: str = "🤖 <b>[opencodex-rotator]</b>\n\n") -> None:
    try:
        if not TELEGRAM_CONFIG.exists():
            return
        conf = json.loads(TELEGRAM_CONFIG.read_text())
        bot_token = conf.get("bot_token")
        chat_id = conf.get("chat_id")
        if not bot_token or not chat_id:
            return
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        data = urllib.parse.urlencode(
            {"chat_id": chat_id, "text": prefix + msg, "parse_mode": "HTML"}
        ).encode()
        urllib.request.urlopen(url, data=data, timeout=5)
    except Exception as e:
        print(f"TELEGRAM_NOTIFY: send failed: {e}")


def _count_pool_tokens() -> int:
    try:
        from token_pool import _URL, _HEADERS

        req = urllib.request.Request(
            f"{_URL}/rest/v1/openai_tokens?select=id", headers=_HEADERS, method="GET"
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            return len(json.loads(r.read()))
    except Exception:
        return -1


def _load_milestone() -> dict:
    if MILESTONE_STATE.exists():
        try:
            return json.loads(MILESTONE_STATE.read_text())
        except Exception:
            pass
    return {"last_milestone_eur": 0}


def _save_milestone(state: dict) -> None:
    MILESTONE_STATE.parent.mkdir(parents=True, exist_ok=True)
    MILESTONE_STATE.write_text(json.dumps(state, indent=2))


def _generate_milestone_msg(total_eur: float) -> str:
    prompt = (
        f"Du bist ein witziger, motivierender Finanz-Assistent. "
        f"Wir haben insgesamt {total_eur:.0f}€ gespart durch automatische Token-Rotation. "
        f"Formuliere EINE kurze, knackige Nachricht (max 3 Sätze): "
        f"Wie viele Tage/Wochen/Monate man dafür bei 2.000€ netto/Monat hätte arbeiten müssen. "
        f"Nur die Nachricht, kein Markdown."
    )
    try:
        r = subprocess.run(
            ["opencode", "run", "-m", "opencode/minimax-m2.5-free", prompt],
            capture_output=True,
            text=True,
            timeout=60,
        )
        if r.returncode == 0 and r.stdout.strip():
            return r.stdout.strip()[:500]
    except Exception as e:
        print(f"TELEGRAM_NOTIFY: LLM milestone failed: {e}")
    days = total_eur / (2000 / 30)
    return (
        f"💰 {total_eur:.0f}€ gespart! Das wären {days:.1f} Arbeitstage "
        f"bei 2.000€ netto/Monat. Die KI arbeitet 24/7 — du nicht!"
    )


def _check_and_fire_milestone(total_eur: float, prefix: str) -> None:
    state = _load_milestone()
    last = state.get("last_milestone_eur", 0)
    next_milestone = ((last // 500) + 1) * 500
    if total_eur >= next_milestone:
        llm_msg = _generate_milestone_msg(total_eur)
        _send(
            f"🎉 <b>MEILENSTEIN: €{total_eur:,.0f} gespart!</b>\n\n{llm_msg}",
            prefix=prefix,
        )
        state["last_milestone_eur"] = int((total_eur // 500) * 500)
        _save_milestone(state)


def notify_rotation_success(success_count: int, provider: str = "openai") -> None:
    try:
        from savings_calculator import calculate_savings

        report = calculate_savings()
        oi_eur = report["openai"]["saved_eur"]
        ag_eur = report["antigravity"]["saved_eur"]
        tot_eur = report["total"]["saved_eur"]
        pool = _count_pool_tokens()
        top3 = "\n".join(
            f"  • {m['model'].split('/')[-1]}: €{m['saved_usd'] * EUR_RATE:,.0f}"
            for m in report["per_model"][:3]
        )
        msg = (
            f"✅ <b>Neuer Token rotiert!</b> [{provider}] #{success_count}\n"
            f"🔑 Tokens im Pool: <b>{pool if pool >= 0 else '?'}</b>\n\n"
            f"💰 <b>Echte Ersparnisse (Marktpreise 2026):</b>\n"
            f"🔵 OpenAI:       <b>€{oi_eur:,.2f}</b>\n"
            f"🟣 Antigravity:  <b>€{ag_eur:,.2f}</b>\n"
            f"🏆 Gesamt:       <b>€{tot_eur:,.2f}</b>\n\n"
            f"📊 Top-Modelle:\n{top3}"
        )
        _send(msg)
        _check_and_fire_milestone(tot_eur, prefix="🤖 <b>[opencodex-rotator]</b>\n\n")
    except Exception as e:
        print(f"TELEGRAM_NOTIFY: savings calc failed: {e}")
        pool = _count_pool_tokens()
        _send(
            f"✅ <b>Token rotiert!</b> #{success_count} | Pool: {pool if pool >= 0 else '?'}"
        )


def notify_antigravity_rotation(rotator_email: str) -> None:
    prefix = "🤖 <b>[antigravity-rotator]</b>\n\n"
    try:
        from savings_calculator import calculate_savings

        report = calculate_savings()
        ag = report["antigravity"]
        oi = report["openai"]
        tot_eur = report["total"]["saved_eur"]
        top_ag = "\n".join(
            f"  • {m['model'].split('/')[-1]}: €{m['saved_usd'] * EUR_RATE:,.0f}"
            for m in report["per_model"]
            if m["provider_group"] == "antigravity"
        )[:200]
        msg = (
            f"✅ <b>Antigravity Token rotiert!</b>\n"
            f"👤 <code>{rotator_email}</code>\n\n"
            f"💰 <b>Ersparnisse gesamt (Marktpreise 2026):</b>\n"
            f"🟣 Antigravity:  <b>€{ag['saved_eur']:,.2f}</b>\n"
            f"   {ag['tokens_in'] / 1e6:.1f}M input / {ag['tokens_out'] / 1e3:.0f}k output\n"
            f"🔵 OpenAI:       <b>€{oi['saved_eur']:,.2f}</b>\n"
            f"🏆 Gesamt:       <b>€{tot_eur:,.2f}</b>\n\n"
            f"📊 Antigravity-Modelle:\n{top_ag}"
        )
        _send(msg, prefix=prefix)
        _check_and_fire_milestone(tot_eur, prefix=prefix)
    except Exception as e:
        print(f"TELEGRAM_NOTIFY: antigravity notify failed: {e}")
        _send(f"✅ <b>Antigravity rotiert!</b>\n👤 {rotator_email}", prefix=prefix)


# backward-compat shim used by fast_runner.py
def check_and_send_milestone(success_count: int) -> None:
    notify_rotation_success(success_count)
