import * as vscode from 'vscode';

export interface SwarmAgent {
  name: string;
  status: 'idle' | 'working' | 'error';
  currentTask?: string;
  tasksCompleted: number;
}

export interface Swarm {
  id: string;
  name: string;
  agents: string[];
  status: 'active' | 'paused' | 'completed' | 'error';
  createdAt: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksFailed: number;
}

export class SwarmCoordinator {
  private swarms: Map<string, Swarm>;
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.swarms = new Map();
    this.outputChannel = outputChannel;
  }

  async createSwarm(name: string, agents: string[]): Promise<Swarm | undefined> {
    try {
      const swarm: Swarm = {
        id: `swarm-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        name,
        agents,
        status: 'active',
        createdAt: Date.now(),
        tasksTotal: 0,
        tasksCompleted: 0,
        tasksFailed: 0
      };

      this.swarms.set(swarm.id, swarm);
      this.outputChannel.appendLine(`[${new Date().toISOString()}] SWARM CREATED: ${swarm.id} "${name}" [${agents.join(', ')}]`);
      return swarm;
    } catch (err) {
      vscode.window.showErrorMessage(`OpenSIN: Failed to create swarm — ${err}`);
      return undefined;
    }
  }

  async dispatchToSwarm(swarmId: string, taskDescription: string, agentIndex?: number): Promise<boolean> {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) {
      vscode.window.showErrorMessage(`OpenSIN: Swarm "${swarmId}" not found`);
      return false;
    }

    if (swarm.status !== 'active') {
      vscode.window.showWarningMessage(`OpenSIN: Swarm "${swarm.name}" is ${swarm.status}`);
      return false;
    }

    const targetAgent = agentIndex !== undefined
      ? swarm.agents[agentIndex]
      : swarm.agents[Math.floor(Math.random() * swarm.agents.length)];

    swarm.tasksTotal++;
    this.outputChannel.appendLine(`[${new Date().toISOString()}] SWARM DISPATCH ${swarmId} → ${targetAgent}: "${taskDescription}"`);
    return true;
  }

  async pauseSwarm(swarmId: string): Promise<boolean> {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return false;

    swarm.status = 'paused';
    this.outputChannel.appendLine(`[${new Date().toISOString()}] SWARM PAUSED: ${swarmId}`);
    return true;
  }

  async resumeSwarm(swarmId: string): Promise<boolean> {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return false;

    swarm.status = 'active';
    this.outputChannel.appendLine(`[${new Date().toISOString()}] SWARM RESUMED: ${swarmId}`);
    return true;
  }

  async completeSwarmTask(swarmId: string, success: boolean): Promise<void> {
    const swarm = this.swarms.get(swarmId);
    if (!swarm) return;

    if (success) {
      swarm.tasksCompleted++;
    } else {
      swarm.tasksFailed++;
    }

    if (swarm.tasksCompleted + swarm.tasksFailed >= swarm.tasksTotal && swarm.tasksTotal > 0) {
      swarm.status = 'completed';
      this.outputChannel.appendLine(`[${new Date().toISOString()}] SWARM COMPLETED: ${swarmId} (${swarm.tasksCompleted}/${swarm.tasksTotal} success)`);
    }
  }

  async deleteSwarm(swarmId: string): Promise<boolean> {
    const deleted = this.swarms.delete(swarmId);
    if (deleted) {
      this.outputChannel.appendLine(`[${new Date().toISOString()}] SWARM DELETED: ${swarmId}`);
    }
    return deleted;
  }

  getSwarm(swarmId: string): Swarm | undefined {
    return this.swarms.get(swarmId);
  }

  getAllSwarms(): Swarm[] {
    return Array.from(this.swarms.values());
  }

  getSwarmCount(): number {
    return this.swarms.size;
  }

  getActiveSwarms(): Swarm[] {
    return Array.from(this.swarms.values()).filter(s => s.status === 'active');
  }
}
