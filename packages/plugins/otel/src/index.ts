import { definePlugin } from '@opensin/plugin-sdk';

export default definePlugin({
  name: '@opensin/plugin-otel',
  version: '0.1.0',
  type: 'hook',
  description: 'OpenTelemetry telemetry exporter for SIN Code CLI sessions',

  async activate(ctx) {
    const endpoint = ctx.getConfig<string>('endpoint', 'http://localhost:4318');
    const serviceName = ctx.getConfig<string>('serviceName', 'sin-code-cli');
    const enabled = ctx.getConfig('enabled', false);

    if (!enabled) {
      ctx.logger.info('OTel plugin disabled by config (set enabled: true to activate)');
      return;
    }

    const sessionStart = Date.now();
    let toolCalls = 0;
    let totalTokens = 0;

    // Session lifecycle
    ctx.events.on('session:start', async () => {
      ctx.logger.info(`[otel] Session started — exporting to ${endpoint}`);
      // Would export session start span here
    });

    ctx.events.on('session:end', async () => {
      const duration = Date.now() - sessionStart;
      ctx.logger.info(`[otel] Session ended — duration: ${duration}ms, tools: ${toolCalls}, tokens: ${totalTokens}`);
      // Would export session end span here
    });

    // Tool execution tracking
    ctx.events.on('tool:execute:before', async (data: any) => {
      const { tool, args } = data || {};
      if (tool) {
        toolCalls++;
        // Would start tool span here
      }
    });

    ctx.events.on('tool:execute:after', async (data: any) => {
      const { tokens, duration } = data || {};
      if (tokens) totalTokens += tokens;
      // Would end tool span here
    });

    ctx.tools.register({
      name: 'otel_status',
      description: 'Show OpenTelemetry exporter status',
      parameters: {},
      execute: async () => {
        return {
          content: `OTel Status:
  Endpoint: ${endpoint}
  Service: ${serviceName}
  Enabled: ${enabled}
  Session Duration: ${Date.now() - sessionStart}ms
  Tool Calls: ${toolCalls}
  Total Tokens: ${totalTokens.toLocaleString()}`
        };
      }
    } as any);

    ctx.logger.info('OTel plugin activated (telemetry exporter)');
  },
});
