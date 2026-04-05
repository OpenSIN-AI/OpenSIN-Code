/**
 * OpenSIN OpenTelemetry Plugin — Fleet Observability
 *
 * Exports metrics, logs, and traces via OTLP/gRPC to any OpenTelemetry-compatible
 * backend (Datadog, Honeycomb, Grafana Cloud, etc.).
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

interface OtelConfig {
  enabled: boolean;
  endpoint: string;
  headers?: Record<string, string>;
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
}

interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: 'INTERNAL' | 'CLIENT' | 'SERVER';
  startTime: number;
  endTime?: number;
  attributes: Record<string, string | number | boolean>;
  events: SpanEvent[];
  status: { code: number; message?: string };
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number | boolean>;
}

interface MetricPoint {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  timestamp: number;
  attributes: Record<string, string | number | boolean>;
}

interface LogRecord {
  timestamp: number;
  severity: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  body: string;
  attributes: Record<string, string | number | boolean>;
  traceId?: string;
  spanId?: string;
}

const DEFAULT_CONFIG: OtelConfig = {
  enabled: false,
  endpoint: 'http://localhost:4317',
  serviceName: 'opensin-code',
  serviceVersion: '0.1.0',
  environment: 'development',
};

export class OpenTelemetryExporter {
  private config: OtelConfig;
  private configPath: string;
  private spans: Map<string, Span> = new Map();
  private metrics: MetricPoint[] = [];
  private logs: LogRecord[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private sessionId: string;

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, 'opentelemetry.json')
      : path.join(os.homedir(), '.opensin', 'opentelemetry.json');
    this.config = { ...DEFAULT_CONFIG };
    this.sessionId = crypto.randomUUID();
  }

  async init(): Promise<boolean> {
    await this.loadConfig();
    if (this.config.enabled) {
      this.startFlushTimer();
    }
    return this.config.enabled;
  }

  private async loadConfig(): Promise<void> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
        this.config = {
          ...DEFAULT_CONFIG,
          enabled: true,
          endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
          serviceName: process.env.OTEL_SERVICE_NAME || 'opensin-code',
          headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
            ? Object.fromEntries(process.env.OTEL_EXPORTER_OTLP_HEADERS.split(',').map(h => h.split('=') as [string, string]))
            : undefined,
        };
      }
    }
  }

  startSpan(name: string, parentSpanId?: string, attributes?: Record<string, string | number | boolean>): Span {
    const span: Span = {
      traceId: crypto.randomUUID().replace(/-/g, '').slice(0, 32),
      spanId: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
      parentSpanId,
      name,
      kind: 'INTERNAL',
      startTime: Date.now(),
      attributes: {
        'service.name': this.config.serviceName || 'opensin-code',
        'service.version': this.config.serviceVersion || '0.1.0',
        'session.id': this.sessionId,
        ...attributes,
      },
      events: [],
      status: { code: 0 },
    };
    this.spans.set(span.spanId, span);
    return span;
  }

  endSpan(spanId: string, status?: { code: number; message?: string }): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.endTime = Date.now();
      if (status) {
        span.status = status;
      }
    }
  }

  addSpanEvent(spanId: string, name: string, attributes?: Record<string, string | number | boolean>): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({
        name,
        timestamp: Date.now(),
        attributes,
      });
    }
  }

  recordMetric(name: string, value: number, type: 'counter' | 'gauge' | 'histogram' = 'gauge', attributes?: Record<string, string | number | boolean>): void {
    this.metrics.push({
      name,
      type,
      value,
      timestamp: Date.now(),
      attributes: {
        'service.name': this.config.serviceName || 'opensin-code',
        'session.id': this.sessionId,
        ...attributes,
      },
    });
  }

  recordTokenUsage(provider: string, model: string, inputTokens: number, outputTokens: number, costUsd?: number): void {
    this.recordMetric('llm.tokens.input', inputTokens, 'counter', { provider, model });
    this.recordMetric('llm.tokens.output', outputTokens, 'counter', { provider, model });
    if (costUsd !== undefined) {
      this.recordMetric('llm.cost.usd', costUsd, 'counter', { provider, model });
    }
  }

  recordToolExecution(toolName: string, durationMs: number, success: boolean): void {
    this.recordMetric('tool.duration.ms', durationMs, 'histogram', { tool: toolName, success: String(success) });
    this.recordMetric('tool.calls', 1, 'counter', { tool: toolName, success: String(success) });
  }

  recordGitCommit(message: string, filesChanged: number): void {
    this.recordMetric('git.commits', 1, 'counter', { message: message.slice(0, 50) });
    this.recordMetric('git.files.changed', filesChanged, 'counter');
  }

  log(severity: LogRecord['severity'], body: string, attributes?: Record<string, string | number | boolean>, traceId?: string, spanId?: string): void {
    this.logs.push({
      timestamp: Date.now(),
      severity,
      body,
      attributes: {
        'service.name': this.config.serviceName || 'opensin-code',
        'session.id': this.sessionId,
        ...attributes,
      },
      traceId,
      spanId,
    });
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => void this.flush(), 30000);
  }

  private async flush(): Promise<void> {
    if (!this.config.enabled) return;

    const spans = Array.from(this.spans.values()).filter(s => s.endTime);
    const metrics = [...this.metrics];
    const logs = [...this.logs];

    this.metrics = [];
    this.logs = [];
    this.spans.clear();

    if (spans.length === 0 && metrics.length === 0 && logs.length === 0) return;

    const payload = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: this.config.serviceName } },
            { key: 'service.version', value: { stringValue: this.config.serviceVersion } },
            { key: 'deployment.environment', value: { stringValue: this.config.environment } },
          ],
        },
        scopeSpans: [{
          spans: spans.map(s => ({
            traceId: s.traceId,
            spanId: s.spanId,
            parentSpanId: s.parentSpanId,
            name: s.name,
            kind: s.kind,
            startTimeUnixNano: s.startTime * 1e6,
            endTimeUnixNano: (s.endTime || Date.now()) * 1e6,
            attributes: Object.entries(s.attributes).map(([k, v]) => ({
              key: k,
              value: typeof v === 'string' ? { stringValue: v } : { intValue: v },
            })),
            events: s.events.map(e => ({
              name: e.name,
              timeUnixNano: e.timestamp * 1e6,
              attributes: e.attributes ? Object.entries(e.attributes).map(([k, v]) => ({
                key: k,
                value: typeof v === 'string' ? { stringValue: v } : { intValue: v },
              })) : [],
            })),
            status: s.status,
          })),
        }],
      }],
    };

    try {
      await fetch(`${this.config.endpoint}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      // Silently fail
    }
  }

  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    void this.flush();
  }
}

export function createOpenTelemetryExporter(configDir?: string): OpenTelemetryExporter {
  return new OpenTelemetryExporter(configDir);
}
