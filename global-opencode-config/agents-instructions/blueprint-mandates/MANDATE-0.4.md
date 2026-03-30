# MANDATE 0.4: DOCKER SOVEREIGNTY & INFRASTRUCTURE MASTERY

**All Docker images must be preserved locally.**

- **Local Persistence & Saving:** Alle Docker-Images MÜSSEN via `docker save` lokal in `/Users/jeremy/dev/sin-code/Docker/[projektname]/images/` gesichert werden
- **Hierarchical Structure:** Jedes Projekt führt sein eigenes Verzeichnis `/Users/jeremy/dev/sin-code/Docker/[projektname]/` für Images, Configs, Volumes und Logs
- **Guide Conformity:** Agenten MÜSSEN die 500+ Zeilen starken Elite-Handbücher in `/Users/jeremy/dev/sin-code/docs/dev/elite-guides/` befolgen

```
/Users/jeremy/dev/sin-code/Docker/
├── [project-name]/
│   ├── images/          # docker save outputs
│   ├── configs/         # docker-compose files
│   ├── volumes/         # persistent data
│   └── logs/            # container logs
└── Guides/              # 500+ line Elite Guides (Legacy Reference)
```

---

**Source:** ~/.config/opencode/Agents.md (Line 868-885)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
