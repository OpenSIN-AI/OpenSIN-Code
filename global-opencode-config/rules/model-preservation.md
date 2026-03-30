# NEVER ALTER SPECIFIED AI MODELS

**CRITICAL RULE - PERMANENT ENFORCEMENT**

The user has explicitly mandated the use of specific Google Gemini preview models, GLM-5, MiniMax, and Qwen models.

## ABSOLUTE PROHIBITIONS

1. **DO NOT run `opencode run -m` tests to verify if these models work.**
   - Assume they are 100% functional and correctly configured.

2. **If an API call to a Gemini model fails with:**
   - "not found"
   - "generateContent error"
   - Rate limits
   - Timeout
   
   **DO NOT remove the model from opencode.json or oh-my-opencode.json.**

3. **The exact provider strings are ABSOLUTE and IMMUTABLE:**
   - `google/gemini-3.1-pro-preview` (MIT -preview!)
   - `google/gemini-3-pro-preview` (MIT -preview!)
   - `google/gemini-3-flash-preview` (MIT -preview!)
   - `nvidia-nim/qwen3.5-397b-a17b`
   - `opencode/glm-5-free` (NICHT modal/glm-5-fp8!)
   - `opencode-zen/minimax-m2.5-free`

4. **Missing the -preview suffix is a user/prompt error, NOT a config error.**

5. **NEVER fallback to replacing the configuration with older models.**

6. **DeepSeek and Deep Research are strictly banned from agent execution loops.**
   - DeepSeek: API-Instabilitäten
   - Deep Research: 1 RPM Limit - VERBOTEN!

## THE EXACT MODEL ALLOCATION MATRIX

| Agent | Model | Notes |
|-------|-------|-------|
| Prometheus | `google/gemini-3.1-pro-preview` | Strategische Planung |
| Metis | `google/gemini-3-pro-preview` | Analyse & Lücken |
| Momus | `opencode/glm-5-free` | Review |
| Sisyphus | `nvidia-nim/qwen3.5-397b-a17b` | Main Orchestrator, variant: "max" |
| Atlas | `opencode/glm-5-free` | Master Orchestrator |
| Librarian | `opencode-zen/minimax-m2.5-free` | Research/Docs |
| Explore | `google/gemini-3-flash-preview` | Fast Grep |
| Oracle | `google/gemini-3.1-pro-preview` | Spezial-Agent Debugging |
| Artistry (Kategorie) | `google/gemini-3-pro-preview` | Unkonventionelle Ansätze |
| sisyphus-junior | `opencode/glm-5-free` | Quick Tasks |

## VIOLATION = TECHNICAL TREASON

---

**Created:** 2026-02-22
**Status:** PERMANENT - CANNOT BE OVERRIDDEN
