import { definePlugin } from '@opensin/plugin-sdk';

const SNIPPABLE_COMMANDS = new Set([
  'git', 'ls', 'find', 'grep', 'npm', 'yarn', 'pnpm',
  'cargo', 'go', 'python', 'node', 'docker', 'kubectl',
  'terraform', 'ansible', 'make', 'cmake',
]);

function snipOutput(output: string, maxLines = 50): string {
  const lines = output.split('\n');
  if (lines.length <= maxLines) return output;

  const header = lines.slice(0, Math.floor(maxLines / 2));
  const footer = lines.slice(-Math.floor(maxLines / 2));
  const skipped = lines.length - maxLines;

  return [...header, `\n... [${skipped} lines truncated] ...\n`, ...footer].join('\n');
}

export default definePlugin({
  name: '@opensin/plugin-snip',
  version: '0.1.0',
  type: 'hook',
  description: 'Shell output compression — reduce LLM token consumption by 60-90%',

  async activate(ctx) {
    const maxLines = ctx.getConfig('maxOutputLines', 50);
    const enabledCommands = ctx.getConfig<string[]>('enabledCommands', Array.from(SNIPPABLE_COMMANDS));
    let totalLinesSaved = 0;

    ctx.events.on('tool:execute:after', async (data: any) => {
      const { tool, args, output } = data || {};
      if (tool !== 'bash' || !args?.command || !output) return;

      const command = args.command.trim().split(/\s+/)[0];
      if (!enabledCommands.includes(command)) return;

      const lines = output.split('\n');
      if (lines.length > maxLines) {
        const snipped = snipOutput(output, maxLines);
        const saved = lines.length - maxLines;
        totalLinesSaved += saved;

        data.output = snipped;
        ctx.logger.debug(`[snip] Compressed ${command} output: ${lines.length} → ${maxLines} lines (saved ${saved} lines, total: ${totalLinesSaved})`);
      }
    });

    ctx.tools.register({
      name: 'snip_status',
      description: 'Show snip compression stats',
      parameters: {},
      execute: async () => {
        return { content: `Snip Stats:\n  Total lines saved: ${totalLinesSaved.toLocaleString()}\n  Max lines per output: ${maxLines}\n  Enabled commands: ${enabledCommands.join(', ')}` };
      }
    } as any);

    ctx.logger.info(`Snip plugin activated (max ${maxLines} lines, ${enabledCommands.length} commands)`);
  },
});
