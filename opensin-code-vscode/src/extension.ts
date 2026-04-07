import * as vscode from 'vscode';
import { SwarmCoordinator } from './swarmCoordinator';
import { MemoryConsolidation } from './memoryConsolidation';
import { BuddyGamification } from './buddyGamification';
import { CLIBridge } from './cliBridge';
import { LSPProvider } from './lspProvider';
import { Modes } from './modes';
import { CodeActions } from './codeActions';

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('OpenSIN Code');
  context.subscriptions.push(outputChannel);

  const swarmCoordinator = new SwarmCoordinator(outputChannel);
  const memoryConsolidation = new MemoryConsolidation(context, outputChannel);
  const buddyGamification = new BuddyGamification(context, outputChannel);
  const cliBridge = new CLIBridge(outputChannel);
  const lspProvider = new LSPProvider(outputChannel);
  const modes = new Modes(context, outputChannel);
  const codeActions = new CodeActions(outputChannel);

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(brain) OpenSIN';
  statusBarItem.tooltip = 'OpenSIN Code — Agentic AI Coding Assistant';
  statusBarItem.command = 'opensin.status';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  const dispatchCommand = vscode.commands.registerCommand('opensin.dispatch', async () => {
    const description = await vscode.window.showInputBox({
      prompt: 'Task description for OpenSIN agent',
      placeHolder: 'e.g., Refactor authentication module'
    });
    if (!description) return;

    const mode = modes.getCurrentMode();
    const agent = await vscode.window.showInputBox({
      prompt: 'Agent name',
      value: vscode.workspace.getConfiguration('opensin').get('defaultAgent', 'explore')
    });

    const taskId = await cliBridge.dispatch(description, agent || 'explore', mode);
    if (taskId) {
      outputChannel.appendLine(`[${new Date().toISOString()}] DISPATCH ${taskId} — ${description} (mode: ${mode})`);
      vscode.window.showInformationMessage(`OpenSIN: Dispatched "${description}" as ${taskId}`);
      statusBarItem.text = `$(brain) OpenSIN: 1`;
    }
  });

  const statusCommand = vscode.commands.registerCommand('opensin.status', async () => {
    const mode = modes.getCurrentMode();
    const buddyEnabled = buddyGamification.isEnabled();
    const swarmCount = swarmCoordinator.getSwarmCount();
    const memoryCount = memoryConsolidation.getMemoryCount();

    const message = [
      `OpenSIN Code Status`,
      ``,
      `Mode: ${mode}`,
      `Buddy: ${buddyEnabled ? 'Enabled' : 'Disabled'}`,
      `Active Swarms: ${swarmCount}`,
      `Session Memories: ${memoryCount}`,
      `LSP: ${lspProvider.isRunning() ? 'Running' : 'Stopped'}`
    ].join('\n');

    vscode.window.showInformationMessage(message, { modal: true });
  });

  const healthCommand = vscode.commands.registerCommand('opensin.health', async () => {
    outputChannel.appendLine(`[${new Date().toISOString()}] Running health check...`);

    const cliHealthy = await cliBridge.healthCheck();
    const lspHealthy = await lspProvider.healthCheck();
    const memoryHealthy = memoryConsolidation.healthCheck();

    const status = cliHealthy && lspHealthy && memoryHealthy ? 'Healthy' : 'Degraded';
    outputChannel.appendLine(`[${new Date().toISOString()}] Health check complete: ${status}`);
    vscode.window.showInformationMessage(`OpenSIN Health: ${status} (CLI: ${cliHealthy ? 'OK' : 'FAIL'}, LSP: ${lspHealthy ? 'OK' : 'FAIL'}, Memory: ${memoryHealthy ? 'OK' : 'FAIL'})`);
  });

  const swarmCreateCommand = vscode.commands.registerCommand('opensin.swarm.create', async () => {
    const name = await vscode.window.showInputBox({
      prompt: 'Swarm name',
      placeHolder: 'e.g., refactor-swarm'
    });
    if (!name) return;

    const agentCount = parseInt(await vscode.window.showInputBox({
      prompt: 'Number of agents',
      value: '3',
      validateInput: (v) => {
        const n = parseInt(v);
        return (n >= 1 && n <= 10) ? null : 'Enter a number between 1 and 10';
      }
    }) || '3');

    const agents = await vscode.window.showInputBox({
      prompt: 'Agent types (comma-separated)',
      value: 'explore,implement,review',
      placeHolder: 'e.g., explore,implement,review'
    });

    const agentList = agents ? agents.split(',').map(a => a.trim()) : Array(agentCount).fill('explore');
    const swarm = await swarmCoordinator.createSwarm(name, agentList);

    if (swarm) {
      vscode.window.showInformationMessage(`OpenSIN: Created swarm "${name}" with ${agentList.length} agents`);
      statusBarItem.text = `$(brain) OpenSIN: Swarm(${swarm.id})`;
    }
  });

  const swarmStatusCommand = vscode.commands.registerCommand('opensin.swarm.status', async () => {
    const swarms = swarmCoordinator.getAllSwarms();
    if (swarms.length === 0) {
      vscode.window.showInformationMessage('OpenSIN: No active swarms');
      return;
    }

    const items = swarms.map(s => ({
      label: `$(group-by-ref-type) ${s.name}`,
      description: `${s.agents.length} agents — ${s.status}`,
      detail: `ID: ${s.id} | Created: ${new Date(s.createdAt).toLocaleString()}`
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a swarm for details',
      title: 'OpenSIN Agent Swarms'
    });

    if (selected) {
      const swarm = swarms.find(s => s.name === selected.label.substring(2));
      if (swarm) {
        vscode.window.showInformationMessage(
          `Swarm: ${swarm.name}\nAgents: ${swarm.agents.join(', ')}\nStatus: ${swarm.status}\nTasks: ${swarm.tasksCompleted}/${swarm.tasksTotal}`,
          { modal: true }
        );
      }
    }
  });

  const memoryConsolidateCommand = vscode.commands.registerCommand('opensin.memory.consolidate', async () => {
    vscode.window.showInformationMessage('OpenSIN: Consolidating session memory...');
    const result = await memoryConsolidation.consolidate();
    if (result) {
      vscode.window.showInformationMessage(`OpenSIN: Memory consolidated — ${result.consolidatedCount} entries merged into ${result.summaryCount} summaries`);
    } else {
      vscode.window.showWarningMessage('OpenSIN: No memory entries to consolidate');
    }
  });

  const modeToggleCommand = vscode.commands.registerCommand('opensin.mode.toggle', async () => {
    const newMode = await modes.toggleMode();
    statusBarItem.text = `$(brain) OpenSIN: ${newMode}`;
    vscode.window.showInformationMessage(`OpenSIN: Mode switched to "${newMode}"`);
    outputChannel.appendLine(`[${new Date().toISOString()}] MODE TOGGLE → ${newMode}`);
  });

  const buddyToggleCommand = vscode.commands.registerCommand('opensin.buddy.toggle', async () => {
    const enabled = buddyGamification.toggle();
    vscode.window.showInformationMessage(`OpenSIN Buddy: ${enabled ? 'Enabled' : 'Disabled'}`);
    outputChannel.appendLine(`[${new Date().toISOString()}] BUDDY TOGGLE → ${enabled ? 'ON' : 'OFF'}`);

    if (enabled) {
      const level = buddyGamification.getLevel();
      const xp = buddyGamification.getXP();
      vscode.window.showInformationMessage(`OpenSIN Buddy: Level ${level} (${xp} XP) — Ready to assist!`);
    }
  });

  const cliStartCommand = vscode.commands.registerCommand('opensin.cli.start', async () => {
    const terminal = vscode.window.createTerminal({
      name: 'OpenSIN CLI',
      cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    });
    terminal.show();
    terminal.sendText('opencode');
    outputChannel.appendLine(`[${new Date().toISOString()}] CLI SESSION STARTED`);
    vscode.window.showInformationMessage('OpenSIN: CLI session started');
  });

  const lspRestartCommand = vscode.commands.registerCommand('opensin.lsp.restart', async () => {
    vscode.window.showInformationMessage('OpenSIN: Restarting LSP server...');
    await lspProvider.restart();
    vscode.window.showInformationMessage('OpenSIN: LSP server restarted');
  });

  context.subscriptions.push(
    dispatchCommand,
    statusCommand,
    healthCommand,
    swarmCreateCommand,
    swarmStatusCommand,
    memoryConsolidateCommand,
    modeToggleCommand,
    buddyToggleCommand,
    cliStartCommand,
    lspRestartCommand,
    codeActions.getProvider()
  );

  memoryConsolidation.setupAutoConsolidation();

  outputChannel.appendLine(`[${new Date().toISOString()}] OpenSIN Code extension activated`);
}

export function deactivate() {}
