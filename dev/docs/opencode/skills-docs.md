# OpenCode Skills Documentation

## Installierte Globale Skills
- **self-healer**: Ein autonomer Skill, der von LaunchAgents getriggert wird, um defekte SIN-Solver Mikro-Steps via Websuche zu heilen. Greift streng auf die SSOT Vorgaben zurück. Pfad: `~/.config/opencode/skills/self-healer/SKILL.md`.
- **enterprise-deep-debug**: Ultimativer Enterprise-Debugging Skill fuer RCA (facts-first), Parallel-Subagenten, Web-Validierung, minimale Fixes und Knowledge-Flush nach `AGENTS.md`/`CLAUDE.md`. Pfad: `~/.config/opencode/skills/enterprise-deep-debug/SKILL.md`.

## Konvention fuer eigene Standalone-Skills
- Eigene standalone Skill-Repos liegen unter `~/dev/skills/<repo-name>/`.
- `~/.config/opencode/skills/` enthaelt nur die installierten Skill-Verzeichnisse bzw. Symlinks fuer OpenCode Discovery.
- Beispiel SSOT-Repo: `~/dev/skills/opencode-enterprise-deep-debug-skill/`.
- Lege standalone Skill-Repos nicht unter `~/dev/projects/...` ab; eingebettete Projekt-/Agent-Skills innerhalb eines Produkt-Repos sind davon ausgenommen.

*Zuletzt aktualisiert durch den Self-Hackable-Healing-Agent Aufbau.*
