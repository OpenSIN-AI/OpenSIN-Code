# OpenSIN VS Code Extension

VS Code extension for OpenSIN — an AI-powered coding assistant that integrates directly into your editor via the Agent Communication Protocol (ACP).

## Features

- **Chat Panel** — Conversational AI assistant in a sidebar webview. Ask questions, request code changes, and get contextual help.
- **Tool Activity** — Real-time visibility into tool execution (file edits, terminal commands, etc.) in the status bar and output panel.
- **File Diffs** — View and accept/reject file diffs produced by OpenSIN sessions in VS Code's native diff editor.
- **ACP Protocol** — Connects to OpenSIN API server via WebSocket using the Agent Communication Protocol for structured IDE ↔ server communication.

## Requirements

- VS Code 1.94.0 or later
- OpenSIN API server running locally or remotely

## Configuration

| Setting | Default | Description |
|---|---|---|
| `opensin.server.url` | `http://localhost:8080` | OpenSIN API server URL |
| `opensin.server.wsUrl` | `ws://localhost:8081` | WebSocket URL for ACP protocol |
| `opensin.model.default` | `openrouter/qwen/qwen3.6-plus:free` | Default model |
| `opensin.chat.autoScroll` | `true` | Auto-scroll chat on new messages |
| `opensin.toolActivity.showStatusBar` | `true` | Show tool activity in status bar |
| `opensin.diff.inline` | `false` | Show diffs inline vs. diff editor |

## Commands

| Command | Keybinding | Description |
|---|---|---|
| `opensin.chat.start` | `Cmd+Shift+I` | Open the chat panel |
| `opensin.chat.newSession` | — | Start a new conversation |
| `opensin.chat.addFile` | `Cmd+Alt+I` | Add current file to context |
| `opensin.diff.show` | — | Show latest diff |
| `opensin.connect` | — | Connect to OpenSIN server |
| `opensin.disconnect` | — | Disconnect from server |

## Development

```bash
cd packages/ide/vscode
bun install
bun run compile
```

Press `F5` in VS Code to launch the Extension Development Host.

## Architecture

```
VS Code Extension
├── extension.ts      — Entry point, lifecycle, command registration
├── chat-panel.ts     — Webview provider for the chat UI
├── tool-activity.ts  — Status bar + output panel for tool execution
├── diff-renderer.ts  — Diff editor integration for file changes
└── acp-client.ts     — ACP WebSocket client for OpenSIN server communication
```
