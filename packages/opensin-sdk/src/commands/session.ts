import { CommandSpec, CommandCategory } from './index';

async function handleNew(args?: string): Promise<string> {
  return `Session created. Use /continue to resume this session.${args ? `\nOptions: ${args}` : ''}`;
}

async function handleContinue(args?: string): Promise<string> {
  if (!args) return 'Usage: /continue <session-id>';
  return `Resuming session: ${args}`;
}

async function handleSessions(): Promise<string> {
  return `Sessions:\n  No sessions found`;
}

async function handleCompact(): Promise<string> {
  return 'Session compacted successfully';
}

async function handleClear(args?: string): Promise<string> {
  if (args !== '--confirm') {
    return 'This will clear the conversation. Use /clear --confirm to proceed.';
  }
  return 'Conversation cleared';
}

export const sessionCommands: CommandSpec[] = [
  {
    name: 'new',
    aliases: [],
    description: 'Create new session',
    argumentHint: undefined,
    resumeSupported: true,
    category: CommandCategory.Session,
    handler: handleNew,
  },
  {
    name: 'continue',
    aliases: [],
    description: 'Continue session',
    argumentHint: '<session-id>',
    resumeSupported: false,
    category: CommandCategory.Session,
    handler: handleContinue,
  },
  {
    name: 'sessions',
    aliases: [],
    description: 'List sessions',
    argumentHint: undefined,
    resumeSupported: true,
    category: CommandCategory.Session,
    handler: handleSessions,
  },
  {
    name: 'compact',
    aliases: [],
    description: 'Compact context',
    argumentHint: undefined,
    resumeSupported: true,
    category: CommandCategory.Session,
    handler: handleCompact,
  },
  {
    name: 'clear',
    aliases: [],
    description: 'Clear conversation',
    argumentHint: '[--confirm]',
    resumeSupported: true,
    category: CommandCategory.Session,
    handler: handleClear,
  },
];