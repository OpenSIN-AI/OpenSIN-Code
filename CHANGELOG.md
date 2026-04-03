# Changelog

All notable changes to OpenSIN-Code will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Simone MCP built-in server (find_symbol, find_references, replace_symbol)
- Autonomy Slider (Assist, Collaborate, Autonomous)
- Hooks System (PreEdit, PostEdit, PreCommit, PostCommit, PreTool, PostTool)
- Agent SDK for custom agent development
- Auto-Lint Integration (ESLint, Pylint, Prettier, TSC)
- Custom Commands for repeatable workflows
- Loop Mode for prompt repetition
- LSP Integration for language server support
- Multi-Language i18n (9 languages)
- Continue My Work feature for session continuity
- Turbo Mode for auto-executing terminal commands

### Changed
- Rebranded from OpenCode to SIN Code
- License updated to MIT
- Package renamed to @opensin/code

### Fixed
- Root install entrypoint branding drift
- Package metadata drift
- README branding and licensing drift

## [0.1.0] - 2026-04-02

### Added
- Initial release of SIN Code CLI
- Multi-model support (75+ models)
- MCP server integration
- TUI with SIN green theme
- sincode.json config support
