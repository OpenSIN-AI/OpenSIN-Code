import { sessionCommands } from './session';
import { navigationCommands } from './navigation';
import { toolCommands } from './tool';
import { projectCommands } from './project';
import { systemCommands } from './system';

export interface CommandSpec {
  name: string;
  aliases: string[];
  description: string;
  argumentHint?: string;
  resumeSupported: boolean;
  category: CommandCategory;
  handler: CommandHandler;
}

export type CommandHandler = (args?: string) => Promise<string> | string;

export enum CommandCategory {
  Session = 'Session',
  Navigation = 'Navigation',
  Tool = 'Tool',
  Project = 'Project',
  System = 'System',
}

export interface ParsedCommand {
  name: string;
  args?: string;
}

export const allCommands: CommandSpec[] = [
  ...sessionCommands,
  ...navigationCommands,
  ...toolCommands,
  ...projectCommands,
  ...systemCommands,
];

export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const name = parts[0]?.toLowerCase();
  const args = parts.slice(1).join(' ');

  if (!name) return null;
  return { name, args: args || undefined };
}

export function findCommand(input: string): CommandSpec | null {
  const parsed = parseCommand(input);
  if (!parsed) return null;

  return (
    allCommands.find(
      (cmd) =>
        cmd.name === parsed.name ||
        cmd.aliases.map((a) => a.toLowerCase()).includes(parsed.name!)
    ) || null
  );
}

export function suggestCommands(input: string, limit = 5): string[] {
  const normalized = input.trim().slice(1).toLowerCase();
  if (!normalized || limit === 0) return [];

  const scored = allCommands
    .map((cmd) => {
      const match =
        cmd.name === normalized ? 0
        : cmd.name.startsWith(normalized) ? 1
        : cmd.aliases.some((a) => a.toLowerCase() === normalized) ? 0
        : cmd.aliases.some((a) => a.toLowerCase().startsWith(normalized)) ? 1
        : cmd.name.includes(normalized) || cmd.aliases.some((a) => a.toLowerCase().includes(normalized)) ? 2
        : null;

      return match !== null ? { cmd, score: match } : null;
    })
    .filter((x): x is { cmd: CommandSpec; score: number } => x !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ cmd }) => cmd.argumentHint ? `/${cmd.name} ${cmd.argumentHint}` : `/${cmd.name}`);

  return [...new Set(scored)];
}

export function renderHelp(): string {
  const categories = [
    { name: 'Session', cmds: sessionCommands },
    { name: 'Navigation', cmds: navigationCommands },
    { name: 'Tool', cmds: toolCommands },
    { name: 'Project', cmds: projectCommands },
    { name: 'System', cmds: systemCommands },
  ];

  const lines = ['Slash commands', '  Tab completes commands inside the REPL.'];

  for (const { name, cmds } of categories) {
    lines.push('', name);
    for (const cmd of cmds) {
      const aliasSuffix = cmd.aliases.length > 0
        ? ` (aliases: ${cmd.aliases.map((a) => '/' + a).join(', ')})`
        : '';
      const resume = cmd.resumeSupported ? ' [resume]' : '';
      const nameStr = cmd.argumentHint ? `/${cmd.name} ${cmd.argumentHint}` : `/${cmd.name}`;
      lines.push(`  ${nameStr.padEnd(48)} ${cmd.description}${aliasSuffix}${resume}`);
    }
  }

  return lines.join('\n');
}