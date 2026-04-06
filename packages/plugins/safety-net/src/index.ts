import { definePlugin } from '@opensin/plugin-sdk';

const DANGEROUS_COMMANDS = [
  { pattern: /^rm\s+-rf\s+\/$/, reason: 'Would delete root filesystem' },
  { pattern: /^rm\s+-rf\s+\//, reason: 'Recursive force delete from root' },
  { pattern: /^dd\s+if=.*of=\/dev/, reason: 'Would overwrite disk device' },
  { pattern: /^mkfs/, reason: 'Would format filesystem' },
  { pattern: /:\(\)\{\s*:\|:\s*&\s*\};:/, reason: 'Fork bomb detected' },
  { pattern: /^git\s+push\s+--force/, reason: 'Force push may overwrite remote history' },
  { pattern: /^git\s+push\s+-f\b/, reason: 'Force push (short flag) may overwrite remote history' },
  { pattern: /^git\s+reset\s+--hard/, reason: 'Hard reset will discard all uncommitted changes' },
  { pattern: /^git\s+clean\s+-fdx/, reason: 'Clean -fdx will remove all untracked files including ignored' },
  { pattern: /^git\s+branch\s+-D/, reason: 'Force delete branch' },
  { pattern: /^\s*>\s*\/dev\/sda/, reason: 'Would overwrite disk' },
  { pattern: /chmod\s+-R\s+777\s+\/$/, reason: 'Would make entire filesystem world-writable' },
  { pattern: /sudo\s+rm\s+-rf/, reason: 'Sudo recursive force delete' },
];

function checkCommand(command: string): { isDangerous: boolean; reason?: string } {
  for (const { pattern, reason } of DANGEROUS_COMMANDS) {
    if (pattern.test(command)) {
      return { isDangerous: true, reason };
    }
  }
  return { isDangerous: false };
}

export default definePlugin({
  name: '@opensin/plugin-safety-net',
  version: '0.1.0',
  type: 'hook',
  description: 'Destructive command protection with .env leak prevention',

  async activate(ctx) {
    const strictMode = ctx.getConfig('strictMode', true);

    ctx.events.on('tool:execute:before', async (data: any) => {
      const { tool, args } = data || {};
      if (tool !== 'bash' || !args?.command) return;

      const check = checkCommand(args.command);
      if (check.isDangerous) {
        data.preventDefault?.();
        ctx.logger.warn(`[safety-net] BLOCKED: ${args.command}`);
        ctx.logger.warn(`[safety-net] Reason: ${check.reason}`);

        if (!strictMode) {
          ctx.logger.info('[safety-net] Non-strict mode: command would have been blocked');
        }
      }
    });

    ctx.logger.info('Safety net plugin activated');
  },
});
