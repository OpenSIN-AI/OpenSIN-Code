import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface OpenSINTask {
  id: string;
  bg_task_id: string;
  description: string;
  agent: string;
  mode: string;
  status: 'running' | 'completed' | 'failed';
  retries: number;
  createdAt: number;
}

export class CLIBridge {
  private tasks: Map<string, OpenSINTask>;
  private outputChannel: vscode.OutputChannel;
  private readonly maxRetries: number;

  constructor(outputChannel: vscode.OutputChannel) {
    this.tasks = new Map();
    this.outputChannel = outputChannel;
    this.maxRetries = vscode.workspace.getConfiguration('opensin').get('maxRetries', 3);
  }

  async dispatch(description: string, agent: string, mode: string): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(
        'opencode',
        ['run', '--agent', agent, '--description', description, '--background', '--mode', mode]
      );

      const bgTaskId = stdout.match(/Task ID: ([a-f0-9]+)/)?.[1];
      if (!bgTaskId) {
        vscode.window.showErrorMessage(`OpenSIN: Failed to dispatch "${description}"`);
        return undefined;
      }

      const task: OpenSINTask = {
        id: `opensin-${Date.now()}`,
        bg_task_id: bgTaskId,
        description,
        agent,
        mode,
        status: 'running',
        retries: 0,
        createdAt: Date.now()
      };

      this.tasks.set(task.id, task);
      this.outputChannel.appendLine(`[${new Date().toISOString()}] DISPATCH ${task.id} — "${description}" [${agent}/${mode}]`);
      return task.id;
    } catch (err) {
      vscode.window.showErrorMessage(`OpenSIN: Dispatch failed — ${err}`);
      return undefined;
    }
  }

  async getTaskOutput(taskId: string): Promise<string | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    try {
      const { stdout } = await execFileAsync('opencode', ['background-output', '--task-id', task.bg_task_id]);
      return stdout;
    } catch {
      return undefined;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync('opencode', ['--version']);
      this.outputChannel.appendLine(`[${new Date().toISOString()}] CLI HEALTH: opencode ${stdout.trim()}`);
      return true;
    } catch {
      this.outputChannel.appendLine(`[${new Date().toISOString()}] CLI HEALTH: FAILED`);
      return false;
    }
  }

  async checkTaskStatus(taskId: string): Promise<'running' | 'completed' | 'failed' | 'unknown'> {
    const task = this.tasks.get(taskId);
    if (!task) return 'unknown';

    try {
      const { stdout } = await execFileAsync('opencode', ['background-output', '--task-id', task.bg_task_id]);

      if (stdout.includes('Task not found') || stdout.includes('deleted')) {
        return 'failed';
      }
      if (stdout.includes('completed') || stdout.includes('done')) {
        return 'completed';
      }
      return 'running';
    } catch {
      return 'failed';
    }
  }

  async runHealthAndRetry(): Promise<void> {
    const toProcess: Array<{ id: string; task: OpenSINTask }> = [];

    for (const [id, task] of this.tasks) {
      const status = await this.checkTaskStatus(id);
      if (status === 'failed') {
        toProcess.push({ id, task });
      } else if (status === 'completed') {
        task.status = 'completed';
        this.outputChannel.appendLine(`[${new Date().toISOString()}] TASK ${id} COMPLETED`);
      }
    }

    for (const { id, task } of toProcess) {
      if (task.retries < this.maxRetries) {
        task.retries++;
        this.outputChannel.appendLine(`[${new Date().toISOString()}] RETRY ${id} — attempt ${task.retries}/${this.maxRetries}`);
        this.tasks.delete(id);
        await this.dispatch(task.description, task.agent, task.mode);
      } else {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] TASK ${id} FAILED after ${this.maxRetries} retries`);
        this.tasks.delete(id);
        vscode.window.showWarningMessage(`OpenSIN: "${task.description}" failed after ${this.maxRetries} retries`);
      }
    }
  }

  getTaskCount(): number {
    return this.tasks.size;
  }

  getRunningTasks(): OpenSINTask[] {
    return Array.from(this.tasks.values()).filter(t => t.status === 'running');
  }

  getTask(id: string): OpenSINTask | undefined {
    return this.tasks.get(id);
  }

  getAllTasks(): OpenSINTask[] {
    return Array.from(this.tasks.values());
  }
}
