---
description: Creating skills with progressive disclosure and strong triggers for OpenSIN-Code plugins
---

# Skill Development Skill

This skill should be used when creating new skills for plugins or improving existing skill quality.

## Skill File Format

`skills/my-skill/SKILL.md`:

```markdown
---
description: Third-person description with strong triggers
---

# My Skill Skill

Core documentation (~1,500-2,000 words).

## Sections
- API Reference
- Examples
- Best Practices
- Troubleshooting
```

## Progressive Disclosure

1. **Metadata** (always loaded): description with strong triggers
2. **Core SKILL.md** (when triggered): Essential API reference
3. **References/Examples** (as needed): Detailed guides

## Writing Style

- Third-person descriptions ("This skill should be used when...")
- Strong trigger phrases for reliable loading
- Imperative/infinitive form throughout
- Be specific about when to use
