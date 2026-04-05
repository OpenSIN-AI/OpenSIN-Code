# Morph Fast Apply Tool

High-speed code editing via Morph's Fast Apply API.

## Setup

```bash
export MORPH_API_KEY=your-api-key
export MORPH_API_URL=https://api.morph.io/v1
export MORPH_MODEL=morph-fast
```

## Usage

```typescript
import { MorphFastApplyTool } from '@opensin/sdk';

const result = await MorphFastApplyTool.execute({
  file_path: 'src/index.ts',
  edits: [
    { oldText: 'function foo()', newText: 'async function foo()' },
  ],
  context_lines: 3,
});
```

## Performance

- 10,500+ tokens/sec editing speed
- Lazy edit markers for minimal diff
- Unified diff output for review
