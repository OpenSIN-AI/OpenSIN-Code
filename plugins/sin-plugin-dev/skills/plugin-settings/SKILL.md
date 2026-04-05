---
description: Configuration patterns using .local.md files for OpenSIN-Code plugins
---

# Plugin Settings Skill

This skill should be used when making plugins configurable, storing per-project state, or implementing user preferences.

## Settings File Pattern

`.opensin/my-plugin.local.md`:

```markdown
---
enabled: true
setting1: value1
setting2: value2
---

Optional notes about this configuration.
```

## Parsing Settings

```typescript
import { extractFrontmatter } from './core/config-loader';
const content = fs.readFileSync(settingsFile, 'utf-8');
const [settings, _notes] = extractFrontmatter(content);
```

## Best Practices

1. Use `.local.md` extension for settings files
2. Store in `.opensin/` directory
3. Use YAML frontmatter for structured config
4. Provide sensible defaults
5. Validate settings on load
6. Allow per-project overrides
