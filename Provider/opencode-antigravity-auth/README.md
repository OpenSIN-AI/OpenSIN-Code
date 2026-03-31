# 🔑 Provider: opencode-antigravity-auth

## Overview
Custom OAuth provider plugin that intercepts standard Google Generative AI requests and routes them through the OpenSIN-AI OCI proxy (`92.5.60.87:4100/v1`).

## Capabilities
- Natively authenticates `google/antigravity-gemini-3.1-pro`.
- Natively authenticates `antigravity-claude-opus-4-6-thinking`.

## Best Practices
- Ensure this plugin is registered in the `opencode.json` plugin array.
- Do NOT provide a standard `apiKey` in `opencode.json` when using this provider to avoid fallback conflicts.
