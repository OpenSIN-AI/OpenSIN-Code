// src/command.ts
import { PluginContext } from './context.js';

export interface CommandDefinition {
  name: string;
  description: string;
  usage?: string;
  aliases?: string[];
  options?: Record<string, {
    type: 'string' | 'number' | 'boolean';
    description: string;
    required?: boolean;
    default?: unknown;
    short?: string;
  }>;
  execute: (args: string[], options: Record<string, unknown>, ctx: PluginContext) => Promise<{
    content: string;
    error?: string;
  }>;
}

export function createCommand(definition: CommandDefinition): CommandDefinition {
  // Validate command definition
  if (!definition.name || !definition.description || !definition.execute) {
    throw new Error('Command must have name, description, and execute function');
  }

  // Ensure name starts with slash
  if (!definition.name.startsWith('/')) {
    definition.name = `/${definition.name}`;
  }

  return definition;
}

// Command argument parsing utility
export function parseCommandArgs(input: string): {
  command: string;
  args: string[];
  options: Record<string, unknown>;
} {
  const parts = input.trim().split(/\s+/);
  const command = parts[0];

  const args: string[] = [];
  const options: Record<string, unknown> = {};

  let i = 1;
  while (i < parts.length) {
    const part = parts[i];

    if (part.startsWith('--')) {
      // Long option
      const [key, value] = part.slice(2).split('=');
      if (value !== undefined) {
        options[key] = value;
      } else if (i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
        options[key] = parts[i + 1];
        i++;
      } else {
        options[key] = true;
      }
    } else if (part.startsWith('-')) {
      // Short option
      const key = part.slice(1);
      if (i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
        options[key] = parts[i + 1];
        i++;
      } else {
        options[key] = true;
      }
    } else {
      args.push(part);
    }

    i++;
  }

  return { command, args, options };
}