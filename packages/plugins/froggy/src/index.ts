import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

interface SpecializedAgent {
  name: string;
  description: string;
  systemPrompt: string;
  tools: string[];
}

const SPECIALIZED_AGENTS: SpecializedAgent[] = [
  {
    name: 'reviewer',
    description: 'Code review specialist',
    systemPrompt: 'You are a senior code reviewer. Focus on code quality, security, performance, and best practices.',
    tools: ['read', 'grep', 'bash'],
  },
  {
    name: 'tester',
    description: 'Testing specialist',
    systemPrompt: 'You are a testing specialist. Write comprehensive tests, focus on edge cases and coverage.',
    tools: ['read', 'write', 'edit', 'bash'],
  },
  {
    name: 'architect',
    description: 'System architecture specialist',
    systemPrompt: 'You are a system architect. Focus on design patterns, scalability, and maintainability.',
    tools: ['read', 'grep', 'glob'],
  },
  {
    name: 'debugger',
    description: 'Debugging specialist',
    systemPrompt: 'You are a debugging specialist. Find and fix bugs, analyze stack traces, and trace execution flow.',
    tools: ['read', 'grep', 'bash'],
  },
];

export default definePlugin({
  name: '@opensin/plugin-froggy',
  version: '0.1.0',
  type: 'agent',
  description: 'Claude Code-style hooks, specialized agents, and gitingest tool',

  async activate(ctx) {
    // Hook: pre-commit validation
    ctx.events.on('tool:execute:before', async (data: any) => {
      const { tool, args } = data || {};
      if (tool === 'write' && args?.path?.endsWith('.ts')) {
        ctx.logger.debug('[froggy] TypeScript file being written');
      }
    });

    // Hook: post-tool linting
    ctx.events.on('tool:execute:after', async (data: any) => {
      const { tool, args } = data || {};
      if (tool === 'write' && args?.path) {
        try {
          execSync(`npx eslint --fix "${args.path}" 2>/dev/null`, { timeout: 5000 });
          ctx.logger.debug(`[froggy] Auto-linted: ${args.path}`);
        } catch {
          // Linting failed silently
        }
      }
    });

    // Tool: gitingest - create a digest of the repo
    ctx.tools.register(createTool({
      name: 'gitingest',
      description: 'Create a text digest of the repository structure and files',
      parameters: {
        path: ParamTypes.string({ description: 'Path to analyze (default: current dir)' }),
        maxFiles: ParamTypes.number({ description: 'Max files to include', default: 50 }),
      },
      execute: async (params: Record<string, unknown>) => {
        const targetPath = (params.path as string) || '.';
        const maxFiles = (params.maxFiles as number) || 50;

        try {
          const treeOutput = execSync(`find "${targetPath}" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/.next/*" | head -${maxFiles}`, { encoding: 'utf-8' });
          const files = treeOutput.trim().split('\n').filter(Boolean);

          let digest = `# Repository Digest\n\n`;
          digest += `## File Tree (${files.length} files)\n\n\`\`\`\n${treeOutput}\n\`\`\`\n\n`;

          for (const file of files.slice(0, 20)) {
            try {
              const content = await fs.readFile(file, 'utf-8');
              const ext = path.extname(file).slice(1);
              digest += `## ${file}\n\n\`\`\`${ext}\n${content.slice(0, 500)}${content.length > 500 ? '\n... (truncated)' : ''}\n\`\`\`\n\n`;
            } catch { /* skip binary files */ }
          }

          return { content: digest };
        } catch (error: any) {
          return { content: `Error: ${error.message || error}`, error: error.message };
        }
      }
    }));

    // Tool: list specialized agents
    ctx.tools.register(createTool({
      name: 'agents_list',
      description: 'List available specialized agents',
      parameters: {},
      execute: async () => {
        const list = SPECIALIZED_AGENTS.map(a => `${a.name}: ${a.description}`).join('\n');
        return { content: `Specialized Agents:\n${list}` };
      }
    }));

    // Tool: spawn specialized agent
    ctx.tools.register(createTool({
      name: 'agent_spawn',
      description: 'Spawn a specialized agent for a task',
      parameters: {
        agent: ParamTypes.string({ required: true, description: 'Agent type (reviewer, tester, architect, debugger)' }),
        task: ParamTypes.string({ required: true, description: 'Task description' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const agentName = params.agent as string;
        const task = params.task as string;
        const agent = SPECIALIZED_AGENTS.find(a => a.name === agentName);
        if (!agent) {
          return { content: `Unknown agent: ${agentName}. Available: ${SPECIALIZED_AGENTS.map(a => a.name).join(', ')}` };
        }
        return { content: `Spawning ${agent.name} agent...\nTask: ${task}\nSystem: ${agent.systemPrompt}\nTools: ${agent.tools.join(', ')}` };
      }
    }));

    ctx.logger.info('Froggy plugin activated (hooks, specialized agents, gitingest)');
  },
});
