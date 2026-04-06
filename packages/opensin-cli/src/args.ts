import { Command, Option } from 'commander';

export enum PermissionMode {
  ReadOnly = 'read-only',
  WorkspaceWrite = 'workspace-write',
  DangerFullAccess = 'danger-full-access',
}

export enum OutputFormat {
  Text = 'text',
  Json = 'json',
  Ndjson = 'ndjson',
}

export interface CliArgs {
  model: string;
  permissionMode: PermissionMode;
  config?: string;
  outputFormat: OutputFormat;
}

export type CliAction = 
  | { type: 'dump-manifests' }
  | { type: 'bootstrap-plan' }
  | { type: 'agents'; args?: string }
  | { type: 'skills'; args?: string }
  | { type: 'system-prompt'; cwd: string; date: string }
  | { type: 'version' }
  | { type: 'resume'; sessionPath: string; commands: string[] }
  | { type: 'prompt'; prompt: string; model: string; outputFormat: OutputFormat; allowedTools?: Set<string>; permissionMode: PermissionMode }
  | { type: 'login' }
  | { type: 'logout' }
  | { type: 'init' }
  | { type: 'repl'; model: string; allowedTools?: Set<string>; permissionMode: PermissionMode }
  | { type: 'help' };

const DEFAULT_MODEL = 'claude-opus-4-6';
const DEFAULT_DATE = '2026-03-31';

const program = new Command();

program
  .name('sincode')
  .description('OpenSIN Code CLI')
  .version('0.1.0')
  .option('-m, --model <model>', 'Model to use', DEFAULT_MODEL)
  .option('--permission-mode <mode>', 'Permission mode', 'danger-full-access')
  .option('-c, --config <path>', 'Config file path')
  .option('--output-format <format>', 'Output format', 'text');

program
  .command('dump-manifests')
  .description('Read upstream TS sources and print extracted counts')
  .action(() => {});

program
  .command('bootstrap-plan')
  .description('Print the current bootstrap phase skeleton')
  .action(() => {});

program
  .command('login')
  .description('Start the OAuth login flow')
  .action(() => {});

program
  .command('logout')
  .description('Clear saved OAuth credentials')
  .action(() => {});

program
  .command('prompt <prompt...>')
  .description('Run a non-interactive prompt and exit')
  .action(() => {});

program.parse(process.argv);

export function parseArgs(args: string[]): CliAction {
  const opts = program.opts();
  let model = opts.model || DEFAULT_MODEL;
  let outputFormat: OutputFormat = (opts.outputFormat as OutputFormat) || OutputFormat.Text;
  let permissionMode = normalizePermissionMode(opts.permissionMode || 'danger-full-access') as PermissionMode;
  let allowedToolValues: string[] = [];
  let rest: string[] = args;

  const parsed = program.parse(args, { from: 'user' });
  const command = parsed.commands[0];

  if (parsed?.opts()) {
    model = parsed.opts().model || DEFAULT_MODEL;
    outputFormat = (parsed.opts().outputFormat as OutputFormat) || OutputFormat.Text;
    permissionMode = normalizePermissionMode(parsed.opts().permissionMode || 'danger-full-access') as PermissionMode;
  }

  const allowedTools = normalizeAllowedTools(allowedToolValues);

  if (rest.length === 0) {
    return { type: 'repl', model, allowedTools, permissionMode };
  }

  if (rest[0] === '--help' || rest[0] === '-h') {
    return { type: 'help' };
  }

  if (rest[0] === 'dump-manifests') {
    return { type: 'dump-manifests' };
  }
  if (rest[0] === 'bootstrap-plan') {
    return { type: 'bootstrap-plan' };
  }
  if (rest[0] === 'login') {
    return { type: 'login' };
  }
  if (rest[0] === 'logout') {
    return { type: 'logout' };
  }
  if (rest[0] === 'init') {
    return { type: 'init' };
  }
  if (rest[0] === 'prompt') {
    return { type: 'prompt', prompt: rest.slice(1).join(' '), model, outputFormat, allowedTools, permissionMode };
  }
  if (rest[0] === 'agents') {
    return { type: 'agents', args: rest.slice(1).join(' ') || undefined };
  }
  if (rest[0] === 'skills') {
    return { type: 'skills', args: rest.slice(1).join(' ') || undefined };
  }
  if (rest[0] === 'system-prompt') {
    return parseSystemPromptArgs(rest.slice(1));
  }
  if (rest[0] === 'version' || rest[0] === '--version' || rest[0] === '-V') {
    return { type: 'version' };
  }
  if (rest[0] === '--resume') {
    return parseResumeArgs(rest.slice(1));
  }

  if (rest[0].startsWith('/')) {
    return parseSlashCommand(rest.join(' '));
  }

  return { type: 'prompt', prompt: rest.join(' '), model, outputFormat, allowedTools, permissionMode };
}

function parseSystemPromptArgs(args: string[]): CliAction {
  let cwd = process.cwd();
  let date = DEFAULT_DATE;
  let index = 0;

  while (index < args.length) {
    if (args[index] === '--cwd') {
      cwd = args[index + 1] || cwd;
      index += 2;
    } else if (args[index] === '--date') {
      date = args[index + 1] || date;
      index += 2;
    } else {
      break;
    }
  }

  return { type: 'system-prompt', cwd, date };
}

function parseResumeArgs(args: string[]): CliAction {
  const sessionPath = args[0];
  const commands = args.slice(1);

  if (commands.length > 0 && !commands.every(c => c.trim().startsWith('/'))) {
    throw new Error('--resume trailing arguments must be slash commands');
  }

  return { type: 'resume', sessionPath, commands };
}

function parseSlashCommand(raw: string): CliAction {
  const match = raw.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (!match) {
    throw new Error(`unknown subcommand: ${raw.split(' ')[0]}`);
  }

  const [, name, args] = match;

  switch (name) {
    case 'help':
      return { type: 'help' };
    case 'agents':
      return { type: 'agents', args };
    case 'skills':
      return { type: 'skills', args };
    default:
      throw new Error(`Direct slash command unavailable: /${name}`);
  }
}

function normalizePermissionMode(value: string): string {
  const normalized = value.toLowerCase().replace(/-/g, '');
  if (normalized === 'readonly') return 'read-only';
  if (normalized === 'workspacewrite') return 'workspace-write';
  if (normalized === 'dangerfullaccess') return 'danger-full-access';
  return value;
}

function normalizeAllowedTools(values: string[]): Set<string> | undefined {
  if (values.length === 0) return undefined;
  const tools = new Set<string>();
  for (const value of values) {
    for (const tool of value.split(',').map(t => t.trim())) {
      if (tool) tools.add(tool);
    }
  }
  return tools.size > 0 ? tools : undefined;
}

export function resolveModelAlias(model: string): string {
  switch (model) {
    case 'opus': return 'claude-opus-4-6';
    case 'sonnet': return 'claude-sonnet-4-6';
    case 'haiku': return 'claude-haiku-4-5-20251213';
    default: return model;
  }
}
