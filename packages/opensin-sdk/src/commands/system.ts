import { CommandSpec, CommandCategory } from './index';

async function handleHelp(args?: string): Promise<string> {
  if (args) {
    return `Help for: ${args}`;
  }
  return `Use /help for available commands`;
}

async function handleStatus(): Promise<string> {
  return 'Status: ready';
}

async function handleModel(args?: string): Promise<string> {
  if (!args) return 'Current model: gpt-5.4';
  return `Switching to model: ${args}`;
}

async function handlePermission(args?: string): Promise<string> {
  const modes = ['read-only', 'workspace-write', 'danger-full-access'];
  if (!args) {
    return `Current permission: workspace-write\nAvailable: ${modes.join(', ')}`;
  }
  if (!modes.includes(args)) {
    return `Invalid mode. Use: ${modes.join(', ')}`;
  }
  return `Permission set to: ${args}`;
}

async function handleConfig(args?: string): Promise<string> {
  const sections = ['env', 'hooks', 'model', 'plugins'];
  if (!args) {
    return `Config sections: ${sections.join(', ')}`;
  }
  return `Config: ${args}`;
}

async function handleEnv(args?: string): Promise<string> {
  if (!args) return 'Usage: /env <key>';
  return `Environment: ${args}`;
}

export const systemCommands: CommandSpec[] = [
  {
    name: 'help',
    aliases: [],
    description: 'Help',
    argumentHint: '[command]',
    resumeSupported: true,
    category: CommandCategory.System,
    handler: handleHelp,
  },
  {
    name: 'status',
    aliases: [],
    description: 'Status',
    argumentHint: null,
    resumeSupported: true,
    category: CommandCategory.System,
    handler: handleStatus,
  },
  {
    name: 'model',
    aliases: [],
    description: 'Model selection',
    argumentHint: '[model]',
    resumeSupported: false,
    category: CommandCategory.System,
    handler: handleModel,
  },
  {
    name: 'permission',
    aliases: ['permissions'],
    description: 'Permission settings',
    argumentHint: '[mode]',
    resumeSupported: false,
    category: CommandCategory.System,
    handler: handlePermission,
  },
  {
    name: 'config',
    aliases: [],
    description: 'Config',
    argumentHint: '[section]',
    resumeSupported: true,
    category: CommandCategory.System,
    handler: handleConfig,
  },
  {
    name: 'env',
    aliases: [],
    description: 'Environment',
    argumentHint: '<key>',
    resumeSupported: true,
    category: CommandCategory.System,
    handler: handleEnv,
  },
];