# sin-snip Tool — Shell Output Snipping

Reduces LLM token consumption by 60-90% by automatically truncating verbose shell output.

## How It Works

When a command produces output exceeding the configured thresholds, sin-snip keeps the first and last N lines and replaces the middle with a summary line.

## Usage

```typescript
// As a tool
const result = await SnipTool.execute({
  command: 'git log --oneline --all',
  maxLines: 50,
  maxChars: 10000,
});

// Returns metadata about snipping
console.log(result.metadata.wasSnipped);    // true
console.log(result.metadata.reduction);     // "85%"
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `maxLines` | 50 | Lines before snipping triggers |
| `maxChars` | 10000 | Characters before truncation |
| `cwd` | process.cwd() | Working directory |
| `timeout` | 30000 | Execution timeout (ms) |

## Snippable Commands

git, go, cargo, npm, yarn, pnpm, bun, docker, docker-compose, kubectl, helm, pip, make, cmake, terraform, curl, find, ls, grep, rg, ps, node, deno

## Output Format

```
<first 25 lines>

[... 150 lines snipped — total 200 lines, 45000 chars ...]

<last 25 lines>
```
