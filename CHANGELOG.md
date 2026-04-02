# Changelog

All notable changes to the OpenSIN-Code project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.18] - 2026-04-02

### Added
- ACP tool call rendering in KAIROS sidebar with status cards (running/completed/failed)
- Document lifecycle events: open, focus, change, close, save flow into ACP lane
- 18-language i18n support for IDE landing section
- Prominent KAIROS IDE callout on web landing page
- OCI deployment runbook (870 lines) in OpenSIN repo

### Changed
- ACP-first transport now preferred with Session HTTP as fallback
- Tool events accumulated per workspace and exposed via `getToolEvents()`

## [1.3.17] - 2026-04-02

### Added
- ACP document event synchronization: didOpen, didFocus, didChange, didClose, didSave
- IDE/KAIROS lane promoted on web landing page
- IDE docs page linked from landing

## [1.3.16] - 2026-04-02

### Added
- ACP-first sidebar transport via `opencode acp` subprocess
- Persistent ACP session reuse per workspace
- Simone symbol and reference analysis from sidebar
- Proactive file-save reviews
- IDE landing/docs page

## [1.3.15] - 2026-04-02

### Added
- Persistent session steering via local Session API
- Mode-aware behavior (Architect/Code/Debug/Ask)
- Model switching without throwing away session state

### Changed
- Sidebar no longer spawns fresh `opencode run` per prompt
- Session HTTP transport remains as fallback

## [1.3.14] - 2026-04-02

### Added
- KAIROS sidebar with mode selector
- Model selector with Qwen 3.6 free lanes
- Proactive mode on file saves
- BUDDY score tracking
- Simone context injection in Architect/Debug modes

## [1.3.13] - Initial

### Added
- VS Code extension with terminal bridge
- Quick launch commands
- File reference shortcuts
