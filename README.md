# OpenSIN-Code

> The autonomous OpenSIN CLI with full browser & computer-use capabilities.

## Features

- **AI-Powered Coding**: Autonomous code generation, refactoring, and debugging
- **OpenSIN Bridge**: Chrome Extension mit 39 MCP Tools, besser als Antigravity
- **sinInChrome Integration**: Browser automation via MCP (13 actions, 7 browsers)
- **sin-computer-use Integration**: macOS GUI automation (screen capture, input, app management)
- **MCP Server**: Full Model Context Protocol support
- **A2A Protocol**: Agent-to-Agent communication
- **Multi-Provider**: OpenAI, Google, NVIDIA NIM support

## CLI Status

| Phase | Feature | Status | PR |
|-------|---------|--------|-----|
| 2.1 | Core Agent Loop (Query → API → Tools → Repeat) | ✅ Merged | [#359](https://github.com/OpenSIN-AI/OpenSIN-Code/pull/359) |
| 2.2 | CLI Tool System (Bash, Read, Write, Edit, Grep, Glob) | 🔄 In Progress | — |
| 2.3 | MCP Integration | ✅ Merged | — |
| 2.4 | Permission System | ✅ Merged | — |
| 2.5 | Session Persistence | ✅ Merged | — |
| 2.6 | System Prompt Builder | ✅ Merged | — |
| 2.7 | Skill System | ✅ Merged | — |

### Current Build Status
- **TypeScript:** ✅ 0 errors
- **Tests:** ✅ 334/334 passing
- **Branch:** `main` (up to date)

## Browser & Computer Use

OpenSIN-Code now includes enterprise-grade browser and desktop automation:

### sinInChrome (Browser Automation)
- Navigate, click, type, screenshot, read pages
- Console access and network monitoring
- Tab management and tracking
- Multi-browser: Chrome, Brave, Arc, Chromium, Edge, Vivaldi, Opera

### sin-computer-use (macOS GUI Automation)
- Full macOS screen capture via SCContentFilter
- System-wide mouse and keyboard input
- App management (open, close, hide, enumerate)
- Clipboard operations with round-trip verification
- Mouse animation (ease-out-cubic at 60fps)
- ESC abort mechanism via CGEventTap

## Quick Start

```bash
npm install
npm run build
opensin-code
```

## Documentation

Full documentation: **[docs.opensin.ai](https://docs.opensin.ai)**

| Section | Link |
|---------|------|
| Getting Started | [Guide](https://docs.opensin.ai/guide/getting-started) |
| Browser Automation | [sinInChrome](https://docs.opensin.ai/sin-in-chrome) |
| Computer Use | [sin-computer-use](https://docs.opensin.ai/sin-computer-use) |
| API Reference | [API](https://docs.opensin.ai/api/overview) |

## 📚 Documentation

This repository follows the [Global Dev Docs Standard](https://github.com/OpenSIN-AI/Global-Dev-Docs-Standard).

For contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).
For security policy, see [SECURITY.md](SECURITY.md).
For the complete OpenSIN ecosystem, see [OpenSIN-AI Organization](https://github.com/OpenSIN-AI).

## 🔗 See Also

- [OpenSIN Core](https://github.com/OpenSIN-AI/OpenSIN) — Main platform
- [OpenSIN-Code](https://github.com/OpenSIN-AI/OpenSIN-Code) — CLI
- [OpenSIN-backend](https://github.com/OpenSIN-AI/OpenSIN-backend) — Backend
- [OpenSIN-Infrastructure](https://github.com/OpenSIN-AI/OpenSIN-Infrastructure) — Deploy
- [Global Dev Docs Standard](https://github.com/OpenSIN-AI/Global-Dev-Docs-Standard) — Docs
