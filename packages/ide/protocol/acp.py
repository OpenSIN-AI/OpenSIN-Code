"""ACP Protocol — Agent Communication Protocol for OpenSIN IDE integration.

Defines JSON-RPC 2.0 message types for communication between IDE clients
(VS Code, Zed, JetBrains) and the OpenSIN API server over WebSocket transport.

Protocol: JSON-RPC 2.0
Transport: WebSocket (ndjson framing compatible with @agentclientprotocol/sdk)
"""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Protocol


class ToolStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"


class ToolKind(str, Enum):
    READ = "read"
    EDIT = "edit"
    BASH = "bash"
    FILE = "file"
    SEARCH = "search"
    OTHER = "other"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ContentType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    RESOURCE = "resource"
    RESOURCE_LINK = "resource_link"


@dataclass
class JsonRpcMessage:
    """Base JSON-RPC 2.0 envelope."""

    jsonrpc: str = "2.0"
    id: int | str | None = None
    method: str | None = None
    params: dict[str, Any] | None = None
    result: Any | None = None
    error: dict[str, Any] | None = None

    def to_json(self) -> str:
        return json.dumps({k: v for k, v in asdict(self).items() if v is not None})

    @classmethod
    def from_json(cls, raw: str) -> JsonRpcMessage:
        data = json.loads(raw)
        return cls(**{k: v for k, v in data.items() if k in cls.__dataclass_fields__})


def request_id() -> str:
    return str(uuid.uuid4())[:8]


# ── Client → Server Requests ──────────────────────────────────────────────


@dataclass
class InitializeRequest:
    """Sent by IDE on connect. Advertises client capabilities."""

    protocolVersion: str = "1.0.0"
    clientInfo: dict[str, str] = field(
        default_factory=lambda: {"name": "opensin-ide", "version": "0.1.0"}
    )
    capabilities: list[str] = field(
        default_factory=lambda: ["chat", "tool_call", "diff", "document_sync"]
    )

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(id=request_id(), method="initialize", params=asdict(self))


@dataclass
class ShutdownRequest:
    """Graceful disconnect."""

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(id=request_id(), method="shutdown", params={})


@dataclass
class NewSessionRequest:
    """Create a new conversation session."""

    cwd: str = "."
    model: str | None = None
    mcpServers: list[dict[str, Any]] = field(default_factory=list)

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(
            id=request_id(), method="session/new", params=asdict(self)
        )


@dataclass
class LoadSessionRequest:
    """Load an existing session."""

    sessionId: str
    cwd: str = "."
    mcpServers: list[dict[str, Any]] = field(default_factory=list)

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(
            id=request_id(), method="session/load", params=asdict(self)
        )


@dataclass
class ChatRequest:
    """Send a chat message to the current session."""

    sessionId: str
    message: str
    fileContext: list[str] = field(default_factory=list)
    model: str | None = None

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(
            id=request_id(), method="session/chat", params=asdict(self)
        )


@dataclass
class CancelRequest:
    """Cancel the current generation."""

    sessionId: str

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(
            id=request_id(), method="session/cancel", params=asdict(self)
        )


@dataclass
class DocumentSavedNotification:
    """IDE notifies server that a file was saved."""

    sessionId: str
    uri: str
    content: str

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/document_saved", params=asdict(self))


@dataclass
class DocumentChangedNotification:
    """IDE notifies server that a file was changed."""

    sessionId: str
    uri: str
    content: str
    version: int

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/document_changed", params=asdict(self))


@dataclass
class DocumentFocusedNotification:
    """IDE notifies server that a file gained focus."""

    sessionId: str
    uri: str
    line: int

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/document_focused", params=asdict(self))


# ── Server → Client Notifications ────────────────────────────────────────


@dataclass
class ToolCallNotification:
    """Server reports a tool execution event."""

    toolCallId: str
    toolName: str
    input: dict[str, Any] = field(default_factory=dict)
    status: ToolStatus = ToolStatus.RUNNING
    output: str | None = None

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="tool_call", params=asdict(self))


@dataclass
class FileEditNotification:
    """Server sends a file edit for IDE to apply."""

    sessionId: str
    path: str
    oldText: str
    newText: str

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/file_edit", params=asdict(self))


@dataclass
class DiffNotification:
    """Server sends a file diff for IDE to render."""

    diffId: str
    filePath: str
    originalContent: str
    modifiedContent: str

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="diff", params=asdict(self))


@dataclass
class StatusNotification:
    """Server sends a session status update."""

    sessionId: str
    status: str
    message: str = ""

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/status", params=asdict(self))


@dataclass
class AgentMessageChunk:
    """Streaming chunk of agent response text."""

    sessionId: str
    content: str
    done: bool = False

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/agent_message", params=asdict(self))


@dataclass
class SessionUpdateNotification:
    """Generic session update notification (ACP-compatible)."""

    sessionId: str
    update: dict[str, Any] = field(default_factory=dict)

    def to_message(self) -> JsonRpcMessage:
        return JsonRpcMessage(method="session/update", params=asdict(self))


# ── Responses ─────────────────────────────────────────────────────────────


@dataclass
class InitializeResponse:
    protocolVersion: str = "1.0.0"
    serverInfo: dict[str, str] = field(
        default_factory=lambda: {"name": "opensin-server", "version": "0.1.0"}
    )
    agentCapabilities: dict[str, Any] = field(
        default_factory=lambda: {
            "sessionCapabilities": {"resume": True, "modes": True},
            "tools": True,
            "diffs": True,
        }
    )


@dataclass
class NewSessionResponse:
    sessionId: str
    modes: list[dict[str, str]] = field(default_factory=list)


@dataclass
class ChatResponse:
    reply: str
    toolCalls: list[dict[str, Any]] = field(default_factory=list)


# ── WebSocket Transport Helper ────────────────────────────────────────────


class AcpTransport(Protocol):
    """Minimal WebSocket transport interface."""

    def send(self, message: JsonRpcMessage) -> None: ...
    def on_message(self, handler) -> None: ...


class WebSocketTransport:
    """Simple WebSocket transport wrapping JsonRpcMessage to/from JSON."""

    def __init__(self, ws):
        self._ws = ws
        self._handler = None
        self._ws.on_message = self._on_raw

    def send(self, message: JsonRpcMessage) -> None:
        self._ws.send(message.to_json())

    def on_message(self, handler) -> None:
        self._handler = handler

    def _on_raw(self, raw: str) -> None:
        msg = JsonRpcMessage.from_json(raw)
        if self._handler:
            self._handler(msg)
