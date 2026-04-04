import * as vscode from 'vscode';
import { ZeusDispatcher } from './zeusDispatcher';

export function activate(context: vscode.ExtensionContext) {
  const dispatcher = new ZeusDispatcher();

  const dispatchCommand = vscode.commands.registerCommand('zeus.dispatch', async () => {
    const description = await vscode.window.showInputBox({ prompt: 'Task description' });
    if (!description) return;
    const prompt = await vscode.window.showInputBox({ prompt: 'Task prompt' });
    if (!prompt) return;
    const agent = await vscode.window.showInputBox({ prompt: 'Agent (default: explore)', value: 'explore' });
    await dispatcher.dispatch(description, prompt, agent || 'explore');
  });

  const statusCommand = vscode.commands.registerCommand('zeus.status', () => {
    dispatcher.showStatus();
  });

  const healthCommand = vscode.commands.registerCommand('zeus.health', async () => {
    await dispatcher.healthCheck();
    vscode.window.showInformationMessage('Zeus health check complete');
  });

  context.subscriptions.push(dispatchCommand, statusCommand, healthCommand, dispatcher.getOutputChannel());
}

export function deactivate() {}
