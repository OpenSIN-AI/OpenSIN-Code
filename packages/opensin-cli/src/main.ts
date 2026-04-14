import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { cwd } from 'process';
import { homedir } from 'os';
import { parseArgs, type CliAction, type PermissionMode, type OutputFormat, resolveModelAlias, PermissionMode as PermMode, OutputFormat as OutFormat } from './args.js';
import { SessionApp, type SessionConfig, type SlashCommand } from './app.js';
import { TerminalRenderer, Spinner } from './render.js';
import { initializeRepo, renderSinMd, renderInitReport, type InitReport } from './init.js';
import { LineEditor, ReadOutcome } from './input.js';

const DEFAULT_MODEL = 'claude-opus-4-6';
const VERSION = '0.1.0';

const SIN_DIR = '.sin';
const SIN_MD = 'SIN.md';

function renderCliError(problem: string): string {
  const lines = ['Error'];
  const problemLines = problem.split('\n');
  for (let i = 0; i < problemLines.length; i++) {
    const label = i === 0 ? '  Problem          ' : '                   ';
    lines.push(`${label}${problemLines[i]}`);
  }
  lines.push('  Help             sincode --help');
  return lines.join('\n');
}

export async function run() {
  try {
    const args = process.argv.slice(2);
    const action = parseArgs(args);
    await executeAction(action);
  } catch (error) {
    console.error(renderCliError(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

async function executeAction(action: CliAction): Promise<void> {
  switch (action.type) {
    case 'dump-manifests':
      dumpManifests();
      break;
    case 'bootstrap-plan':
      printBootstrapPlan();
      break;
    case 'agents':
      await handleAgents(action.args);
      break;
    case 'skills':
      await handleSkills(action.args);
      break;
    case 'system-prompt':
      printSystemPrompt(action.cwd, action.date);
      break;
    case 'version':
      printVersion();
      break;
    case 'resume':
      resumeSession(action.sessionPath, action.commands);
      break;
    case 'prompt':
      await runPrompt(action.prompt, action.model, action.outputFormat, action.allowedTools, action.permissionMode);
      break;
    case 'login':
      await runLogin();
      break;
    case 'logout':
      await runLogout();
      break;
    case 'init':
      await runInit();
      break;
    case 'repl':
      await runRepl(action.model, action.allowedTools, action.permissionMode);
      break;
    case 'help':
      printHelp();
      break;
  }
}

export function dumpManifests(): void {
  console.log('commands: 0');
  console.log('tools: 0');
  console.log('bootstrap phases: 0');
}

export function printBootstrapPlan(): void {
  console.log('- Phase: Load config');
  console.log('- Phase: Initialize tools');
  console.log('- Phase: Start session');
}

export async function handleAgents(args?: string): Promise<void> {
  console.log('Agents command');
  if (args) {
    console.log(`  Args: ${args}`);
  }
}

export async function handleSkills(args?: string): Promise<void> {
  console.log('Skills command');
  if (args) {
    console.log(`  Args: ${args}`);
  }
}

export function printSystemPrompt(cwdPath: string, date: string): void {
  const sections = [
    'You are OpenSIN Code, an AI coding assistant.',
    `Working directory: ${cwdPath}`,
    `Date: ${date}`,
    'Use available tools to help with coding tasks.',
  ];
  console.log(sections.join('\n\n'));
}

export function printVersion(): void {
  console.log(renderVersionReport());
}

export function renderVersionReport(): string {
  return `OpenSIN Code ${VERSION}`;
}

export function resumeSession(sessionPath: string, commands: string[]): void {
  if (!existsSync(sessionPath)) {
    console.error(`failed to restore session: file not found: ${sessionPath}`);
    process.exit(1);
  }

  try {
    const sessionData = JSON.parse(readFileSync(sessionPath, 'utf-8'));
    const messageCount = sessionData.messages?.length || 0;

    if (commands.length === 0) {
      console.log(`Restored session from ${sessionPath} (${messageCount} messages).`);
      return;
    }

    for (const rawCommand of commands) {
      const command = parseSlashCommandInput(rawCommand);
      if (!command) {
        console.error(`unsupported resumed command: ${rawCommand}`);
        process.exit(2);
      }

      const result = runResumeCommand(command, sessionData);
      if (result.error) {
        console.error(result.error);
        process.exit(2);
      }
      if (result.message) {
        console.log(result.message);
      }
    }
  } catch (error) {
    console.error(`failed to restore session: ${error}`);
    process.exit(1);
  }
}

function parseSlashCommandInput(input: string): SlashCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const command = trimmed.slice(1).split(/\s+/)[0];
  const args = trimmed.slice(1).split(/\s+/).slice(1).join(' ');

  switch (command) {
    case 'help': return { type: 'Help' };
    case 'status': return { type: 'Status' };
    case 'compact': return { type: 'Compact', confirm: false };
    case 'clear': return { type: 'Clear', confirm: false };
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

function runResumeCommand(command: SlashCommand, session: any): { error?: string; message?: string } {
  switch (command.type) {
    case 'Help':
      return { message: renderReplHelp() };
    case 'Status':
      return { message: formatStatusReport(session) };
    case 'Compact':
      return { message: 'Compact not implemented in TypeScript version' };
    case 'Clear':
      return { message: 'clear: confirmation required; rerun with /clear --confirm' };
    case 'Cost':
      return { message: formatCostReport({ input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }) };
    case 'Version':
      return { message: renderVersionReport() };
    case 'Init':
      return { message: initSinMd() || 'SIN.md initialized' };
    case 'Diff':
      return { message: 'Diff not implemented in TypeScript version' };
    case 'Export':
      return { message: `Export path: ${(command as any).path || '<default>'}` };
    default:
      return { message: `Command ${command.type} not available in resume mode` };
  }
}

function formatStatusReport(session: any): string {
  const messageCount = session.messages?.length || 0;
  const turns = Math.ceil(messageCount / 2);
  return `Status
  Session          ${messageCount} messages · ${turns} turns
  Model            ${DEFAULT_MODEL}
  Permissions      danger-full-access`;
}

function formatCostReport(usage: any): string {
  return `Cost
  Input tokens     ${usage.input_tokens}
  Output tokens    ${usage.output_tokens}
  Total tokens     ${usage.input_tokens + usage.output_tokens}`;
}

export async function runPrompt(
  prompt: string,
  model: string,
  outputFormat: OutputFormat,
  allowedTools?: Set<string>,
  permissionMode?: PermissionMode
): Promise<void> {
  const config: SessionConfig = {
    model: resolveModelAlias(model),
    permissionMode: permissionMode || PermMode.DangerFullAccess,
    outputFormat: outputFormat || OutFormat.Text,
  };

  const app = new SessionApp(config);
  
  if (outputFormat === OutFormat.Json || outputFormat === OutFormat.Ndjson) {
    const response = await app.runPromptJson(prompt);
    console.log(JSON.stringify(response, null, 2));
  } else {
    await app.runPrompt(prompt, process.stdout);
  }
}

export async function runLogin(): Promise<void> {
  console.log('Starting OpenSIN OAuth login...');
  console.log('OAuth login requires web browser. Use sincode login in browser environment.');
  throw new Error('OAuth login not yet implemented in TypeScript version');
}

export async function runLogout(): Promise<void> {
  const configPath = join(homedir(), SIN_DIR, 'credentials.json');
  try {
    if (existsSync(configPath)) {
      const data = JSON.parse(readFileSync(configPath, 'utf-8'));
      delete data.access_token;
      delete data.refresh_token;
      writeFileSync(configPath, JSON.stringify(data, null, 2));
    }
  } catch {
    // ignore
  }
  console.log('OpenSIN OAuth credentials cleared.');
}

export async function runInit(): Promise<void> {
  const currentDir = cwd();
  const report = initializeRepo(currentDir);
  console.log(renderInitReport(report));
}

export async function runRepl(
  model: string,
  allowedTools?: Set<string>,
  permissionMode?: PermissionMode
): Promise<void> {
  const config: SessionConfig = {
    model: resolveModelAlias(model),
    permissionMode: permissionMode || PermMode.DangerFullAccess,
    outputFormat: OutFormat.Text,
  };

  const app = new SessionApp(config);
  const editor = new LineEditor('> ', getSlashCommandCompletisions());

  console.log(app.startupBanner());

  // Auto-termination after 1 hour of inactivity
  const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
  let idleTimer: NodeJS.Timeout;

  const resetIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.log('\n[Idle timeout] No activity for 1 hour. Shutting down gracefully...');
      try { app.persistSession().catch(() => {}); } catch (e) {}
      process.exit(0);
    }, IDLE_TIMEOUT_MS);
  };

  resetIdleTimer();

  try {
    while (true) {
      const outcome = await editor.readLine();
      
      if (outcome === ReadOutcome.Submit) {
        const input = ((outcome as any).text || '').trim();
        if (!input) continue;
        if (input === '/exit' || input === '/quit') {
          await app.persistSession();
          break;
        }

        const command = parseSlashCommandInput(input);
        if (command) {
          const shouldPersist = await app.handleReplCommand(command);
          if (shouldPersist) {
            await app.persistSession();
          }
          resetIdleTimer();
          continue;
        }

        editor.pushHistory(input);
        await app.runPrompt(input, process.stdout);
        resetIdleTimer();
        continue;
      } else if (outcome === ReadOutcome.Cancel) {
        resetIdleTimer();
        continue;
      } else if (outcome === ReadOutcome.Exit) {
        await app.persistSession();
        break;
      }
      break;
    }
  } finally {
    if (idleTimer) clearTimeout(idleTimer);
  }
}

function getSlashCommandCompletions(): string[] {
  return [
    '/help',
    '/status',
    '/compact',
    '/clear',
    '/model',
    '/permissions',
    '/cost',
    '/config',
    '/memory',
    '/init',
    '/diff',
    '/version',
    '/export',
    '/agents',
    '/skills',
    '/session',
    '/plugins',
    '/branch',
    '/worktree',
    '/commit',
    '/pr',
    '/issue',
    '/ultraplan',
    '/teleport',
    '/debug-tool-call',
    '/resume',
    '/bughunter',
  ];
}

export function printHelp(): void {
  console.log(renderReplHelp());
}

function renderReplHelp(): string {
  return `OpenSIN Code Help

  /help              Show this help
  /status            Show current session status
  /model             Show current model
  /model <name>      Switch models
  /permissions       Show permission mode
  /permissions <mode> Set permission mode
  /compact           Compact session history
  /clear             Clear session (requires --confirm)
  /init              Initialize SIN.md
  /config            Show configuration
  /memory            Show memory usage
  /diff              Show changes
  /export            Export session
  /agents            List agents
  /skills            List skills
  /exit, /quit       Exit REPL

Quick start
  /init              Initialize project
  /help              Get help
  /status            Check status

Editor
  Tab                Completes slash commands
  /vim              Toggles vim mode
  Shift+Enter        Inserts newline
  Ctrl+J             Inserts newline
  Ctrl+C             Cancel input or exit
  Ctrl+D             Exit if input empty`;
}

function initSinMd(): string | null {
  const currentDir = cwd();
  const sinMdPath = join(currentDir, SIN_MD);
  
  if (existsSync(sinMdPath)) {
    return null;
  }

  const content = renderSinMd(currentDir);
  writeFileSync(sinMdPath, content);
  return sinMdPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
