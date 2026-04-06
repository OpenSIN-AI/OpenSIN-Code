import { definePlugin } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

function simpleMatch(filePath: string, pattern: string): boolean {
  // Simple glob pattern matching
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
    return regex.test(filePath) || regex.test(path.basename(filePath));
  }
  return filePath === pattern || filePath.endsWith('/' + pattern) || path.basename(filePath) === pattern;
}

export default definePlugin({
  name: '@opensin/plugin-ignore-patterns',
  version: '0.1.0',
  type: 'tool',
  description: 'File/directory ignore patterns (.sinignore support)',

  async activate(ctx) {
    const patterns: string[] = [];
    const projectDir = ctx.getConfig('projectDir', process.cwd());

    // Load .sinignore
    try {
      const content = await fs.readFile(path.join(projectDir, '.sinignore'), 'utf-8');
      patterns.push(...content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));
    } catch { /* no file */ }

    // Load .gitignore if configured
    if (ctx.getConfig('respectGitignore', true)) {
      try {
        const content = await fs.readFile(path.join(projectDir, '.gitignore'), 'utf-8');
        patterns.push(...content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')));
      } catch { /* no file */ }
    }

    // Default patterns
    const defaults = ['node_modules', '.git', '.env', '.env.*', '*.lock', 'dist', 'build', '.next', '.cache'];
    for (const p of defaults) {
      if (!patterns.includes(p)) patterns.push(p);
    }

    ctx.events.on('tool:execute:before', async (data: any) => {
      const { tool, args } = data || {};
      if (!args) return;

      const filePath = args.path || args.file || args.pattern;
      if (!filePath) return;

      for (const pattern of patterns) {
        if (simpleMatch(filePath, pattern)) {
          data.preventDefault?.();
          ctx.logger.debug(`[ignore] Blocked: ${filePath} (matched: ${pattern})`);
          break;
        }
      }
    });

    ctx.logger.info(`Ignore patterns plugin activated (${patterns.length} patterns)`);
  },
});
