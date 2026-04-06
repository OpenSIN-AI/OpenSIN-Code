import { definePlugin } from '@opensin/plugin-sdk';

export default definePlugin({
  name: '@opensin/plugin-context-pruner',
  version: '0.1.0',
  type: 'hook',
  description: 'Dynamic context pruning for token optimization',

  async activate(ctx) {
    const maxTokens = ctx.getConfig('maxTokens', 100000);
    const pruneThreshold = ctx.getConfig('pruneThreshold', 0.8);
    let currentTokens = 0;

    ctx.events.on('context:update', async (data: any) => {
      const { messages, tokenCount } = data || {};
      if (!messages) return;

      currentTokens = tokenCount || currentTokens;

      if (currentTokens > maxTokens * pruneThreshold) {
        const toPrune = Math.floor(messages.length * 0.3);
        ctx.logger.info(`[context-pruner] Context at ${currentTokens}/${maxTokens} tokens. Pruning ${toPrune} oldest messages.`);
      }
    });

    ctx.events.on('tool:execute:after', async (data: any) => {
      const { duration, tokens } = data || {};
      if (tokens) {
        currentTokens += tokens;
      }
    });

    ctx.tools.register({
      name: 'context_status',
      description: 'Show current context token usage',
      parameters: {},
      execute: async () => {
        const usage = ((currentTokens / maxTokens) * 100).toFixed(1);
        return { content: `Context: ${currentTokens.toLocaleString()} / ${maxTokens.toLocaleString()} tokens (${usage}%)` };
      }
    } as any);

    ctx.logger.info('Context pruner plugin activated');
  },
});
