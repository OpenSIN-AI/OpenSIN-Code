import { isatty } from 'tty';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { cwd } from 'process';
import { type OutputFormat, type PermissionMode } from './args.js';
import { LineEditor, ReadOutcome } from './input.js';
import { TerminalRenderer, Spinner, type ColorTheme } from './render.js';

export interface SessionConfig {
  model: string;
  permissionMode: PermissionMode;
  config?: string;
  outputFormat: OutputFormat;
}

export interface SessionState {
  turns: number;
  compactedMessages: number;
  lastModel: string;
  lastUsage: UsageSummary;
}

export interface UsageSummary {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

export enum CommandResult {
  Continue,
}

export type SlashCommand =
  | { type: 'Help' }
  | { type: 'Status' }
  | { type: 'Compact'; confirm: boolean }
  | { type: 'Clear'; confirm: boolean }
  | { type: 'Model'; model?: string }
  | { type: 'Permissions'; mode?: string }
  | { type: 'Cost' }
  | { type: 'Config'; section?: string }
  | { type: 'Memory' }
  | { type: 'Init' }
  | { type: 'Diff' }
  | { type: 'Version' }
  | { type: 'Export'; path?: string }
  | { type: 'Agents'; args?: string }
  | { type: 'Skills'; args?: string }
  | { type: 'Session'; action?: string; target?: string }
  | { type: 'Plugins'; action?: string; target?: string }
  | { type: 'Branch'; name?: string }
  | { type: 'Worktree'; name?: string }
  | { type: 'Commit' }
  | { type: 'Pr'; context?: string }
  | { type: 'Issue'; context?: string }
  | { type: 'Ultraplan'; task?: string }
  | { type: 'Teleport'; target?: string }
  | { type: 'DebugToolCall' }
  | { type: 'Resume'; sessionPath?: string }
  | { type: 'Bughunter'; scope?: string }
  | { type: 'Unknown'; name: string };

export function parseSlashCommand(input: string): SlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1).join(' ');

  switch (command) {
    case 'help': return { type: 'Help' };
    case 'status': return { type: 'Status' };
    case 'compact': return { type: 'Compact', confirm: args.includes('--confirm') };
    case 'clear': return { type: 'Clear', confirm: args.includes('--confirm') };
    case 'model': return { type: 'Model', model: args || undefined };
    case 'permissions': return { type: 'Permissions', mode: args || undefined };
    case 'cost': return { type: 'Cost' };
    case 'config': return { type: 'Config', section: args || undefined };
    case 'memory': return { type: 'Memory' };
    case 'init': return { type: 'Init' };
    case 'diff': return { type: 'Diff' };
    case 'version': return { type: 'Version' };
    case 'export': return { type: 'Export', path: args || undefined };
    case 'agents': return { type: 'Agents', args: args || undefined };
    case 'skills': return { type: 'Skills', args: args || undefined };
    case 'session': return { type: 'Session', action: args.split(' ')[0], target: args.split(' ').slice(1).join(' ') };
    case 'plugins': return { type: 'Plugins', action: args.split(' ')[0], target: args.split(' ').slice(1).join(' ') };
    case 'branch': return { type: 'Branch', name: args || undefined };
    case 'worktree': return { type: 'Worktree', name: args || undefined };
    case 'commit': return { type: 'Commit' };
    case 'pr': return { type: 'Pr', context: args || undefined };
    case 'issue': return { type: 'Issue', context: args || undefined };
    case 'ultraplan': return { type: 'Ultraplan', task: args || undefined };
    case 'teleport': return { type: 'Teleport', target: args || undefined };
    case 'debug-tool-call': return { type: 'DebugToolCall' };
    case 'resume': return { type: 'Resume', sessionPath: args || undefined };
    case 'bughunter': return { type: 'Bughunter', scope: args || undefined };
    default: return { type: 'Unknown', name: command };
  }
}

interface SlashCommandHandler {
  command: string;
  summary: string;
}

const SLASH_COMMAND_HANDLERS: SlashCommandHandler[] = [
  { command: '/help', summary: 'Show command help' },
  { command: '/status', summary: 'Show current session status' },
  { command: '/compact', summary: 'Compact local session history' },
  { command: '/clear', summary: 'Clear session history' },
  { command: '/model', summary: 'Show or switch model' },
  { command: '/permissions', summary: 'Show or set permission mode' },
  { command: '/cost', summary: 'Show token usage' },
  { command: '/config', summary: 'Show configuration' },
  { command: '/memory', summary: 'Show memory usage' },
  { command: '/init', summary: 'Initialize SIN.md' },
  { command: '/diff', summary: 'Show changes' },
  { command: '/version', summary: 'Show version' },
  { command: '/export', summary: 'Export session' },
  { command: '/agents', summary: 'List agents' },
  { command: '/skills', summary: 'List skills' },
];

export class SessionApp {
  private config: SessionConfig;
  private renderer: TerminalRenderer;
  private state: SessionState;
  private conversationHistory: any[] = [];
  private sessionPath: string = '';

  constructor(config: SessionConfig) {
    this.config = config;
    this.renderer = new TerminalRenderer();
    this.state = {
      turns: 0,
      compactedMessages: 0,
      lastModel: config.model,
      lastUsage: {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      },
    };
    this.sessionPath = this.initSession();
  }

  private initSession(): string {
    const sessionId = Date.now().toString(36);
    const sinDir = join(cwd(), '.sin');
    const sessionsDir = join(sinDir, 'sessions');
    
    try {
      if (!existsSync(sessionsDir)) {
        mkdirSync(sessionsDir, { recursive: true });
      }
    } catch {
      // ignore
    }
    
    return join(sessionsDir, `session-${sessionId}.json`);
  }

  public startupBanner(): string {
    const color = isatty(1);
    const cwdPath = cwd();
    const workspaceName = cwdPath.split('/').pop() || 'workspace';
    
    let lines: string[] = [];
    
    if (color) {
      lines.push('\x1b[1;38;5;45m🦞 OpenSIN Code\x1b[0m \x1b[2m· ready\x1b[0m');
    } else {
      lines.push('OpenSIN Code · ready');
    }
    
    lines.push(`  Workspace        ${workspaceName}`);
    lines.push(`  Directory        ${cwdPath}`);
    lines.push(`  Model            ${this.config.model}`);
    lines.push(`  Permissions      ${this.config.permissionMode}`);
    lines.push(`  Session          ${this.sessionPath.split('/').pop()}`);
    lines.push(`  Quick start      /help · /status · ask for a task`);
    lines.push(`  Editor           Tab completes slash commands`);
    lines.push(`  Multiline        Shift+Enter or Ctrl+J inserts a newline`);
    
    return lines.join('\n');
  }

  public async runRepl(): Promise<void> {
    const editor = new LineEditor('› ', []);
    console.log('OpenSIN Code interactive mode');
    console.log('Type /help for commands. Shift+Enter or Ctrl+J inserts a newline.');

    while (true) {
      const outcome = await editor.readLine();
      
      if (outcome === ReadOutcome.Submit) {
        const input = (outcome as any).text?.trim() || '';
        if (!input) continue;
        await this.handleSubmission(input, process.stdout);
      } else if (outcome === ReadOutcome.Cancel) {
        continue;
      } else if (outcome === ReadOutcome.Exit) {
        break;
      }
      break;
    }
  }

  public async runPrompt(prompt: string, out: any): Promise<void> {
    await this.handleSubmission(prompt, out);
  }

  public async runPromptJson(prompt: string): Promise<any> {
    this.state.turns++;
    this.conversationHistory.push({ role: 'user', content: prompt });
    
    const response = {
      message: `Response to: ${prompt}`,
      model: this.config.model,
      iterations: 1,
      tool_uses: [],
      tool_results: [],
      usage: this.state.lastUsage,
    };
    
    this.conversationHistory.push({ role: 'assistant', content: response.message });
    
    return response;
  }

  public async handleSubmission(input: string, out: any): Promise<CommandResult> {
    const command = parseSlashCommand(input);
    if (command) {
      return this.dispatchSlashCommand(command, out);
    }

    this.state.turns++;
    await this.renderResponse(input, out);
    return CommandResult.Continue;
  }

  private async dispatchSlashCommand(
    command: SlashCommand,
    out: any
  ): Promise<CommandResult> {
    switch (command.type) {
      case 'Help':
        return this.handleHelp(out);
      case 'Status':
        return this.handleStatus(out);
      case 'Compact':
        return this.handleCompact(out);
      case 'Clear':
        return this.handleClear(command.confirm, out);
      case 'Model':
        return this.handleModel(command.model, out);
      case 'Permissions':
        return this.handlePermissions(command.mode, out);
      case 'Cost':
        return this.handleCost(out);
      case 'Config':
        return this.handleConfig(command.section, out);
      case 'Memory':
        return this.handleMemory(out);
      case 'Init':
        return this.handleInit(out);
      case 'Diff':
        return this.handleDiff(out);
      case 'Version':
        return this.handleVersion(out);
      case 'Export':
        return this.handleExport(command.path, out);
      case 'Agents':
        return this.handleAgents(command.args, out);
      case 'Skills':
        return this.handleSkills(command.args, out);
      case 'Unknown':
        out.write(`Unknown slash command: /${command.name}\n`);
        return CommandResult.Continue;
      default:
        out.write('Slash command unavailable in this mode\n');
        return CommandResult.Continue;
    }
  }

  private handleHelp(out: any): CommandResult {
    out.write('Available commands:\n');
    for (const handler of SLASH_COMMAND_HANDLERS) {
      out.write(`  ${handler.command}  ${handler.summary}\n`);
    }
    return CommandResult.Continue;
  }

  private handleStatus(out: any): CommandResult {
    out.write(`Status\n`);
    out.write(`  Turns            ${this.state.turns}\n`);
    out.write(`  Model            ${this.state.lastModel}\n`);
    out.write(`  Permission mode ${this.config.permissionMode}\n`);
    out.write(`  Output format    ${this.config.outputFormat}\n`);
    out.write(`  Last usage       ${this.state.lastUsage.input_tokens} in / ${this.state.lastUsage.output_tokens} out\n`);
    return CommandResult.Continue;
  }

  private handleCompact(out: any): CommandResult {
    this.state.compactedMessages += this.state.turns;
    this.state.turns = 0;
    this.conversationHistory = [];
    out.write(`Compacted session history (${this.state.compactedMessages} messages total compacted).\n`);
    return CommandResult.Continue;
  }

  private handleClear(confirm: boolean, out: any): CommandResult {
    if (!confirm) {
      out.write('clear: confirmation required; run /clear --confirm to start a fresh session.\n');
      return CommandResult.Continue;
    }
    this.conversationHistory = [];
    this.state.turns = 0;
    this.sessionPath = this.initSession();
    out.write('Session cleared.\n');
    return CommandResult.Continue;
  }

  private handleModel(model: string | undefined, out: any): CommandResult {
    if (!model) {
      out.write(`Model\n  Current  ${this.config.model}\n\n`);
      out.write('Aliases\n  opus     claude-opus-4-6\n  sonnet   claude-sonnet-4-6\n  haiku    claude-haiku-4-5-20251213\n');
      return CommandResult.Continue;
    }

    const resolved = this.resolveModel(model);
    this.config.model = resolved;
    this.state.lastModel = resolved;
    out.write(`Model updated\n  Previous  ${this.state.lastModel}\n  Current   ${resolved}\n`);
    return CommandResult.Continue;
  }

  private resolveModel(model: string): string {
    switch (model) {
      case 'opus': return 'claude-opus-4-6';
      case 'sonnet': return 'claude-sonnet-4-6';
      case 'haiku': return 'claude-haiku-4-5-20251213';
      default: return model;
    }
  }

  private handlePermissions(mode: string | undefined, out: any): CommandResult {
    if (!mode) {
      out.write('Permissions\n');
      out.write(`  Active mode  ${this.config.permissionMode}\n\n`);
      out.write('Modes\n');
      out.write('  read-only         ○ available  Read/search tools only\n');
      out.write('  workspace-write   ○ available  Edit files inside the workspace\n');
      out.write('  danger-full-access ● current    Unrestricted tool access\n');
      return CommandResult.Continue;
    }

    this.config.permissionMode = mode as PermissionMode;
    out.write(`Permissions updated\n  Previous  danger-full-access\n  Active    ${mode}\n`);
    return CommandResult.Continue;
  }

  private handleCost(out: any): CommandResult {
    out.write('Cost\n');
    out.write(`  Input tokens     ${this.state.lastUsage.input_tokens}\n`);
    out.write(`  Output tokens    ${this.state.lastUsage.output_tokens}\n`);
    out.write(`  Cache create     ${this.state.lastUsage.cache_creation_input_tokens}\n`);
    out.write(`  Cache read       ${this.state.lastUsage.cache_read_input_tokens}\n`);
    out.write(`  Total tokens    ${this.state.lastUsage.input_tokens + this.state.lastUsage.output_tokens}\n`);
    return CommandResult.Continue;
  }

  private handleConfig(section: string | undefined, out: any): CommandResult {
    out.write('Config\n');
    out.write(`  Model            ${this.config.model}\n`);
    out.write(`  Permission mode ${this.config.permissionMode}\n`);
    out.write(`  Output format    ${this.config.outputFormat}\n`);
    if (this.config.config) {
      out.write(`  Config file     ${this.config.config}\n`);
    }
    return CommandResult.Continue;
  }

  private handleMemory(out: any): CommandResult {
    const messagesSize = JSON.stringify(this.conversationHistory).length;
    out.write('Memory\n');
    out.write(`  Messages stored  ${this.conversationHistory.length}\n`);
    out.write(`  Est. size       ${(messagesSize / 1024).toFixed(2)} KB\n`);
    return CommandResult.Continue;
  }

  private handleInit(out: any): CommandResult {
    out.write('Init not implemented - use sincode init command\n');
    return CommandResult.Continue;
  }

  private handleDiff(out: any): CommandResult {
    out.write('Diff command not implemented in TypeScript version\n');
    return CommandResult.Continue;
  }

  private handleVersion(out: any): CommandResult {
    out.write(`OpenSIN Code 0.1.0\n`);
    return CommandResult.Continue;
  }

  private handleExport(path: string | undefined, out: any): CommandResult {
    const exportPath = path || this.sessionPath;
    out.write(`Export\n  Result  ${exportPath}\n  Messages  ${this.conversationHistory.length}\n`);
    return CommandResult.Continue;
  }

  private handleAgents(args: string | undefined, out: any): CommandResult {
    out.write('Agents\n  (List of agents would appear here)\n');
    return CommandResult.Continue;
  }

  private handleSkills(args: string | undefined, out: any): CommandResult {
    out.write('Skills\n  (List of skills would appear here)\n');
    return CommandResult.Continue;
  }

  private async renderResponse(input: string, out: any): Promise<void> {
    const spinner = new Spinner();
    spinner.tick('Thinking...', this.renderer.colorTheme_(), out);

    await this.simulateProcessing();

    spinner.finish('Done', this.renderer.colorTheme_(), out);
    out.write('\n');
    
    const response = this.generateResponse(input);
    this.renderer.streamMarkdown(response, out);
    
    this.conversationHistory.push({ role: 'user', content: input });
    this.conversationHistory.push({ role: 'assistant', content: response });
  }

  private async simulateProcessing(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100));
  }

  private generateResponse(input: string): string {
    return `## Response\n\nYou said: "${input}"\n\nThis is a placeholder response. The OpenSIN Code CLI is being ported from Rust to TypeScript.`;
  }

  public async handleReplCommand(command: SlashCommand): Promise<boolean> {
    const out = process.stdout;
    const result = await this.dispatchSlashCommand(command, out);
    return result === CommandResult.Continue;
  }

  public async persistSession(): Promise<void> {
    const dir = dirname(this.sessionPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    const sessionData = {
      id: this.sessionPath,
      messages: this.conversationHistory,
      config: this.config,
      state: this.state,
    };
    
    writeFileSync(this.sessionPath, JSON.stringify(sessionData, null, 2));
  }
}
