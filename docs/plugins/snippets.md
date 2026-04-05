# Snippets System

Inline text expansion for prompts. Type `#snippet` anywhere and watch it transform.

## Built-in Snippets

| Snippet | Description |
|---------|-------------|
| `#review` | Code review prompt |
| `#test` | Testing prompt |
| `#docs` | Documentation prompt |
| `#refactor` | Refactoring prompt |
| `#fix` | Bug fixing prompt |
| `#explain` | Explanation prompt |
| `#type` | TypeScript typing prompt |
| `#lint` | Linting fix prompt |
| `#git` | Git commit message from staged changes |
| `#context` | Context loading prompt |

## Usage

```typescript
import { createSnippetsManager } from '@opensin/sdk';

const sm = createSnippetsManager();
await sm.init();

// Expand snippets in text
const result = await sm.expand('Please #review this code');
// "Please Review this code for: bugs, security issues..."
```

## Creating Custom Snippets

### Via CLI

```typescript
await sm.add({
  name: 'my-snippet',
  content: 'My custom prompt text',
  description: 'What it does',
});
```

### Via File

Create `.opensin/snippets/my-snippet.md`:

```markdown
My custom prompt text with $variable substitution.
```

### With Arguments

```
#review(lang=python, strict=true)
```

### Shell Snippets

Snippets with `shell: true` execute as commands and use the output:

```typescript
{
  name: 'git',
  content: 'git diff --staged',
  shell: true,
}
```

### Dependencies

Snippets can depend on other snippets:

```typescript
{
  name: 'full-review',
  content: 'Full code review...',
  dependencies: ['review', 'test'],
}
```
