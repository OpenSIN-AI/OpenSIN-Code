"""OpenSIN API Server — FastAPI application with ACP WebSocket support.

Provides REST endpoints for session management and a WebSocket endpoint
for the Agent Communication Protocol (ACP) used by IDE integrations.
"""

from __future__ import annotations

import asyncio
import json
import uuid
from dataclasses import dataclass, field
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# ── App ───────────────────────────────────────────────────────────────────

app = FastAPI(title="OpenSIN API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Session Store ─────────────────────────────────────────────────────────


@dataclass
class Session:
    id: str
    cwd: str
    model: str | None = None
    messages: list[dict[str, Any]] = field(default_factory=list)
    tools: list[dict[str, Any]] = field(default_factory=list)


sessions: dict[str, Session] = {}


# ── REST Endpoints ────────────────────────────────────────────────────────


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "opensin-api"}


@app.post("/api/sessions")
async def create_session(body: dict[str, Any]) -> dict[str, str]:
    sid = str(uuid.uuid4())
    sessions[sid] = Session(id=sid, cwd=body.get("cwd", "."), model=body.get("model"))
    return {"sessionId": sid}


@app.get("/api/sessions")
async def list_sessions() -> dict[str, list[dict[str, str]]]:
    return {
        "sessions": [
            {"sessionId": s.id, "cwd": s.cwd, "model": s.model or ""}
            for s in sessions.values()
        ]
    }


@app.post("/api/sessions/{session_id}/prompt")
async def prompt(session_id: str, body: dict[str, Any]) -> dict[str, str]:
    session = sessions.get(session_id)
    if not session:
        return {"error": "session not found"}

    session.messages.append({"role": "user", "content": body.get("text", "")})
    return {"status": "queued", "sessionId": session_id}


# ── ACP WebSocket Endpoint ───────────────────────────────────────────────


@app.websocket("/acp")
async def acp_endpoint(ws: WebSocket) -> None:
    await ws.accept()

    current_session: Session | None = None

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)

            method = msg.get("method")
            params = msg.get("params", {})
            msg_id = msg.get("id")

            if method == "initialize":
                await _send(
                    ws,
                    msg_id,
                    {
                        "protocolVersion": "1.0.0",
                        "serverInfo": {"name": "opensin-server", "version": "0.1.0"},
                        "agentCapabilities": {
                            "sessionCapabilities": {"resume": True, "modes": True},
                            "tools": True,
                            "diffs": True,
                        },
                    },
                )

            elif method == "shutdown":
                await _send(ws, msg_id, {})
                break

            elif method == "session/new":
                sid = str(uuid.uuid4())
                current_session = Session(
                    id=sid,
                    cwd=params.get("cwd", "."),
                    model=params.get("model"),
                )
                sessions[sid] = current_session
                await _send(
                    ws,
                    msg_id,
                    {
                        "sessionId": sid,
                        "modes": [
                            {"id": "code", "name": "Code"},
                            {"id": "architect", "name": "Architect"},
                            {"id": "debug", "name": "Debug"},
                            {"id": "ask", "name": "Ask"},
                        ],
                    },
                )

            elif method == "session/load":
                sid = params.get("sessionId", "")
                current_session = sessions.get(sid)
                if not current_session:
                    await _error(ws, msg_id, -32000, "session not found")
                else:
                    await _send(ws, msg_id, {"sessionId": sid})

            elif method == "session/prompt":
                if not current_session:
                    await _error(ws, msg_id, -32000, "no active session")
                    continue

                sid = params.get("sessionId", current_session.id)
                text = _extract_text(params.get("prompt", []))
                current_session.messages.append({"role": "user", "content": text})

                # Notify IDE of tool activity
                await _notify(
                    ws,
                    "session/update",
                    {
                        "sessionId": sid,
                        "update": {
                            "sessionUpdate": "tool_call",
                            "toolCallId": str(uuid.uuid4())[:8],
                            "toolName": "thinking",
                            "input": {"prompt": text},
                            "status": "in_progress",
                        },
                    },
                )

                # Simulated response — replace with actual model call
                reply = f"Received: {text}"
                current_session.messages.append({"role": "assistant", "content": reply})

                await _notify(
                    ws,
                    "session/update",
                    {
                        "sessionId": sid,
                        "update": {
                            "sessionUpdate": "agent_message_chunk",
                            "content": {"type": "text", "text": reply},
                        },
                    },
                )

                await _send(ws, msg_id, {"stopReason": "end_turn"})

            elif method == "session/cancel":
                await _send(ws, msg_id, {"status": "cancelled"})

            elif method == "session/list":
                await _send(
                    ws,
                    msg_id,
                    {
                        "sessions": [
                            {"sessionId": s.id, "cwd": s.cwd, "model": s.model or ""}
                            for s in sessions.values()
                        ]
                    },
                )

            elif method == "session/document_saved":
                pass  # Acknowledge silently

            elif method == "session/document_changed":
                pass  # Acknowledge silently

            elif method == "session/document_focused":
                pass  # Acknowledge silently

            else:
                await _error(ws, msg_id, -32601, f"method not found: {method}")

    except WebSocketDisconnect:
        pass


# ── Helpers ───────────────────────────────────────────────────────────────


async def _send(ws: WebSocket, msg_id: int | str | None, result: Any) -> None:
    msg = {"jsonrpc": "2.0", "id": msg_id, "result": result}
    await ws.send_text(json.dumps(msg))


async def _error(
    ws: WebSocket, msg_id: int | str | None, code: int, message: str
) -> None:
    msg = {"jsonrpc": "2.0", "id": msg_id, "error": {"code": code, "message": message}}
    await ws.send_text(json.dumps(msg))


async def _notify(ws: WebSocket, method: str, params: Any) -> None:
    msg = {"jsonrpc": "2.0", "method": method, "params": params}
    await ws.send_text(json.dumps(msg))


def _extract_text(prompt: Any) -> str:
    if isinstance(prompt, list):
        parts = []
        for item in prompt:
            if isinstance(item, dict) and item.get("type") == "text":
                parts.append(item.get("text", ""))
        return "\n".join(parts)
    if isinstance(prompt, str):
        return prompt
    return ""
