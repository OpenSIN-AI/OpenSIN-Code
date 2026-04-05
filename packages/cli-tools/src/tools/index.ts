/**
 * OpenSIN CLI Tools - Index
 */

export { BashTool, executeCommand, DEFAULT_BASH_TIMEOUT_MS, MAX_BASH_TIMEOUT_MS, MAX_OUTPUT_SIZE, bashInputSchema } from './bash.js';
export { ReadTool, readFile, MAX_FILE_READ_SIZE, DEFAULT_READ_LIMIT, readInputSchema } from './read.js';
export { WriteTool, writeFile, MAX_FILE_WRITE_SIZE, writeInputSchema } from './write.js';
export { EditTool, editFile, MAX_EDIT_FILE_SIZE, editInputSchema } from './edit.js';
export { GrepTool, grepSearch, DEFAULT_GREP_LIMIT, MAX_GREP_LIMIT, grepInputSchema } from './grep.js';
export { GlobTool, globSearch, DEFAULT_GLOB_LIMIT, MAX_GLOB_LIMIT, globInputSchema } from './glob.js';

import { BashTool } from './bash.js';
import { ReadTool } from './read.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { GrepTool } from './grep.js';
import { GlobTool } from './glob.js';
import type { ToolDefinition } from '../types.js';

export const ALL_CLI_TOOLS: ToolDefinition[] = [BashTool, ReadTool, WriteTool, EditTool, GrepTool, GlobTool];

export function getToolByName(name: string): ToolDefinition | undefined {
  return ALL_CLI_TOOLS.find(t => t.name === name);
}

export function getToolNames(): string[] {
  return ALL_CLI_TOOLS.map(t => t.name);
}
