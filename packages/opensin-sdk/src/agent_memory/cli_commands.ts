/**
 * OpenSIN Agent Memory — CLI Command Handlers
 *
 * Slash command handlers for /memory operations in the OpenSIN CLI.
 * Provides: /memory list, /memory add, /memory edit, /memory delete, /memory search
 *
 * Branded as OpenSIN/sincode.
 */

import { MemoryManager } from '../agent_memory/index.js';
import type { MemoryScope } from '../agent_memory/types.js';

/**
 * Parse scope from args string.
 */
function parseScope(args: string): MemoryScope | 'all' {
  const parts = args.trim().split(/\s+/);
  if (parts[0] === '--global' || parts[0] === '-g') return 'global';
  if (parts[0] === '--project' || parts[0] === '-p') return 'project';
  return 'all';
}

/**
 * Strip scope flags from args string.
 */
function stripScope(args: string): string {
  return args.replace(/^--(?:global|project)\s*|^-g\s*|^-p\s*/, '').trim();
}

/**
 * Handle /memory list command.
 * Usage: /memory list [--global|--project]
 */
export async function handleMemoryList(
  manager: MemoryManager,
  args: string,
): Promise<string> {
  const scope = parseScope(args);
  const blocks = await manager.list(scope);
  return MemoryManager.formatBlockList(blocks);
}

/**
 * Handle /memory add command.
 * Usage: /memory add <scope>:<label> <content>
 */
export async function handleMemoryAdd(
  manager: MemoryManager,
  args: string,
): Promise<string> {
  const trimmed = args.trim();
  if (!trimmed) {
    return 'Usage: /memory add <scope>:<label> <content>\nExample: /memory add project:conventions Use kebab-case for file names';
  }

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) {
    return 'Usage: /memory add <scope>:<label> <content>\nExample: /memory add global:preferences User prefers TypeScript over JavaScript';
  }

  const scope = trimmed.slice(0, colonIdx).trim() as MemoryScope;
  if (scope !== 'global' && scope !== 'project') {
    return `Invalid scope "${scope}". Use "global" or "project".`;
  }

  const rest = trimmed.slice(colonIdx + 1);
  const spaceIdx = rest.indexOf(' ');
  if (spaceIdx === -1) {
    return 'Usage: /memory add <scope>:<label> <content>\nYou must provide content after the label.';
  }

  const label = rest.slice(0, spaceIdx).trim();
  const value = rest.slice(spaceIdx + 1).trim();

  if (!label) {
    return 'Label cannot be empty.';
  }

  if (!value) {
    return 'Content cannot be empty.';
  }

  try {
    await manager.set(scope, label, value);
    return `Memory block created: ${scope}:${label} (${value.length} characters)`;
  } catch (error) {
    return `Error creating memory block: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle /memory edit command.
 * Usage: /memory edit <scope>:<label> <new_content>
 */
export async function handleMemoryEdit(
  manager: MemoryManager,
  args: string,
): Promise<string> {
  const trimmed = args.trim();
  if (!trimmed) {
    return 'Usage: /memory edit <scope>:<label> <new_content>\nExample: /memory edit project:conventions Use PascalCase for components';
  }

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) {
    return 'Usage: /memory edit <scope>:<label> <new_content>';
  }

  const scope = trimmed.slice(0, colonIdx).trim() as MemoryScope;
  if (scope !== 'global' && scope !== 'project') {
    return `Invalid scope "${scope}". Use "global" or "project".`;
  }

  const rest = trimmed.slice(colonIdx + 1);
  const spaceIdx = rest.indexOf(' ');
  if (spaceIdx === -1) {
    return 'Usage: /memory edit <scope>:<label> <new_content>\nYou must provide new content after the label.';
  }

  const label = rest.slice(0, spaceIdx).trim();
  const value = rest.slice(spaceIdx + 1).trim();

  if (!label) {
    return 'Label cannot be empty.';
  }

  if (!value) {
    return 'Content cannot be empty.';
  }

  try {
    await manager.set(scope, label, value);
    return `Memory block updated: ${scope}:${label} (${value.length} characters)`;
  } catch (error) {
    return `Error editing memory block: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle /memory delete command.
 * Usage: /memory delete <scope>:<label>
 */
export async function handleMemoryDelete(
  manager: MemoryManager,
  args: string,
): Promise<string> {
  const trimmed = args.trim();
  if (!trimmed) {
    return 'Usage: /memory delete <scope>:<label>\nExample: /memory delete project:old-notes';
  }

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) {
    return 'Usage: /memory delete <scope>:<label>';
  }

  const scope = trimmed.slice(0, colonIdx).trim() as MemoryScope;
  if (scope !== 'global' && scope !== 'project') {
    return `Invalid scope "${scope}". Use "global" or "project".`;
  }

  const label = trimmed.slice(colonIdx + 1).trim();
  if (!label) {
    return 'Label cannot be empty.';
  }

  try {
    await manager.delete(scope, label);
    return `Memory block deleted: ${scope}:${label}`;
  } catch (error) {
    return `Error deleting memory block: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle /memory search command.
 * Usage: /memory search <query> [--global|--project]
 */
export async function handleMemorySearch(
  manager: MemoryManager,
  args: string,
): Promise<string> {
  const trimmed = args.trim();
  if (!trimmed) {
    return 'Usage: /memory search <query> [--global|--project]\nExample: /memory search TypeScript';
  }

  const scope = parseScope(trimmed);
  const query = stripScope(trimmed);

  if (!query) {
    return 'Search query cannot be empty.';
  }

  try {
    const results = await manager.search(query, scope);
    return MemoryManager.formatSearchResults(results, query);
  } catch (error) {
    return `Error searching memory: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Handle /memory get command (show full content of a block).
 * Usage: /memory get <scope>:<label>
 */
export async function handleMemoryGet(
  manager: MemoryManager,
  args: string,
): Promise<string> {
  const trimmed = args.trim();
  if (!trimmed) {
    return 'Usage: /memory get <scope>:<label>\nExample: /memory get project:conventions';
  }

  const colonIdx = trimmed.indexOf(':');
  if (colonIdx === -1) {
    return 'Usage: /memory get <scope>:<label>';
  }

  const scope = trimmed.slice(0, colonIdx).trim() as MemoryScope;
  if (scope !== 'global' && scope !== 'project') {
    return `Invalid scope "${scope}". Use "global" or "project".`;
  }

  const label = trimmed.slice(colonIdx + 1).trim();
  if (!label) {
    return 'Label cannot be empty.';
  }

  try {
    const block = await manager.get(scope, label);
    const charsCurrent = block.value.length;
    return `[${scope}:${block.label}] (${charsCurrent}/${block.limit} chars)\n${block.description}\n\n${block.value}`;
  } catch (error) {
    return `Error reading memory block: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Show memory help.
 */
export function showMemoryHelp(): string {
  return `OpenSIN Agent Memory Commands:

  /memory list [--global|--project]     List all memory blocks
  /memory get <scope>:<label>           Show full content of a block
  /memory add <scope>:<label> <content> Create a new memory block
  /memory edit <scope>:<label> <text>   Replace block content
  /memory delete <scope>:<label>        Delete a memory block
  /memory search <query> [--global|-p]  Search across memory blocks
  /memory help                          Show this help

Scopes:
  global   - Shared across all projects (~/.opensin/memory/)
  project  - Specific to current project (.opensin/memory/)

Examples:
  /memory list
  /memory list --project
  /memory add global:preferences User prefers concise responses
  /memory edit project:conventions Use arrow functions everywhere
  /memory delete project:old-notes
  /memory search TypeScript
  /memory get global:persona`;
}
