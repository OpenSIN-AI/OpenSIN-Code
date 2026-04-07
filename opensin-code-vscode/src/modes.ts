import * as vscode from 'vscode';

export type AgentMode = 'explore' | 'implement' | 'review' | 'architect' | 'debug';

export interface ModeConfig {
  name: AgentMode;
  icon: string;
  description: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

const MODE_CONFIGS: Record<AgentMode, ModeConfig> = {
  explore: {
    name: 'explore',
    icon: '$(search)',
    description: 'Explore codebase and gather context',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: 'You are an OpenSIN exploration agent. Analyze the codebase structure, identify patterns, and gather context without making changes.'
  },
  implement: {
    name: 'implement',
    icon: '$(code)',
    description: 'Write and modify code',
    temperature: 0.3,
    maxTokens: 8192,
    systemPrompt: 'You are an OpenSIN implementation agent. Write clean, well-tested code following project conventions. Make targeted, minimal changes.'
  },
  review: {
    name: 'review',
    icon: '$(eye)',
    description: 'Review code for quality and correctness',
    temperature: 0.2,
    maxTokens: 4096,
    systemPrompt: 'You are an OpenSIN review agent. Analyze code for bugs, security issues, performance problems, and style violations. Provide actionable feedback.'
  },
  architect: {
    name: 'architect',
    icon: '$(type-hierarchy)',
    description: 'Design system architecture and plan changes',
    temperature: 0.5,
    maxTokens: 8192,
    systemPrompt: 'You are an OpenSIN architect agent. Design system architecture, plan refactoring strategies, and propose structural improvements.'
  },
  debug: {
    name: 'debug',
    icon: '$(bug)',
    description: 'Diagnose and fix bugs',
    temperature: 0.1,
    maxTokens: 4096,
    systemPrompt: 'You are an OpenSIN debug agent. Systematically diagnose issues, trace execution paths, and propose precise fixes for bugs.'
  }
};

export class Modes {
  private currentMode: AgentMode;
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.currentMode = (context.workspaceState.get('opensin.mode') as AgentMode) || 'explore';

    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.statusBarItem.text = `${MODE_CONFIGS[this.currentMode].icon} ${this.currentMode}`;
    this.statusBarItem.tooltip = `OpenSIN Mode: ${this.currentMode}`;
    this.statusBarItem.command = 'opensin.mode.toggle';
    this.statusBarItem.show();
    context.subscriptions.push(this.statusBarItem);
  }

  getCurrentMode(): AgentMode {
    return this.currentMode;
  }

  async toggleMode(): Promise<AgentMode> {
    const modes: AgentMode[] = ['explore', 'implement', 'review', 'architect', 'debug'];
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.currentMode = modes[nextIndex];

    await this.context.workspaceState.update('opensin.mode', this.currentMode);

    const config = MODE_CONFIGS[this.currentMode];
    this.statusBarItem.text = `${config.icon} ${this.currentMode}`;
    this.statusBarItem.tooltip = `OpenSIN Mode: ${this.currentMode} — ${config.description}`;

    this.outputChannel.appendLine(`[${new Date().toISOString()}] MODE CHANGED: ${this.currentMode}`);
    return this.currentMode;
  }

  async setMode(mode: AgentMode): Promise<void> {
    if (!MODE_CONFIGS[mode]) {
      throw new Error(`Unknown OpenSIN mode: ${mode}`);
    }
    this.currentMode = mode;
    await this.context.workspaceState.update('opensin.mode', mode);

    const config = MODE_CONFIGS[mode];
    this.statusBarItem.text = `${config.icon} ${mode}`;
    this.statusBarItem.tooltip = `OpenSIN Mode: ${mode} — ${config.description}`;
  }

  getModeConfig(mode: AgentMode): ModeConfig {
    return MODE_CONFIGS[mode];
  }

  getAllModes(): AgentMode[] {
    return ['explore', 'implement', 'review', 'architect', 'debug'];
  }

  getAvailableModes(): { label: string; description: string; mode: AgentMode }[] {
    return this.getAllModes().map(mode => {
      const config = MODE_CONFIGS[mode];
      return {
        label: `${config.icon} ${mode}`,
        description: config.description,
        mode
      };
    });
  }
}
