import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface ZeusTask {
  id: string;
  bg_task_id: string;
  description: string;
  agent: string;
  status: string;
  retries: number;
}

export class ZeusDispatcher {
  private statusBarItem: vscode.StatusBarItem;
  private tasks: Map<string, ZeusTask>;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.tasks = new Map();
    this.outputChannel = vscode.window.createOutputChannel('Zeus Dispatcher');
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.command = 'zeus.status';
    this.statusBarItem.text = '$(pulse) Zeus: 0';
    this.statusBarItem.tooltip = 'Zeus Dispatcher — 0 active tasks';
    this.statusBarItem.show();
  }

  async dispatch(description: string, prompt: string, agent = 'explore'): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(
        'opencode',
        ['run', '--agent', agent, '--description', description, '--background', '--prompt', prompt]
      );
      const bgTaskId = stdout.match(/Task ID: ([a-f0-9]+)/)?.[1];
      if (!bgTaskId) {
        vscode.window.showErrorMessage(`Zeus: Failed to dispatch "${description}"`);
        return;
      }
      const task: ZeusTask = { id: `zeus-${Date.now()}`, bg_task_id: bgTaskId, description, agent, status: 'running', retries: 0 };
      this.tasks.set(task.id, task);
      this.updateStatusBar();
      this.outputChannel.appendLine(`[${new Date().toISOString()}] DISPATCH ${task.id} — ${description}`);
      vscode.window.showInformationMessage(`Zeus: Dispatched "${description}"`);
      return task.id;
    } catch (err) {
      vscode.window.showErrorMessage(`Zeus: Dispatch failed — ${err}`);
    }
  }

  async healthCheck() {
    const toRemove: string[] = [];
    for (const [id, task] of this.tasks) {
      try {
        const { stdout } = await execFileAsync('opencode', ['background-output', '--task-id', task.bg_task_id]);
        if (stdout.includes('Task not found') || stdout.includes('deleted')) {
          toRemove.push(id);
        }
      } catch {
        toRemove.push(id);
      }
    }
    for (const id of toRemove) {
      const task = this.tasks.get(id)!;
      if (task.retries < 3) {
        task.retries++;
        this.outputChannel.appendLine(`[${new Date().toISOString()}] RETRY ${id} — attempt ${task.retries}/3`);
        this.tasks.delete(id);
        await this.dispatch(task.description, '', task.agent);
      } else {
        this.outputChannel.appendLine(`[${new Date().toISOString()}] FAILED ${id}`);
        this.tasks.delete(id);
        vscode.window.showWarningMessage(`Zeus: "${task.description}" failed after 3 retries`);
      }
    }
    this.updateStatusBar();
  }

  private updateStatusBar() {
    this.statusBarItem.text = `$(pulse) Zeus: ${this.tasks.size}`;
    this.statusBarItem.tooltip = `Zeus Dispatcher — ${this.tasks.size} active tasks`;
  }

  showStatus() {
    const items = Array.from(this.tasks.values()).map(t =>
      `${t.status === 'running' ? '🟢' : '🔴'} ${t.description} (${t.agent}, retries: ${t.retries})`
    ).join('\n');
    vscode.window.showInformationMessage(`Zeus Dispatcher\n\nActive: ${this.tasks.size}\n\n${items || 'No active tasks'}`, { modal: true });
  }

  getOutputChannel() { return this.outputChannel; }
}
