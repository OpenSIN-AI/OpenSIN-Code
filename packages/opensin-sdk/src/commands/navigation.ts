import { CommandSpec, CommandCategory } from './index';

async function handleBrowse(args?: string): Promise<string> {
  return `Browse files${args ? ` matching: ${args}` : ''}`;
}

async function handleFind(args?: string): Promise<string> {
  if (!args) return 'Usage: /find <pattern>';
  return `Searching for: ${args}`;
}

async function handleGrep(args?: string): Promise<string> {
  if (!args) return 'Usage: /grep <pattern>';
  return `Grep search: ${args}`;
}

async function handleRead(args?: string): Promise<string> {
  if (!args) return 'Usage: /read <file>';
  return `Reading file: ${args}`;
}

async function handleOpen(args?: string): Promise<string> {
  if (!args) return 'Usage: /open <file>';
  return `Opening in editor: ${args}`;
}

export const navigationCommands: CommandSpec[] = [
  {
    name: 'browse',
    aliases: [],
    description: 'Browse files',
    argumentHint: '<pattern>',
    resumeSupported: false,
    category: CommandCategory.Navigation,
    handler: handleBrowse,
  },
  {
    name: 'find',
    aliases: [],
    description: 'Find in files',
    argumentHint: '<pattern>',
    resumeSupported: false,
    category: CommandCategory.Navigation,
    handler: handleFind,
  },
  {
    name: 'grep',
    aliases: [],
    description: 'Grep search',
    argumentHint: '<pattern>',
    resumeSupported: false,
    category: CommandCategory.Navigation,
    handler: handleGrep,
  },
  {
    name: 'read',
    aliases: [],
    description: 'Read file',
    argumentHint: '<file>',
    resumeSupported: false,
    category: CommandCategory.Navigation,
    handler: handleRead,
  },
  {
    name: 'open',
    aliases: [],
    description: 'Open in editor',
    argumentHint: '<file>',
    resumeSupported: false,
    category: CommandCategory.Navigation,
    handler: handleOpen,
  },
];