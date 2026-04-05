import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenTelemetryExporter, createOpenTelemetryExporter } from '../opentelemetry/index.js';

describe('OpenTelemetryExporter', () => {
  let otel: OpenTelemetryExporter;

  beforeEach(() => {
    otel = createOpenTelemetryExporter('/tmp/test-otel');
  });

  afterEach(() => {
    otel.dispose();
  });

  it('should initialize without errors', async () => {
    await expect(otel.init()).resolves.not.toThrow();
  });

  it('should return false when not enabled', async () => {
    const enabled = await otel.init();
    expect(enabled).toBe(false);
  });

  it('should create spans', async () => {
    await otel.init();
    const span = otel.startSpan('test-operation');
    expect(span.name).toBe('test-operation');
    expect(span.startTime).toBeGreaterThan(0);
    expect(span.attributes['session.id']).toBeDefined();
  });

  it('should end spans', async () => {
    await otel.init();
    const span = otel.startSpan('test-operation');
    otel.endSpan(span.spanId, { code: 0 });
    expect(span.endTime).toBeGreaterThan(0);
    expect(span.status.code).toBe(0);
  });

  it('should add span events', async () => {
    await otel.init();
    const span = otel.startSpan('test-operation');
    otel.addSpanEvent(span.spanId, 'step-1', { detail: 'value' });
    expect(span.events.length).toBe(1);
    expect(span.events[0].name).toBe('step-1');
  });

  it('should record metrics', async () => {
    await otel.init();
    otel.recordMetric('test.counter', 42, 'counter');
    otel.recordMetric('test.gauge', 3.14, 'gauge');
    otel.recordMetric('test.histogram', 100, 'histogram');
  });

  it('should record token usage', async () => {
    await otel.init();
    otel.recordTokenUsage('openai', 'gpt-4o', 1200, 800, 0.045);
  });

  it('should record tool execution', async () => {
    await otel.init();
    otel.recordToolExecution('write', 250, true);
    otel.recordToolExecution('bash', 1500, false);
  });

  it('should record git commits', async () => {
    await otel.init();
    otel.recordGitCommit('feat: add tests', 5);
  });

  it('should record logs', async () => {
    await otel.init();
    otel.log('INFO', 'Test log message', { key: 'value' });
    otel.log('ERROR', 'Error occurred', { error: 'test' });
  });

  it('should handle dispose gracefully', async () => {
    await otel.init();
    expect(() => otel.dispose()).not.toThrow();
  });
});

describe('OpenTelemetryExporter with env vars', () => {
  it('should detect OTEL_EXPORTER_OTLP_ENDPOINT from environment', async () => {
    const originalEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = 'http://localhost:4317';
    process.env.OTEL_SERVICE_NAME = 'test-service';

    const otel = createOpenTelemetryExporter('/tmp/test-otel-env');
    const enabled = await otel.init();
    expect(enabled).toBe(true);

    process.env.OTEL_EXPORTER_OTLP_ENDPOINT = originalEndpoint;
    delete process.env.OTEL_SERVICE_NAME;
  });
});
