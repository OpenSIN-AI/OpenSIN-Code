# OpenCode Skills Catalog

**Status:** Active
**Global skills directory:** `~/.config/opencode/skills`
**Source mirror:** `~/.codex/skills`

## What OpenCode skills are

OpenCode skills are reusable task playbooks. Each skill lives in its own folder and normally starts with a `SKILL.md` file that tells the agent when to use it, what outcome it should deliver, and which local scripts, references, assets, or helper agents belong to that workflow.

## How to add or update a skill

1. Create or update a folder under `~/.config/opencode/skills/<skill-name>/`.
2. Put the skill contract in `SKILL.md` with a clear `name` and `description` in frontmatter.
3. Keep supporting files next to it when needed: `scripts/`, `references/`, `assets/`, `agents/`.
4. Prefer concrete triggers, expected deliverables, guardrails, and verification commands over vague advice.
5. If the skill is mirrored from Codex, update the Codex source first and then resync the OpenCode mirror.

## Skill folder shape

- `SKILL.md` — canonical instructions, triggers, workflow, validation.
- `scripts/` — optional helper scripts invoked by the skill.
- `references/` — optional examples, schemas, or source material.
- `agents/` — optional subagent prompts or support configs.
- `assets/` — optional static resources used by the skill.

## Current global OpenCode skill mirror

| Skill | Zweck | Pfad |
| --- | --- | --- |
| `anonymous` | Provides browser automation capabilities via the webauto-nodriver-mcp server. Enables agents to perform web interactions, UI automation, and cross-platform tasks using nodriver with stealth capabilities. | `~/.config/opencode/skills/anonymous` |
| `browser-crashtest-lab` | Full-browser crash-test and quality-audit workflow for web projects. Crawl pages, open links, click buttons, collect console/page/network failures, run accessibility and Lighthouse best-practice checks, and score visual/design quality. Use when users ask for aggressive E2E browser testing, "open every link", "click every button", UX/design quality grading, production readiness checks, or DevTools-level debugging. | `~/.config/opencode/skills/browser-crashtest-lab` |
| `check-plan-done` | Unified plan-and-execute workflow. Check whether a viable plan already exists, create and review one if needed, then execute task by task until the done criteria pass. Synthesizes the strongest parts of `omoc-plan-swarm`, `/biometrics-plan`, and `/biometrics-work`. | `~/.config/opencode/skills/check-plan-done` |
| `cloudflare-deploy` | Deploy applications and infrastructure to Cloudflare using Workers, Pages, and related platform services. Use when the user asks to deploy, host, publish, or set up a project on Cloudflare. | `~/.config/opencode/skills/cloudflare-deploy` |
| `doc` | "Use when the task involves reading, creating, or editing `.docx` documents, especially when formatting or layout fidelity matters; prefer `python-docx` plus the bundled `scripts/render_docx.py` for visual checks." | `~/.config/opencode/skills/doc` |
| `imagegen` | "Use when the user asks to generate or edit images with a Gemini-first workflow (for example: ad creatives, hero images, product shots, concept art, covers, image edits, or batch variants). Prefer the bundled Gemini router (`scripts/gemini_image_router.py`) with provider order Nano Banana Pro -> Nano Banana 2 -> Imagen 4 Fast -> NVIDIA NIM." | `~/.config/opencode/skills/imagegen` |
| `nvidia-3d-forge` | Build production-grade 3D assets as an image-to-3D or text-to-3D pipeline with OpenUSD/USDZ outputs, topology and PBR quality gates, and validation handoff. | `~/.config/opencode/skills/nvidia-3d-forge` |
| `omoc-plan-swarm` | OMOC Plan Swarm v2 — 3-stage pipeline for planning requests (Trigger: "plan", "roadmap", "strategie", "konzept"). Stage 1: Librarian+Explore parallel research. Stage 2: Plan synthesis (category: deep). Stage 3: Critical review (category: artistry). Fail-fast gates between stages. Max 4 task() calls. No temp files, no monolith. | `~/.config/opencode/skills/omoc-plan-swarm` |
| `nvidia-video-forge` | Create production-grade videos with hosted NVIDIA NIM/Cosmos APIs using a deterministic generation pipeline, multisource ingestion, chat-bridge judging, and strict QA gating. | `~/.config/opencode/skills/nvidia-video-forge` |
| `opencode-subagent-delegation` | Persistent co-working orchestration for Codex and opencode CLI in the same project directory. Use when Codex must collaborate continuously with opencode agents, attach complete project context, enforce strict secret redaction, apply canonical-first conflict resolution, and prevent duplicated governance text by indexing existing project docs. | `~/.config/opencode/skills/opencode-subagent-delegation` |
| `pdf` | "Use when tasks involve reading, creating, or reviewing PDF files where rendering and layout matter; prefer visual checks by rendering pages (Poppler) and use Python tools such as `reportlab`, `pdfplumber`, and `pypdf` for generation and extraction." | `~/.config/opencode/skills/pdf` |
| `sin-a2a-agent-forge` | Create, standardize, or upgrade SIN A2A agents using the canonical SIN template, private GitHub repo provisioning, team-manager registry rules, Google Docs tab sync, A2A card requirements, and fleet validation. Use whenever a new SIN A2A agent must be built or an existing one must be brought up to the 2026 fleet standard. | `~/.config/opencode/sin-a2a-agent-forge` |
| `sora` | "Use when the user asks to generate, remix, poll, list, download, or delete Sora videos via OpenAI’s video API using the bundled CLI (`scripts/sora.py`), including requests like “generate AI video,” “Sora,” “video remix,” “download video/thumbnail/spritesheet,” and batch video generation; requires `OPENAI_API_KEY` and Sora API access." | `~/.config/opencode/skills/sora` |
| `vercel-deploy` | Deploy applications and websites to Vercel. Use when the user requests deployment actions like "deploy my app", "deploy and give me the link", "push this live", or "create a preview deployment". | `~/.config/opencode/skills/vercel-deploy` |

## Usage note

This machine now has a full mirrored skill tree for OpenCode. Skills that still mention Codex intentionally preserve their original workflow semantics, but path references in the OpenCode mirror now point at `~/.config/opencode/skills/...`.
