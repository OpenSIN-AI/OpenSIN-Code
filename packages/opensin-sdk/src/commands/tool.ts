import { CommandSpec, CommandCategory } from './index';

async function handleBash(args?: string): Promise<string> {
  if (!args) return 'Usage: /bash <command>';
  return `Running: ${args}`;
}

async function handleWeb(args?: string): Promise<string> {
  if (!args) return 'Usage: /web <search or url>';
  return `Web search/fetch: ${args}`;
}

async function handleTodo(args?: string): Promise<string> {
  if (!args) return 'Usage: /todo <add|list|done|remove> [item]';
  return `Todo: ${args || 'list'}`;
}

async function handleSkills(): Promise<string> {
  return 'Skills: (use /skills list to see all)';
}

async function handleAgents(args?: string): Promise<string> {
  return `Agents${args ? `: ${args}` : ': (use /agents list to see all)'}`;
}

async function handleTools(): Promise<string> {
  return 'Tools: (use /tools list to see all)';
}

export const toolCommands: CommandSpec[] = [
  {
    name: 'bash',
    aliases: [],
    description: 'Run bash command',
    argumentHint: '<command>',
    resumeSupported: false,
    category: CommandCategory.Tool,
    handler: handleBash,
  },
  {
    name: 'web',
    aliases: [],
    description: 'Web search/fetch',
    argumentHint: '<search or url>',
    resumeSupported: false,
    category: CommandCategory.Tool,
    handler: handleWeb,
  },
  {
    name: 'todo',
    aliases: [],
    description: 'Todo management',
    argumentHint: '<action> [item]',
    resumeSupported: false,
    category: CommandCategory.Tool,
    handler: handleTodo,
  },
  {
    name: 'skills',
    aliases: [],
    description: 'List skills',
    argumentHint: undefined,
    resumeSupported: true,
    category: CommandCategory.Tool,
    handler: handleSkills,
  },
  {
    name: 'agents',
    aliases: [],
    description: 'List agents',
    argumentHint: undefined,
    resumeSupported: true,
    category: CommandCategory.Tool,
    handler: handleAgents,
  },
  {
    name: 'tools',
    aliases: [],
    description: 'List tools',
    argumentHint: undefined,
    resumeSupported: true,
    category: CommandCategory.Tool,
    handler: handleTools,
  },
];