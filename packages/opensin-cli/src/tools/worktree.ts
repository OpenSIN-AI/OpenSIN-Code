import { ToolDefinition } from '../core/types.js';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);

export class WorktreeTool implements ToolDefinition {
  name = 'worktree';
  description = 'Manage git worktrees for parallel development. Create, list, prune, and remove worktrees.';
  parameters = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['create', 'list', 'prune', 'remove'], description: 'Action to perform' },
      path: { type: 'string', description: 'Worktree path (for create/remove)' },
      branch: { type: 'string', description: 'Branch to create worktree on' },
    },
    required: ['action'],
  };

  async execute(input: Record<string, unknown>): Promise<{ output: string; isError?: boolean }> {
    const { action, path, branch } = input as Record<string, any>;
    try {
      switch (action) {
        case 'create': {
          if (!path || !branch) return { output: 'Error: path and branch required for create', isError: true };
          const { stdout } = await execAsync(`git worktree add "${path}" -b "${branch}" 2>&1`);
          return { output: `Created worktree at ${path} on branch ${branch}\n${stdout}` };
        }
        case 'list': {
          const { stdout } = await execAsync('git worktree list 2>&1');
          return { output: stdout };
        }
        case 'prune': {
          const { stdout } = await execAsync('git worktree prune 2>&1');
          return { output: `Pruned stale worktrees\n${stdout}` };
        }
        case 'remove': {
          if (!path) return { output: 'Error: path required for remove', isError: true };
          const { stdout } = await execAsync(`git worktree remove "${path}" 2>&1`);
          return { output: `Removed worktree at ${path}\n${stdout}` };
        }
        default:
          return { output: `Unknown action: ${action}`, isError: true };
      }
    } catch (e: any) {
      return { output: `Error: ${e.message}`, isError: true };
    }
  }
}
