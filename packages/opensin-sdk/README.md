# @opensin/sdk

OpenSIN SDK — Core client, agent tooling, and intelligence modules.

## Installation

```bash
npm install @opensin/sdk
```

## Modules

### Core

- **OpenSINClient** — JSON-RPC client for OpenSIN protocol

### Agent Intelligence

#### Model Routing (`model_routing`)

Smart model selection based on task complexity. Routes trivial/simple tasks to cheap models, complex tasks to expert models.

```typescript
import { createRouter } from '@opensin/sdk'

const router = createRouter()
const decision = router.route('What is 2+2?')
// { modelId: 'openai/gpt-4o-mini', complexity: 'trivial' }

const decision2 = router.route('Write a comprehensive...', true)
// { modelId: 'openai/gpt-4o', complexity: 'moderate', fallbackModelId: 'openai/o1' }
```

#### Usage Pricing (`usage_pricing`)

Cost estimation and usage tracking for 10+ models.

```typescript
import { createPricing } from '@opensin/sdk'

const pricing = createPricing()
const cost = pricing.estimateCost('openai/gpt-4o', 1000, 500)
// 0.0075

pricing.recordUsage({ model: 'openai/gpt-4o', inputTokens: 1000, outputTokens: 500, cost: 0.0075, duration: 500, timestamp: Date.now() })
const summary = pricing.getSummary()
```

#### Memory (`memory`)

Persistent memory with file-based storage, search, and tag filtering.

```typescript
import { createMemoryManager, createFileProvider } from '@opensin/sdk'

const manager = createMemoryManager(createFileProvider('~/.opensin/memory'))
const entry = await manager.add('User prefers TypeScript', ['preferences'], 0.8)
const results = await manager.search('TypeScript')
```

#### Parallel Tools (`parallel_tools`)

Parallel tool execution with worker pool and path-scoped concurrency.

```typescript
import { createParallelExecutor } from '@opensin/sdk'

const executor = createParallelExecutor()
executor.shouldParallelize([
  { id: '1', name: 'read_file', input: { path: '/a.txt' } },
  { id: '2', name: 'read_file', input: { path: '/b.txt' } },
])
// true

const results = await executor.executeParallel(calls, handler)
```

#### Safety (`safety`)

Destructive command detection for shell commands.

```typescript
import { createSafetyDetector } from '@opensin/sdk'

const detector = createSafetyDetector()
const check = detector.check('rm -rf /')
// { isDestructive: true, risk: 'critical', suggestions: [...] }
```

### Context Management (`context_mgmt`)

Context window management with 5 compression strategies: truncate, summarize, sliding_window, priority_based, hybrid.

### Session Persistence (`session_persistence`)

JSONL-based session storage with create/resume/list/delete.

### Agent Loop (`agent_loop`)

Full agent loop with LLM integration, tool execution, and callback system.

### Tool System (`tools`)

Built-in tools: Bash, Read, Write, Edit, Grep, Glob.

### Hook System (`hook_system`)

Pre/Post tool execution hooks with spawn-based execution.

### Skill System (`skill_system`)

SKILL.md loading, discovery, and activation.

### Terminal UI (`terminal_ui`)

Status bar, markdown rendering, and colorized output.

### MCP Stdio (`mcp_stdio`)

JSON-RPC 2.0 stdio transport for MCP server integration.

### Permissions (`permissions`)

Rule-based permission evaluation with session caching and approval gates.

### Prompt Builder (`prompt_builder`)

System prompt construction with templates and context injection.

## Tests

```bash
npm test
```

573+ tests passing.
