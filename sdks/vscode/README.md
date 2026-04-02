# opencode VS Code Extension

A Visual Studio Code extension that integrates [opencode](https://opencode.ai) directly into your development workflow.

## Prerequisites

This extension requires the [opencode CLI](https://opencode.ai) to be installed on your system. Visit [opencode.ai](https://opencode.ai) for installation instructions.

## Features

- **Quick Launch**: Use `Cmd+Esc` (Mac) or `Ctrl+Esc` (Windows/Linux) to open opencode in a split terminal view, or focus an existing terminal session if one is already running.
- **New Session**: Use `Cmd+Shift+Esc` (Mac) or `Ctrl+Shift+Esc` (Windows/Linux) to start a new opencode terminal session, even if one is already open. You can also click the opencode button in the UI.
- **Context Awareness**: Automatically share your current selection or tab with opencode.
- **File Reference Shortcuts**: Use `Cmd+Option+K` (Mac) or `Alt+Ctrl+K` (Linux/Windows) to insert file references. For example, `@File#L37-42`.
- **KAIROS Sidebar**: Dedicated sidebar lane with Mode Selector (`Architect`, `Code`, `Debug`, `Ask`), model selector, and direct CLI bridge.
- **Proactive Mode**: Optional KAIROS save-hook that runs a background review whenever a file is saved.
- **BUDDY Score**: Lightweight gamification counter that tracks KAIROS usage momentum.
- **Simone Context Lane**: Sidebar buttons for symbol and reference analysis, plus automatic Simone context injection in `Architect` and `Debug` mode.
- **Persistent Session Steering**: Sidebar prompts now target a real local opencode session over the Session API instead of spawning a fresh `opencode run` process for every interaction.
- **ACP-first Sidebar Transport**: The sidebar now prefers a real `opencode acp` subprocess transport and only falls back when ACP is unavailable.
- **Live Document Events**: Open, focus, change, close, and save events now flow into the ACP lane so the sidebar can track the active editor state more like a real IDE agent.

## Support

This is an early release. If you encounter issues or have feedback, please create an issue at https://github.com/anomalyco/opencode/issues.

## Development

1. `code sdks/vscode` - Open the `sdks/vscode` directory in VS Code. **Do not open from repo root.**
2. `bun install` - Run inside the `sdks/vscode` directory.
3. Press `F5` to start debugging - This launches a new VS Code window with the extension loaded.

#### Making Changes

`tsc` and `esbuild` watchers run automatically during debugging (visible in the Terminal tab). Changes to the extension are automatically rebuilt in the background.

To test your changes:

1. In the debug VS Code window, press `Cmd+Shift+P`
2. Search for `Developer: Reload Window`
3. Reload to see your changes without restarting the debug session
