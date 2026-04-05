# Changelog

All notable changes to OpenSIN Code will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- OpenSIN CLI — full AI coding agent with 11 components (2214 lines)
  - Core Agent Loop: Query → LLM API → Tool execution → Repeat
  - 6 Core Tools: Bash, Read, Write, Edit, Grep, Glob
  - MCP Stdio Integration: JSON-RPC with Content-Length framing
  - Permission System: Rule-based authorization (ask/auto/dangerFullAccess)
  - Session Persistence: File-based storage with resume and fork
  - System Prompt Builder: Dynamic context assembly
  - Skill System: Directory-based SKILL.md discovery
  - Hook System: PreToolUse/PostToolUse with conditional filtering
  - Context Compaction: Auto-compact, micro-compact, circuit breaker
  - Terminal UI: REPL with command handling
  - LLM Abstraction: OpenAI API + opencode CLI fallback
- SDK modules: model routing, usage pricing, memory, parallel tools, safety
- UI/UX components and feature flags system
- 15+ SDK modules documented with README
- 9 missing services from sin-claude integration
- 16 missing tools from sin-claude integration
- 11 missing commands from sin-claude integration
- sin-plugin-dev toolkit with 7 skills and 8-phase workflow
- sin-ralph, sin-feature-dev, sin-pr-review plugins
- Governance framework, sin-hookify plugin, inbound intake pipeline
- SECURITY.md, MAINTAINERS.md, CONTRIBUTING.md

### Fixed
- TypeScript errors: .js extensions on relative imports, implicit any types
- Test assertions for .js extensions in import paths
- SDK memory module exports restored

## [0.1.0] — 2026-04-01

### Added
- Initial OpenSIN Code repository structure
- VS Code extension (kairos-vscode, opensin-code-vscode)
- Agent SDK foundation (@opensin/agent-sdk)
- Phase 1 CLI components (10 issues, 10 branches)
- 77+ test suites passing
