import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

interface BackgroundAgent {
  id: string;
  task: string;
  agentType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  pid?: number;
  result?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

class AgentManager {
  private storePath: string;
  private agents = new Map<string, BackgroundAgent>();

  constructor() {
    this.storePath = path.join(os.homedir(), '.opensin', 'background-agents.json');
  }

  private async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.storePath, 'utf-8');
      const parsed = JSON.parse(data);
      for (const agent of parsed) {
        this.agents.set(agent.id, { ...agent, createdAt: new Date(agent.createdAt), completedAt: agent.completedAt ? new Date(agent.completedAt) : undefined });
      }
    } catch { /* no store yet */ }
  }

  private async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    await fs.writeFile(this.storePath, JSON.stringify(Array.from(this.agents.values()), null, 2));
  }

  async spawn(task: string, agentType = 'coder'): Promise<string> {
    await this.load();
    const id = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const agent: BackgroundAgent = {
      id, task, agentType, status: 'pending',
      createdAt: new Date(),
    };
    this.agents.set(id, agent);
    await this.save();
    return id;
  }

  async getStatus(id: string): Promise<BackgroundAgent | null> {
    await this.load();
    return this.agents.get(id) || null;
  }

  async getResult(id: string): Promise<string | null> {
    await this.load();
    const agent = this.agents.get(id);
    if (!agent) return null;
    if (agent.status === 'completed') return agent.result || null;
    if (agent.status === 'failed') return `Error: ${agent.error}`;
    return `Agent is still ${agent.status}`;
  }

  async listAll(): Promise<BackgroundAgent[]> {
    await this.load();
    return Array.from(this.agents.values());
  }

  async cancel(id: string): Promise<boolean> {
    await this.load();
    const agent = this.agents.get(id);
    if (!agent || agent.status === 'completed') return false;
    agent.status = 'cancelled';
    agent.completedAt = new Date();
    await this.save();
    return true;
  }
}

export default definePlugin({
  name: '@opensin/plugin-background-agents',
  version: '0.1.0',
  type: 'agent',
  description: 'Async background agent delegation with context persistence',

  async activate(ctx) {
    const manager = new AgentManager();

    ctx.tools.register(createTool({
      name: 'background_agent_spawn',
      description: 'Spawn a background agent with a task',
      parameters: {
        task: ParamTypes.string({ required: true, description: 'Task description' }),
        agentType: ParamTypes.string({ description: 'Agent type (coder, reviewer, tester)', default: 'coder' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const task = params.task as string;
        const agentType = (params.agentType as string) || 'coder';
        const id = await manager.spawn(task, agentType);
        return { content: `Background agent spawned: ${id}\nTask: ${task}\nType: ${agentType}` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'background_agent_status',
      description: 'Check status of a background agent',
      parameters: {
        agentId: ParamTypes.string({ required: true, description: 'Agent ID' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const agentId = params.agentId as string;
        const agent = await manager.getStatus(agentId);
        if (!agent) return { content: `Agent ${agentId} not found.` };
        return { content: `Agent: ${agent.id}\nStatus: ${agent.status}\nTask: ${agent.task}\nType: ${agent.agentType}\nCreated: ${agent.createdAt.toISOString()}` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'background_agent_result',
      description: 'Get result from a background agent',
      parameters: {
        agentId: ParamTypes.string({ required: true, description: 'Agent ID' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const agentId = params.agentId as string;
        const result = await manager.getResult(agentId);
        return { content: result || `No result for agent ${agentId}` };
      }
    }));

    ctx.tools.register(createTool({
      name: 'background_agent_list',
      description: 'List all background agents',
      parameters: {},
      execute: async () => {
        const agents = await manager.listAll();
        if (agents.length === 0) return { content: 'No background agents.' };
        return { content: agents.map(a => `${a.id}: ${a.status} - ${a.task}`).join('\n') };
      }
    }));

    ctx.tools.register(createTool({
      name: 'background_agent_cancel',
      description: 'Cancel a running background agent',
      parameters: {
        agentId: ParamTypes.string({ required: true, description: 'Agent ID' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const agentId = params.agentId as string;
        const cancelled = await manager.cancel(agentId);
        return { content: cancelled ? `Agent ${agentId} cancelled.` : `Cannot cancel agent ${agentId}.` };
      }
    }));

    ctx.logger.info('Background agents plugin activated');
  },
});
