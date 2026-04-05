# WakaTime Integration

Tracks coding activity in OpenSIN sessions via the WakaTime API.

## Setup

```bash
# Via environment variable
export WAKATIME_API_KEY=your-api-key
export WAKATIME_PROJECT=my-project

# Or via config file
# ~/.wakatime.cfg (standard WakaTime config)
# or ~/.opensin/wakatime.json
```

## API

```typescript
import { createWakaTimeTracker } from '@opensin/sdk';

const tracker = createWakaTimeTracker();
await tracker.init();

// Track session
await tracker.trackSessionStart('my-project');
await tracker.trackToolExecution('write', 'src/index.ts', 'typescript');
await tracker.trackSessionEnd();
```

## What Gets Tracked

- Tool executions (write, edit, read, bash, etc.)
- Session duration
- File edits with language detection
- Project context
