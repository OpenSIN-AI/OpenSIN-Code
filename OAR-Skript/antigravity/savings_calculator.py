#!/usr/bin/env python3
"""Unified real-savings calculator for OpenAI + Antigravity rotated tokens.

Reads ALL local opencode SQLite DBs, calculates market-price savings using
real 2026 pricing, and returns a structured report per provider.
"""

import json
import sqlite3
import time
from pathlib import Path

# ── Real market prices (USD per 1M tokens) — updated 2026-03-26 ─────────────
# Source: openai.com/pricing, anthropic.com/pricing, ai.google.dev/pricing
MARKET_PRICES: dict[str, dict] = {
    # ── OpenAI (via rotated free token) ─────────────────────────────────────
    "gpt-5.4": {"in": 10.00, "out": 30.00, "provider_group": "openai"},
    "gpt-5.2": {"in": 10.00, "out": 30.00, "provider_group": "openai"},
    "gpt-5.2-codex": {"in": 10.00, "out": 30.00, "provider_group": "openai"},
    "gpt-5.3-codex": {"in": 10.00, "out": 30.00, "provider_group": "openai"},
    "gpt-5.2-codex-mini": {"in": 3.00, "out": 15.00, "provider_group": "openai"},
    "gpt-5.1-codex-max": {"in": 10.00, "out": 30.00, "provider_group": "openai"},
    "gpt-4o": {"in": 2.50, "out": 10.00, "provider_group": "openai"},
    "gpt-4o-mini": {"in": 0.15, "out": 0.60, "provider_group": "openai"},
    "gpt-5.4-mini": {"in": 0.40, "out": 1.60, "provider_group": "openai"},
    "openai/gpt-oss-120b": {"in": 10.00, "out": 30.00, "provider_group": "openai"},
    # ── Nvidia NIM (free via our proxy) ─────────────────────────────────────
    "qwen-3.5-122b": {"in": 0.40, "out": 1.20, "provider_group": "nvidia"},
    "qwen-3.5-397b": {"in": 0.60, "out": 1.80, "provider_group": "nvidia"},
    "nvidia-nim/qwen-3.5-122b": {"in": 0.40, "out": 1.20, "provider_group": "nvidia"},
    "nvidia-nim/qwen-3.5-397b": {"in": 0.60, "out": 1.80, "provider_group": "nvidia"},
    "qwen/qwen3.5-397b-a17b": {"in": 0.60, "out": 1.80, "provider_group": "nvidia"},
    "qwen/qwen3-next-80b-a3b-instruct": {
        "in": 0.40,
        "out": 1.20,
        "provider_group": "nvidia",
    },
    "qwen/qwen3-coder-480b-a35b-instruct": {
        "in": 0.60,
        "out": 1.80,
        "provider_group": "nvidia",
    },
    "qwen/qwen3-next-80b-a3b-thinking": {
        "in": 0.40,
        "out": 1.20,
        "provider_group": "nvidia",
    },
    "nemotron-3-super-free": {"in": 0.00, "out": 0.00, "provider_group": "nvidia"},
    "nvidia/llama-3.3-nemotron-super-49b-v1.5": {
        "in": 0.00,
        "out": 0.00,
        "provider_group": "nvidia",
    },
    # ── Gemini direct API (free quota) ───────────────────────────────────────
    "gemini-3-flash-preview": {"in": 0.075, "out": 0.30, "provider_group": "gemini"},
    "gemini-3.1-pro-preview": {"in": 1.25, "out": 5.00, "provider_group": "gemini"},
    "gemini-3.1-pro-preview-customtools": {
        "in": 1.25,
        "out": 5.00,
        "provider_group": "gemini",
    },
    "gemini-3.1-flash-lite-preview": {
        "in": 0.015,
        "out": 0.06,
        "provider_group": "gemini",
    },
    "gemini-3-pro-preview": {"in": 1.25, "out": 5.00, "provider_group": "gemini"},
    "gemini-3.1-flash-image-preview": {
        "in": 0.075,
        "out": 0.30,
        "provider_group": "gemini",
    },
    "gemini-3.1-pro-api-key": {"in": 1.25, "out": 5.00, "provider_group": "gemini"},
    "gemini-3.1-flash-api-key": {"in": 0.075, "out": 0.30, "provider_group": "gemini"},
    "gemini-2.5-pro": {"in": 1.25, "out": 10.00, "provider_group": "gemini"},
    "gemini-2.5-pro-preview-06-05": {
        "in": 1.25,
        "out": 10.00,
        "provider_group": "gemini",
    },
    "gemini-2.5-flash": {"in": 0.15, "out": 0.60, "provider_group": "gemini"},
    "gemini-2.0-flash": {"in": 0.075, "out": 0.30, "provider_group": "gemini"},
    "gemini-2.0-flash-lite": {"in": 0.015, "out": 0.06, "provider_group": "gemini"},
    "gemini-1.5-flash": {"in": 0.075, "out": 0.30, "provider_group": "gemini"},
    # ── Grok / xAI (free via our proxy) ─────────────────────────────────────
    "grok-code-fast-1": {"in": 3.00, "out": 15.00, "provider_group": "xai"},
    "grok-4-1-fast": {"in": 3.00, "out": 15.00, "provider_group": "xai"},
    "grok-4-1-fast-non-reasoning": {"in": 3.00, "out": 15.00, "provider_group": "xai"},
    "grok-4": {"in": 3.00, "out": 15.00, "provider_group": "xai"},
    # ── Z-AI / GLM (free via our proxy) ─────────────────────────────────────
    "z-ai/glm5": {"in": 0.14, "out": 0.28, "provider_group": "zai"},
    "z-ai/glm4.7": {"in": 0.14, "out": 0.28, "provider_group": "zai"},
    # ── MiniMax (free via our proxy) ─────────────────────────────────────────
    "minimax-m2.5-free": {"in": 0.00, "out": 0.00, "provider_group": "minimax"},
    "minimaxai/minimax-m2.5": {"in": 0.00, "out": 0.00, "provider_group": "minimax"},
    # ── DeepSeek (free via our proxy) ────────────────────────────────────────
    "deepseek-ai/deepseek-v3.2": {
        "in": 0.27,
        "out": 1.10,
        "provider_group": "deepseek",
    },
    "deepseek-ai/deepseek-v3.1-terminus": {
        "in": 0.27,
        "out": 1.10,
        "provider_group": "deepseek",
    },
    # ── Meta / Llama (free via our proxy) ────────────────────────────────────
    "meta/llama-4-maverick-17b-128e-instruct": {
        "in": 0.20,
        "out": 0.85,
        "provider_group": "meta",
    },
    "meta/llama-3.2-11b-vision-instruct": {
        "in": 0.16,
        "out": 0.16,
        "provider_group": "meta",
    },
    # ── Claude direct (non-antigravity) ──────────────────────────────────────
    "claude-sonnet-4.6": {"in": 3.00, "out": 15.00, "provider_group": "anthropic"},
    "claude-haiku-4.5": {"in": 0.80, "out": 4.00, "provider_group": "anthropic"},
    # ── Other / Misc ─────────────────────────────────────────────────────────
    "big-pickle": {"in": 0.00, "out": 0.00, "provider_group": "other"},
    "free-router": {"in": 0.00, "out": 0.00, "provider_group": "other"},
    "mimo-v2-flash-free": {"in": 0.00, "out": 0.00, "provider_group": "other"},
    "moonshotai/kimi-k2.5": {"in": 0.14, "out": 0.55, "provider_group": "other"},
    # ── Anthropic via Antigravity (google provider, free for us) ─────────────
    "antigravity-claude-opus-4-6-thinking": {
        "in": 15.00,
        "out": 75.00,
        "provider_group": "antigravity",
    },
    "antigravity-claude-opus-4-6": {
        "in": 15.00,
        "out": 75.00,
        "provider_group": "antigravity",
    },
    "antigravity-claude-sonnet-4-6": {
        "in": 3.00,
        "out": 15.00,
        "provider_group": "antigravity",
    },
    "antigravity-claude-haiku-4-6": {
        "in": 0.80,
        "out": 4.00,
        "provider_group": "antigravity",
    },
    # ── Gemini via Antigravity (google provider, free for us) ────────────────
    "antigravity-gemini-3.1-pro": {
        "in": 1.25,
        "out": 5.00,
        "provider_group": "antigravity",
    },
    "antigravity-gemini-3-flash": {
        "in": 0.075,
        "out": 0.30,
        "provider_group": "antigravity",
    },
    "antigravity-gemini-3.1-pro-preview": {
        "in": 1.25,
        "out": 5.00,
        "provider_group": "antigravity",
    },
    "antigravity-gemini-3-flash-preview": {
        "in": 0.075,
        "out": 0.30,
        "provider_group": "antigravity",
    },
}

EUR_RATE = 0.92  # USD → EUR

_DB_DIR = Path.home() / ".local" / "share" / "opencode"

_QUERY = """
SELECT
    json_extract(data,'$.providerID') as provider,
    json_extract(data,'$.modelID')    as model,
    SUM(json_extract(data,'$.tokens.input'))  as t_in,
    SUM(json_extract(data,'$.tokens.output')) as t_out,
    COUNT(*) as msgs
FROM message
WHERE json_extract(data,'$.role') = 'assistant'
  AND (json_extract(data,'$.tokens.input') > 0
       OR json_extract(data,'$.tokens.output') > 0)
GROUP BY provider, model
"""


def _find_all_dbs() -> list[Path]:
    dbs = []
    for p in _DB_DIR.glob("*.db"):
        if (
            p.suffix == ".db"
            and not p.name.endswith("-shm")
            and not p.name.endswith("-wal")
        ):
            dbs.append(p)
    return dbs


def _read_db(db_path: Path) -> list[tuple]:
    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=10)
        rows = conn.execute(_QUERY).fetchall()
        conn.close()
        return rows
    except Exception:
        return []


def _model_key(model_str: str) -> str:
    if not model_str:
        return ""
    return model_str.split("/")[-1]


def calculate_savings() -> dict:
    """
    Returns:
    {
        "openai":       {"tokens_in": int, "tokens_out": int, "saved_usd": float, "saved_eur": float, "msgs": int},
        "antigravity":  {"tokens_in": int, "tokens_out": int, "saved_usd": float, "saved_eur": float, "msgs": int},
        "total":        {"saved_usd": float, "saved_eur": float, "paid_usd": float, "msgs": int},
        "per_model":    [{model, provider_group, t_in, t_out, saved_usd, msgs}],
        "as_of":        "ISO timestamp",
    }
    """
    combined: dict[str, list] = {}

    for db in _find_all_dbs():
        for provider, model, t_in, t_out, msgs in _read_db(db):
            key = f"{provider}/{model}"
            if key not in combined:
                combined[key] = [provider, model, 0, 0, 0]
            combined[key][2] += t_in or 0
            combined[key][3] += t_out or 0
            combined[key][4] += msgs or 0

    result = {
        "openai": {
            "tokens_in": 0,
            "tokens_out": 0,
            "saved_usd": 0.0,
            "saved_eur": 0.0,
            "msgs": 0,
        },
        "antigravity": {
            "tokens_in": 0,
            "tokens_out": 0,
            "saved_usd": 0.0,
            "saved_eur": 0.0,
            "msgs": 0,
        },
        "total": {"saved_usd": 0.0, "saved_eur": 0.0, "paid_usd": 0.0, "msgs": 0},
        "per_model": [],
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%S"),
    }

    for key, (provider, model, t_in, t_out, msgs) in combined.items():
        mk = _model_key(model)
        if mk not in MARKET_PRICES:
            continue
        p = MARKET_PRICES[mk]
        saved_usd = (t_in * p["in"] + t_out * p["out"]) / 1_000_000
        group = p["provider_group"]

        if group not in result:
            result[group] = {
                "tokens_in": 0,
                "tokens_out": 0,
                "saved_usd": 0.0,
                "saved_eur": 0.0,
                "msgs": 0,
            }
        result[group]["tokens_in"] += t_in
        result[group]["tokens_out"] += t_out
        result[group]["saved_usd"] += saved_usd
        result[group]["saved_eur"] += saved_usd * EUR_RATE
        result[group]["msgs"] += msgs
        result["total"]["saved_usd"] += saved_usd
        result["total"]["msgs"] += msgs

        result["per_model"].append(
            {
                "model": model,
                "provider_group": group,
                "tokens_in": t_in,
                "tokens_out": t_out,
                "saved_usd": saved_usd,
                "msgs": msgs,
            }
        )

    result["total"]["saved_eur"] = result["total"]["saved_usd"] * EUR_RATE
    result["per_model"].sort(key=lambda x: -x["saved_usd"])
    return result


def format_telegram_message(report: dict, trigger: str = "rotation") -> str:
    oi = report["openai"]
    ag = report["antigravity"]
    tot = report["total"]

    saved_eur = tot["saved_eur"]
    oi_eur = oi["saved_eur"]
    ag_eur = ag["saved_eur"]

    top = report["per_model"][:3]
    top_lines = "\n".join(
        f"  • {m['model'].split('/')[-1]}: €{m['saved_usd'] * EUR_RATE:,.0f}"
        for m in top
    )

    return (
        f"💰 <b>Token-Savings Report</b> [{trigger}]\n\n"
        f"🔵 <b>OpenAI</b> (rotierter Token):\n"
        f"   Erspart: <b>€{oi_eur:,.2f}</b>\n"
        f"   Tokens: {oi['tokens_in'] / 1e6:.1f}M input / {oi['tokens_out'] / 1e3:.0f}k output\n\n"
        f"🟣 <b>Antigravity</b> (Claude + Gemini):\n"
        f"   Erspart: <b>€{ag_eur:,.2f}</b>\n"
        f"   Tokens: {ag['tokens_in'] / 1e6:.1f}M input / {ag['tokens_out'] / 1e3:.0f}k output\n\n"
        f"🏆 <b>Gesamt erspart: €{saved_eur:,.2f}</b>\n\n"
        f"📊 Top-Modelle:\n{top_lines}\n\n"
        f"📅 Stand: {report['as_of']}"
    )


if __name__ == "__main__":
    import sys

    report = calculate_savings()
    if "--json" in sys.argv:
        print(json.dumps(report, indent=2))
    else:
        print(format_telegram_message(report, "manual"))
        print()
        print(f"OpenAI:       €{report['openai']['saved_eur']:>10,.2f}")
        print(f"Antigravity:  €{report['antigravity']['saved_eur']:>10,.2f}")
        print(f"TOTAL:        €{report['total']['saved_eur']:>10,.2f}")
