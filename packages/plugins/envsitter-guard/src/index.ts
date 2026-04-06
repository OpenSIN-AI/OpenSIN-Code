import { definePlugin } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as crypto from 'node:crypto';

const ENV_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /^\.env\..*$/,
];

function isEnvFile(filePath: string): boolean {
  const basename = filePath.split('/').pop() || '';
  return ENV_PATTERNS.some(p => p.test(basename));
}

function fingerprint(content: string): string {
  const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const keys = lines.map(l => l.split('=')[0]?.trim()).filter(Boolean);
  return `sha256:${hash} keys:${keys.length} [${keys.join(', ')}]`;
}

export default definePlugin({
  name: '@opensin/plugin-envsitter-guard',
  version: '0.1.0',
  type: 'hook',
  description: '.env leak prevention with fingerprint-only inspection',

  async activate(ctx) {
    ctx.events.on('tool:execute:before', async (data: any) => {
      const { tool, args } = data || {};
      if (!args) return;

      const filePath = args.path || args.file || args.filename;
      if (!filePath || !isEnvFile(filePath)) return;

      if (tool === 'read' || tool === 'write' || tool === 'edit') {
        data.preventDefault?.();
        ctx.logger.warn(`[envsitter] Blocked ${tool} access to: ${filePath}`);

        const fp = fingerprint(await fs.readFile(filePath, 'utf-8').catch(() => ''));
        ctx.logger.info(`[envsitter] Fingerprint for ${filePath}: ${fp}`);
      }
    });

    ctx.tools.register({
      name: 'envsitter_fingerprint',
      description: 'Get fingerprint of an env file (keys only, no values)',
      parameters: {
        path: { type: 'string', required: true, description: 'Path to env file' },
      },
      execute: async ({ path: filePath }: { path: string }) => {
        if (!isEnvFile(filePath)) {
          return { content: `${filePath} is not an env file.` };
        }
        const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
        return { content: `Fingerprint: ${fingerprint(content)}` };
      }
    } as any);

    ctx.logger.info('Envsitter guard plugin activated');
  },
});
