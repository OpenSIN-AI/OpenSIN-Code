import { definePlugin, createTool } from '@opensin/plugin-sdk';

interface UsageStats {
  sessionTokens: number;
  totalTokens: number;
  sessionCost: number;
  totalCost: number;
  toolCalls: number;
  startTime: Date;
  model: string;
}

export default definePlugin({
  name: '@opensin/plugin-quota-tracker',
  version: '0.1.0',
  type: 'tool',
  description: 'Track quota and token usage across providers',

  async activate(ctx) {
    const toastEnabled = ctx.getConfig('toastEnabled', true);
    const thresholdPercent = ctx.getConfig('thresholdPercent', 80);
    const maxTokens = ctx.getConfig('maxTokens', 200000);

    const stats: UsageStats = {
      sessionTokens: 0,
      totalTokens: 0,
      sessionCost: 0,
      totalCost: 0,
      toolCalls: 0,
      startTime: new Date(),
      model: ctx.session.model || 'unknown',
    };

    // Track tool usage
    ctx.events.on('tool:execute:after', async (data: any) => {
      const { tokens, cost } = data || {};
      if (tokens) {
        stats.sessionTokens += tokens;
        stats.totalTokens += tokens;
        stats.toolCalls++;
      }
      if (cost) {
        stats.sessionCost += cost;
        stats.totalCost += cost;
      }

      // Toast notification on threshold
      if (toastEnabled && stats.sessionTokens > maxTokens * (thresholdPercent / 100)) {
        const usage = ((stats.sessionTokens / maxTokens) * 100).toFixed(1);
        ctx.logger.warn(`[quota] Token usage at ${usage}% (${stats.sessionTokens.toLocaleString()}/${maxTokens.toLocaleString()})`);
      }
    });

    // Tool: quota status
    ctx.tools.register(createTool({
      name: 'quota_status',
      description: 'Show current quota and token usage',
      parameters: {},
      execute: async () => {
        const usage = ((stats.sessionTokens / maxTokens) * 100).toFixed(1);
        const duration = Math.round((Date.now() - stats.startTime.getTime()) / 1000);
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;

        return {
          content: `Quota Status:
  Session Tokens: ${stats.sessionTokens.toLocaleString()} / ${maxTokens.toLocaleString()} (${usage}%)
  Total Tokens: ${stats.totalTokens.toLocaleString()}
  Tool Calls: ${stats.toolCalls}
  Session Cost: $${stats.sessionCost.toFixed(4)}
  Total Cost: $${stats.totalCost.toFixed(4)}
  Model: ${stats.model}
  Session Duration: ${mins}m ${secs}s`
        };
      }
    }));

    // Tool: token usage
    ctx.tools.register(createTool({
      name: 'token_usage',
      description: 'Show detailed token usage breakdown',
      parameters: {},
      execute: async () => {
        return {
          content: `Token Usage:
  Session: ${stats.sessionTokens.toLocaleString()} tokens
  Total: ${stats.totalTokens.toLocaleString()} tokens
  Average per call: ${stats.toolCalls > 0 ? Math.round(stats.sessionTokens / stats.toolCalls).toLocaleString() : 0} tokens
  Tool calls: ${stats.toolCalls}`
        };
      }
    }));

    ctx.logger.info('Quota tracker plugin activated');
  },
});
