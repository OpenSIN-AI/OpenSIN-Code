# NVIDIA NIM Setup Guide

Complete setup documentation for NVIDIA NIM integration in OpenClaw and OpenCode CLI.

## Table of Contents

1. [Overview](#1-übersicht)
2. [Quick Start (5 Minutes)](#2-quick-start-5-minuten)
3. [Detailed Setup](#3-detailliertes-setup)
4. [Model Overview](#4-modell-übersicht)
5. [Troubleshooting](#5-troubleshooting)
6. [Best Practices](#6-best-practices)
7. [Performance Optimization](#7-performance-optimierung)
8. [API Reference](#8-api-reference)
9. [Links & Resources](#9-links--resources)

---

## 1. Übersicht

### Was ist NVIDIA NIM?

NVIDIA NIM (NVIDIA Inference Microservices) provides high-performance AI inference through a standardized API compatible with OpenAI's format. It offers access to state-of-the-art models including Qwen Coder series and Kimi K2.5.

### Verfügbare Modelle

| Modell | Context | Output | Use Case |
|--------|---------|--------|----------|
| Qwen2.5-Coder-32B | 128K | 8K | Code Generation (Best) |
| Qwen2.5-Coder-7B | 128K | 8K | Code Generation (Fast) |
| Kimi K2.5 | 1M | 64K | General Purpose |

### Kosten & Rate Limits

- **Free Tier**: 40 RPM (Requests Per Minute)
- **HTTP Status bei Limit**: 429 Too Many Requests
- **Lösung bei 429**: 60 Sekunden warten + Fallbacks nutzen

---

## 2. Quick Start (5 Minuten)

### Schritt 1: API Key generieren

1. Besuche https://build.nvidia.com/
2. Registriere dich oder logge dich ein
3. Gehe zu "API Keys" im Dashboard
4. Erstelle einen neuen API Key
5. Kopiere den Key (Format: `nvapi-...`)

### Schritt 2: OpenClaw konfigurieren

Bearbeite `~/.openclaw/openclaw.json`:

```json
{
  "env": {
    "NVIDIA_API_KEY": "nvapi-DEIN_API_KEY_HIER"
  },
  "models": {
    "providers": {
      "nvidia-nim": {
        "baseUrl": "https://integrate.api.nvidia.com/v1",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen/qwen2_5-coder-32b-instruct",
            "name": "Qwen 2.5 Coder 32B",
            "contextWindow": 131072,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "nvidia-nim/qwen/qwen2_5-coder-32b-instruct",
        "fallbacks": ["nvidia-nim/kimi-k2.5"]
      }
    }
  }
}
```

### Schritt 3: OpenCode CLI konfigurieren

Bearbeite `~/.config/opencode/opencode.json`:

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
          "name": "Qwen 2.5 Coder 32B",
          "id": "qwen/qwen2_5-coder-32b-instruct",
          "limit": { "context": 131072, "output": 8192 }
        },
        "kimi-k2.5": {
          "name": "Kimi K2.5",
          "id": "kimi-k2.5",
          "limit": { "context": 1048576, "output": 65536 }
        }
      }
    }
  }
}
```

### Schritt 4: Erster Test

```bash
# OpenClaw testen
openclaw models
openclaw doctor

# OpenCode testen
opencode models
```

---

## 3. Detailliertes Setup

### 3.1 NVIDIA NIM Account

#### Registrierung auf build.nvidia.com

1. Öffne https://build.nvidia.com/
2. Klicke "Sign In" oder "Get Started"
3. Erstelle einen Account mit Email oder nutze Google/GitHub OAuth
4. Verifiziere deine Email-Adresse

#### API Key generieren

1. Nach Login: Gehe zum Dashboard
2. Suche "API Keys" im Menü
3. Klicke "Create API Key"
4. Benenne den Key (z.B. "OpenClaw-Production")
5. Kopiere den Key sofort - er wird nur einmal angezeigt!

#### Free Credits aktivieren

- Neue Accounts erhalten automatisch Free Credits
- Diese sind ausreichend für Entwicklung und Testing
- Checke dein Guthaben im Dashboard unter "Credits"

### 3.2 OpenClaw Konfiguration

#### Datei: ~/.openclaw/openclaw.json

Die vollständige Konfiguration:

```json
{
  "meta": {
    "lastTouchedVersion": "2026.2.15",
    "lastTouchedAt": "2026-02-16T22:07:39.706Z"
  },
  "env": {
    "NVIDIA_API_KEY": "nvapi-DEIN_API_KEY_HIER"
  },
  "auth": {
    "profiles": {
      "nvidia:default": {
        "provider": "nvidia",
        "mode": "api_key"
      }
    }
  },
  "models": {
    "providers": {
      "nvidia-nim": {
        "baseUrl": "https://integrate.api.nvidia.com/v1",
        "api": "openai-completions",
        "models": [
          {
            "id": "qwen/qwen2_5-coder-32b-instruct",
            "name": "Qwen 2.5 Coder 32B (NVIDIA NIM)",
            "contextWindow": 131072,
            "maxTokens": 8192,
            "input": ["text"],
            "output": ["text"]
          },
          {
            "id": "qwen/qwen2_5-coder-7b-instruct",
            "name": "Qwen 2.5 Coder 7B (NVIDIA NIM)",
            "contextWindow": 131072,
            "maxTokens": 8192,
            "input": ["text"],
            "output": ["text"]
          },
          {
            "id": "kimi-k2.5",
            "name": "Kimi K2.5 (NVIDIA NIM)",
            "contextWindow": 1048576,
            "maxTokens": 65536,
            "input": ["text"],
            "output": ["text"]
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": {
        "primary": "nvidia-nim/qwen/qwen2_5-coder-32b-instruct",
        "fallbacks": [
          "nvidia-nim/qwen/qwen2_5-coder-7b-instruct",
          "nvidia-nim/kimi-k2.5"
        ]
      }
    }
  }
}
```

#### Wichtige Felder erklärt

| Feld | Beschreibung | Pflicht |
|------|--------------|----------|
| `NVIDIA_API_KEY` | Dein API Key von build.nvidia.com | Ja |
| `baseUrl` | NVIDIA NIM Endpoint | Ja |
| `api` | MUSS "openai-completions" sein | Ja |
| `models[].id` | Modell-ID für API Calls | Ja |

### 3.3 OpenCode CLI Konfiguration

#### Datei: ~/.config/opencode/opencode.json

Füge den Provider hinzu:

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
          "name": "Qwen 2.5 Coder 32B",
          "id": "qwen/qwen2_5-coder-32b-instruct",
          "limit": { "context": 131072, "output": 8192 }
        },
        "qwen-coder-7b": {
          "name": "Qwen 2.5 Coder 7B",
          "id": "qwen/qwen2_5-coder-7b-instruct",
          "limit": { "context": 131072, "output": 8192 }
        },
        "kimi-k2.5": {
          "name": "Kimi K2.5",
          "id": "kimi-k2.5",
          "limit": { "context": 1048576, "output": 65536 }
        }
      }
    }
  }
}
```

#### Authentication via /connect

Alternativ kannst du den Provider über die CLI hinzufügen:

```bash
# Provider hinzufügen
opencode auth add nvidia-nim

# Oder mit API Key direkt
opencode auth add nvidia-nim --api-key nvapi-DEIN_KEY
```

---

## 4. Modell-Übersicht

### Qwen2.5 Coder Series

| Modell | Context | Output | Stärken |
|--------|---------|--------|---------|
| Qwen2.5-Coder-32B | 128K | 8K | Beste Code-Qualität, komplexe Tasks |
| Qwen2.5-Coder-7B | 128K | 8K | Schnell, ressourceneffizient |

**Empfehlung**:
- 32B für: Komplexe Algorithmen, Refactoring, Security-Code
- 7B für: Schnelle Iteration, einfache Scripts, hohe Geschwindigkeit

### Kimi K2.5

| Modell | Context | Output | Stärken |
|--------|---------|--------|---------|
| Kimi K2.5 | 1M | 64K | Großer Context, General Purpose |

**Empfehlung**:
- Für: Dokument-Analyse, Multi-File Understanding, lange Conversations
- Nicht empfohlen für: Reine Code-Generation (Qwen ist spezialisiert)

### Modell-Auswahl Matrix

| Use Case | Empfohlenes Modell |
|----------|-------------------|
| Code Generation | Qwen2.5-Coder-32B |
| Code Review | Qwen2.5-Coder-32B |
| Refactoring | Qwen2.5-Coder-32B |
| Schnelle Fixes | Qwen2.5-Coder-7B |
| Dokumentation | Kimi K2.5 |
| Multi-File Analysis | Kimi K2.5 |
| Large Context Tasks | Kimi K2.5 |

---

## 5. Troubleshooting

### HTTP 401 Unauthorized

**Symptom**: API gibt 401 Error zurück

**Ursachen**:
1. API Key ist falsch oder abgelaufen
2. Authorization Header fehlt oder ist falsch

**Lösungen**:
```bash
# API Key prüfen
echo $NVIDIA_API_KEY

# Key neu setzen in openclaw.json
openclaw auth add nvidia --api-key nvapi-NEUER_KEY

# Oder direkt in der Config
# Bearbeite ~/.openclaw/openclaw.json
# Setze "NVIDIA_API_KEY" auf den neuen Key

# Testen
curl -H "Authorization: Bearer nvapi-DEIN_KEY" \
     -H "Content-Type: application/json" \
     https://integrate.api.nvidia.com/v1/models
```

### HTTP 429 Too Many Requests

**Symptom**: API gibt 429 Error zurück

**Ursache**: Rate Limit überschritten (40 RPM beim Free Tier)

**Lösungen**:
```bash
# 60 Sekunden warten
sleep 60

# Fallback Chain nutzen
# Konfiguriere Fallbacks in openclaw.json:
"fallbacks": [
  "nvidia-nim/qwen/qwen2_5-coder-7b-instruct",
  "opencode-zen/zen/big-pickle"
]

# Oder: Request-Rate reduzieren
# Implementiere Retry mit exponentiellem Backoff
```

### Model Not Found

**Symptom**: "Model not found" oder "Invalid model"

**Ursachen**:
1. Falsche Modell-ID
2. Modell nicht im Portal freigeschaltet

**Lösungen**:
```bash
# Verfügbare Modelle prüfen
curl -H "Authorization: Bearer nvapi-DEIN_KEY" \
     https://integrate.api.nvidia.com/v1/models

-ID prüfen# Modell - korrekte IDs:
# "qwen/qwen2_5-coder-32b-instruct"
# "qwen/qwen2_5-coder-7b-instruct"
# "kimi-k2.5"

# Provider-Präfix hinzufügen in Config:
"primary": "nvidia-nim/qwen/qwen2_5-coder-32b-instruct"
```

### Gateway Startet Nicht

**Symptom**: OpenClaw Gateway startet nicht oder stürzt ab

**Ursachen**:
1. JSON Syntax Fehler
2. Fehlendes "api": "openai-completions" Feld

**Lösungen**:
```bash
# JSON Syntax prüfen
python3 -c "import json; json.load(open('~/.openclaw/openclaw.json'))"

# Config validieren
openclaw doctor

# Gateway neustarten
openclaw gateway restart

# Häufige Fehler:
# ❌ "api": "openai"        (falsch)
# ✅ "api": "openai-completions" (korrekt)

# ❌ "baseUrl": ".../v1/"   (mit Slash am Ende, manchmal problematisch)
# ✅ "baseUrl": ".../v1"    (ohne Slash)
```

### Connection Timeout

**Symptom**: Request hängt oder timeout nach 30s

**Ursachen**:
1. Netzwerk-Probleme
2. NVIDIA NIM Service überlastet

**Lösungen**:
```bash
# Netzwerk testen
curl -I https://integrate.api.nvidia.com/v1

# Mit Timeout testen
curl --max-time 30 -H "Authorization: Bearer $NVIDIA_API_KEY" \
     https://integrate.api.nvidia.com/v1/models

# Fallback nutzen
# Siehe Fallback Chain Konfiguration
```

### Invalid JSON im Provider

**Symptom**: "Failed to parse provider config"

**Ursache**: Falsches JSON Format in opencode.json

**Lösung**:
```bash
# JSON validieren
cat ~/.config/opencode/opencode.json | python3 -m json.tool > /dev/null

# Oder mit jq
jq . ~/.config/opencode/opencode.json > /dev/null

# Häufige Fehler:
# - Fehlende Kommas zwischen Feldern
# - Falsche Anführungszeichen
# - trailing commas (nicht erlaubt in JSON)
```

---

## 6. Best Practices

### Fallback Chain konfigurieren

Immer eine Fallback-Kette konfigurieren für Resilience:

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "nvidia-nim/qwen/qwen2_5-coder-32b-instruct",
        "fallbacks": [
          "nvidia-nim/qwen/qwen2_5-coder-7b-instruct",
          "nvidia-nim/kimi-k2.5",
          "opencode-zen/zen/big-pickle"
        ]
      }
    }
  }
}
```

**Empfohlene Fallback-Reihenfolge**:
1. Primary: Qwen 32B (beste Qualität)
2. Fallback 1: Qwen 7B (schnell, weniger Last)
3. Fallback 2: Kimi K2.5 (anderer Provider)
4. Fallback 3: OpenCode ZEN (kostenlos, unabhängig)

### Rate Limit Monitoring

Implementiere Monitoring für Rate Limits:

```bash
# Monitoring Script
#!/bin/bash
while true; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $NVIDIA_API_KEY" \
    https://integrate.api.nvidia.com/v1/models)
  
  if [ "$RESPONSE" = "429" ]; then
    echo "Rate limit reached at $(date)"
    sleep 60
  fi
  
  sleep 10
done
```

### Token Usage Tracking

Tracking für Cost-Optimierung:

```bash
# Token-Nutzung tracken
curl -H "Authorization: Bearer $NVIDIA_API_KEY" \
     -H "Content-Type: application/json" \
     -X POST https://integrate.api.nvidia.com/v1/chat/completions \
     -d '{
       "model": "qwen/qwen2_5-coder-32b-instruct",
       "messages": [{"role": "user", "content": "test"}],
       "stream": false
     }' | jq '.usage'
```

### Cost Optimization

**Tipps zur Kostenreduzierung**:

1. **Qwen 7B statt 32B für einfache Tasks**
   - ~4x günstiger
   - Schnellere Responses

2. **Streaming nutzen**
   - Erstelle earlier Tokens
   - Bessere UX

3. **Context optimieren**
   - Nur relevante Files im Prompt
   - Chunking für große Dokumente

4. **Caching implementieren**
   - Cache häufige Requests
   - Reduziere API Calls

---

## 7. Performance Optimierung

### Caching implementieren

```python
import hashlib
import json
from datetime import timedelta

class NIMCache:
    def __init__(self, redis_client, ttl=3600):
        self.redis = redis_client
        self.ttl = ttl
    
    def _hash(self, prompt, model):
        key = f"{model}:{prompt}"
        return hashlib.sha256(key.encode()).hexdigest()
    
    def get(self, prompt, model):
        key = self._hash(prompt, model)
        cached = self.redis.get(f"nim:{key}")
        return json.loads(cached) if cached else None
    
    def set(self, prompt, model, response):
        key = self._hash(prompt, model)
        self.redis.setex(f"nim:{key}", self.ttl, json.dumps(response))
```

### Batch Requests

Für mehrere ähnliche Requests:

```python
import asyncio
import aiohttp

async def batch_request(prompts, model="qwen/qwen2_5-coder-32b-instruct"):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for prompt in prompts:
            task = session.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}]
                },
                headers=headers
            )
            tasks.append(task)
        
        responses = await asyncio.gather(*tasks, return_exceptions=True)
        return [r.json() for r in responses if not isinstance(r, Exception)]
```

### Streaming Responses

```python
import requests

def stream_completion(prompt, model="qwen/qwen2_5-coder-32b-instruct"):
    response = requests.post(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        json={
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True
        },
        headers={"Authorization": f"Bearer {API_KEY}"},
        stream=True
    )
    
    for chunk in response.iter_lines():
        if chunk:
            data = chunk.decode('utf-8')
            if data.startswith('data: '):
                yield json.loads(data[6:])['choices'][0]['delta']['content']
```

---

## 8. API Reference

### Endpoint

```
https://integrate.api.nvidia.com/v1
```

### Authentication

```
Authorization: Bearer nvapi-DEIN_API_KEY
```

### Verfügbare Endpoints

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | /models | Liste aller Modelle |
| POST | /chat/completions | Chat Completion |
| POST | /completions | Text Completion |
| GET | /usage | API Nutzung |

### curl Beispiele

```bash
# Modelle auflisten
curl -H "Authorization: Bearer nvapi-DEIN_KEY" \
     https://integrate.api.nvidia.com/v1/models

# Chat Completion
curl -H "Authorization: Bearer nvapi-DEIN_KEY" \
     -H "Content-Type: application/json" \
     -X POST https://integrate.api.nvidia.com/v1/chat/completions \
     -d '{
       "model": "qwen/qwen2_5-coder-32b-instruct",
       "messages": [
         {"role": "system", "content": "You are a helpful coding assistant."},
         {"role": "user", "content": "Write a Python function to calculate fibonacci."}
       ],
       "temperature": 0.7,
       "max_tokens": 1000
     }'

# Streaming
curl -H "Authorization: Bearer nvapi-DEIN_KEY" \
     -H "Content-Type: application/json" \
     -X POST https://integrate.api.nvidia.com/v1/chat/completions \
     -d '{
       "model": "qwen/qwen2_5-coder-32b-instruct",
       "messages": [{"role": "user", "content": "Count to 5"}],
       "stream": true
     }'
```

### Python Beispiele

```python
import requests

API_KEY = "nvapi-DEIN_KEY"
BASE_URL = "https://integrate.api.nvidia.com/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Chat Completion
response = requests.post(
    f"{BASE_URL}/chat/completions",
    headers=headers,
    json={
        "model": "qwen/qwen2_5-coder-32b-instruct",
        "messages": [
            {"role": "system", "content": "You are a coding assistant."},
            {"role": "user", "content": "What is 2+2?"}
        ],
        "temperature": 0.7,
        "max_tokens": 100
    }
)

print(response.json())
```

### JavaScript/Node.js Beispiele

```javascript
const axios = require('axios');

const API_KEY = 'nvapi-DEIN_KEY';
const BASE_URL = 'https://integrate.api.nvidia.com/v1';

async function chatCompletion(prompt) {
  const response = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: 'qwen/qwen2_5-coder-32b-instruct',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    },
    {
      headers: { Authorization: `Bearer ${API_KEY}` }
    }
  );
  
  return response.data.choices[0].message.content;
}

chatCompletion('Hello, world!').then(console.log);
```

---

## 9. Links & Resources

### Offizielle NVIDIA NIM Docs
- https://build.nvidia.com/
- https://docs.nvidia.com/

### OpenClaw Docs
- https://docs.openclaw.ai
- https://github.com/openclaw/openclaw

### OpenCode Docs
- https://opencode.ai/docs
- https://github.com/opencode-ai/opencode

### Rate Limit Informationen
- Free Tier: 40 RPM
- Check: https://build.nvidia.com/account/limits

### Support
- NVIDIA: https://build.nvidia.com/help
- OpenClaw Discord: https://discord.gg/openclaw
- OpenCode Discord: https://discord.gg/opencode

---

**Letzte Aktualisierung**: 2026-02-16
**Version**: 1.0
**Automatisch generiert für OpenClaw + OpenCode CLI**
