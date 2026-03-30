# NVIDIA NIM Guide for OpenCode CLI

OpenCode CLI-specific configuration and usage guide for NVIDIA NIM integration.

## Overview

This guide covers the OpenCode CLI-specific setup for NVIDIA NIM models. OpenCode uses a provider-based architecture with the AI SDK.

## Configuration

### Location

Configuration file: `~/.config/opencode/opencode.json`

### Add Provider

Add the NVIDIA NIM provider under the `provider` section:

```json
{
  "provider": {
    "nvidia-nim": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NVIDIA NIM (Qwen)",
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1"
      },
      "models": {
        "qwen-coder-32b": {
          "name": "Qwen 2.5 Coder 32B (NVIDIA NIM)",
          "id": "qwen/qwen2_5-coder-32b-instruct",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "qwen-coder-7b": {
          "name": "Qwen 2.5 Coder 7B (NVIDIA NIM)",
          "id": "qwen/qwen2_5-coder-7b-instruct",
          "limit": {
            "context": 131072,
            "output": 8192
          }
        },
        "kimi-k2.5": {
          "name": "Kimi K2.5 (NVIDIA NIM)",
          "id": "kimi-k2.5",
          "limit": {
            "context": 1048576,
            "output": 65536
          }
        }
      }
    }
  }
}
```

### Set Default Model

Set the default model for all agents:

```json
{
  "model": "nvidia-nim/qwen-coder-32b"
}
```

Or for specific agents:

```json
{
  "agent": {
    "sisyphus": { "model": "nvidia-nim/qwen-coder-32b" },
    "metis": { "model": "nvidia-nim/kimi-k2.5" },
    "oracle": { "model": "nvidia-nim/qwen-coder-7b" }
  }
}
```

## Authentication

### Method 1: Environment Variable

Set the API key as an environment variable:

```bash
export NVIDIA_API_KEY="nvapi-DEIN_API_KEY_HIER"
```

### Method 2: /connect Command

Use the built-in authentication command:

```bash
opencode auth add nvidia-nim
```

This will prompt you to enter your API key interactively.

### Method 3: Config File

Add directly to the provider configuration (less secure):

```json
{
  "provider": {
    "nvidia-nim": {
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1",
        "apiKey": "nvapi-DEIN_API_KEY_HIER"
      }
    }
  }
}
```

## Command Line Usage

### List Available Models

```bash
opencode models
```

### Check Current Model

```bash
opencode model
```

### Switch Model

```bash
# Using full model ID
opencode --model nvidia-nim/qwen-coder-32b

# Or with provider prefix
opencode --model nvidia/qwen/qwen2_5-coder-32b-instruct
```

### Run with Specific Model

```bash
opencode --model nvidia-nim/kimi-k2.5 "Write a Python function"
```

## Doctor & Diagnostics

### Run Health Check

```bash
opencode doctor
```

### Validate Configuration

```bash
opencode doctor --verbose
```

### Test Provider

```bash
opencode doctor --test nvidia-nim
```

## Model Selection

### By Use Case

| Use Case | Recommended Model |
|----------|------------------|
| Code Generation | `nvidia-nim/qwen-coder-32b` |
| Quick Edits | `nvidia-nim/qwen-coder-7b` |
| Large Context | `nvidia-nim/kimi-k2.5` |
| General Purpose | `nvidia-nim/kimi-k2.5` |

### By Speed/Quality

| Priority | Model |
|----------|-------|
| Best Quality | `nvidia-nim/qwen-coder-32b` |
| Fastest | `nvidia-nim/qwen-coder-7b` |
| Largest Context | `nvidia-nim/kimi-k2.5` |

## Troubleshooting

### Provider Not Found

If you get an error about the provider not being found:

1. Verify the provider is in your config:
   ```bash
   cat ~/.config/opencode/opencode.json | grep nvidia-nim
   ```

2. Run doctor to regenerate:
   ```bash
   opencode doctor --fix
   ```

### Authentication Failed

1. Check your API key is valid:
   ```bash
   curl -H "Authorization: Bearer nvapi-DEIN_KEY" \
        https://integrate.api.nvidia.com/v1/models
   ```

2. Re-add authentication:
   ```bash
   opencode auth add nvidia-nim --force
   ```

### Model Not Loading

1. Verify model ID in config matches NVIDIA's API:
   - Must use: `qwen/qwen2_5-coder-32b-instruct` (not just `qwen-coder-32b`)

2. Check the `id` field in your model config matches exactly

## Advanced Configuration

### Custom Provider Name

You can rename the provider:

```json
{
  "provider": {
    "nvidia-qwen": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "NVIDIA Qwen",
      "options": {
        "baseURL": "https://integrate.api.nvidia.com/v1"
      }
    }
  }
}
```

### Multiple Providers

Combine with other providers for fallbacks:

```json
{
  "model": "nvidia-nim/qwen-coder-32b",
  "provider": {
    "nvidia-nim": { ... },
    "opencode-zen": { ... },
    "google": { ... }
  }
}
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `opencode models` | List available models |
| `opencode model` | Show current model |
| `opencode --model X` | Use specific model |
| `opencode doctor` | Run diagnostics |
| `opencode auth add nvidia-nim` | Add authentication |

## Environment Variables

OpenCode supports these environment variables for NVIDIA NIM:

| Variable | Description |
|----------|-------------|
| `NVIDIA_API_KEY` | Your NVIDIA API key |
| `OPENCODE_PROVIDER_NVIDIA_NIM_BASE_URL` | Override endpoint URL |

**Letzte Aktualisierung**: 2026-02-16
