import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import { execSync } from 'node:child_process';
import * as path from 'node:path';

function runGit(args: string[], cwd?: string): string {
  return execSync(`git ${args.join(' ')}`, { encoding: 'utf-8', cwd }).trim();
}

export default definePlugin({
  name: '@opensin/plugin-worktree',
  version: '0.1.0',
  type: 'command',
  description: 'Zero-friction git worktrees — auto-spawn, sync, cleanup',

  async activate(ctx) {
    const projectDir = ctx.getConfig<string>('projectDir', process.cwd());
    const worktreesDir = path.join(projectDir, '..', 'worktrees');

    ctx.tools.register(createTool({
      name: 'worktree_create',
      description: 'Create a new git worktree for a branch',
      parameters: {
        branch: ParamTypes.string({ required: true, description: 'Branch name' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const branch = params.branch as string;
        const wtPath = path.join(worktreesDir, branch);

        try {
          runGit(['worktree', 'add', '-b', branch, wtPath], projectDir);
          return { content: `Worktree created: ${wtPath}\nBranch: ${branch}` };
        } catch (error: any) {
          return { content: `Error: ${error.message || error}`, error: error.message };
        }
      }
    }));

    ctx.tools.register(createTool({
      name: 'worktree_list',
      description: 'List all git worktrees',
      parameters: {},
      execute: async () => {
        try {
          const output = runGit(['worktree', 'list', '--porcelain'], projectDir);
          if (!output) return { content: 'No worktrees found.' };
          return { content: output };
        } catch {
          return { content: 'No worktrees found.' };
        }
      }
    }));

    ctx.tools.register(createTool({
      name: 'worktree_remove',
      description: 'Remove a git worktree',
      parameters: {
        branch: ParamTypes.string({ required: true, description: 'Branch/worktree name' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const branch = params.branch as string;
        const wtPath = path.join(worktreesDir, branch);

        try {
          runGit(['worktree', 'remove', wtPath, '--force'], projectDir);
          return { content: `Worktree removed: ${branch}` };
        } catch (error: any) {
          return { content: `Error: ${error.message || error}`, error: error.message };
        }
      }
    }));

    // Hook: cleanup worktrees on session end
    ctx.events.on('session:end', async () => {
      ctx.logger.info('Worktree plugin: session ended');
    });

    ctx.logger.info('Worktree plugin activated');
  },
});
