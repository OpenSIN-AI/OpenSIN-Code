# MANDATE 0.13: CEO-LEVEL WORKSPACE ORGANIZATION (2026 ELITE)

**The home directory is a fortress, not a dumping ground.**

Your MacBook filesystem MUST follow CEO-level enterprise organization:

```
/Users/jeremy/
├── Desktop/                          # CLEAN - Only temp work, auto-cleaned daily
├── Documents/                        # Important documents only
├── Downloads/                        # Temp downloads, cleaned weekly
├── Bilder/                           # All images organized
│   └── AI-Screenshots/               # AI tool screenshots (auto-archived)
│       ├── nodriver/                 # nodriver screenshots
│       ├── steel/                    # Steel browser screenshots
│       ├── opencode/                 # OpenCode screenshots
│       └── archive/                  # Auto-archived (7+ days old)
├── dev/                              # ALL development work
│   ├── projects/                     # Organized projects
│   │   ├── active/                   # Currently active projects
│   │   ├── archive/                  # Completed/inactive projects
│   │   └── experiments/              # POC and testing
│   ├── sin-code/                     # Main SIN ecosystem
│   │   ├── archive/                  # Archived files
│   │   ├── Docker/                   # Docker configs
│   │   ├── Guides/                   # Elite guides (500+ lines)
│   │   ├── Singularity/              # Singularity plugins
│   │   └── troubleshooting/          # Ticket files
│   └── [project-dirs]/               # Active project directories
└── .config/opencode/                 # PRIMARY CONFIG
```

**Rules:**
- NO loose files in `~/` - everything has a home
- NO project directories directly in `~/` - use `~/dev/`
- Auto-cleanup scripts run daily (Desktop, AI screenshots)
- Downloads cleaned weekly

---

**Source:** ~/.config/opencode/Agents.md (Line 1019-1058)
**Status:** ACTIVE - MANDATORY COMPLIANCE
**Category:** blueprint-mandates
