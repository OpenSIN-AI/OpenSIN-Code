# OpenTelemetry Plugin

Fleet observability via OTLP/gRPC to any OpenTelemetry-compatible backend.

## Supported Backends

- Datadog
- Honeycomb
- Grafana Cloud
- Any OTLP-compatible receiver

## Setup

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
export OTEL_SERVICE_NAME=opensin-code
export OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer xxx
```

## API

```typescript
import { createOpenTelemetryExporter } from '@opensin/sdk';

const otel = createOpenTelemetryExporter();
await otel.init();

// Record metrics
otel.recordTokenUsage('openai', 'gpt-4o', 1200, 800, 0.045);
otel.recordToolExecution('write', 250, true);
otel.recordGitCommit('feat: add profiles', 5);

// Traces
const span = otel.startSpan('agent-loop');
otel.addSpanEvent(span.spanId, 'tool-called', { tool: 'write' });
otel.endSpan(span.spanId, { code: 0 });

// Logs
otel.log('INFO', 'Agent started', { model: 'gpt-4o' });
```

## Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `llm.tokens.input` | counter | Input tokens consumed |
| `llm.tokens.output` | counter | Output tokens generated |
| `llm.cost.usd` | counter | Cost in USD |
| `tool.duration.ms` | histogram | Tool execution time |
| `tool.calls` | counter | Number of tool calls |
| `git.commits` | counter | Number of commits |
| `git.files.changed` | counter | Files changed per commit |
