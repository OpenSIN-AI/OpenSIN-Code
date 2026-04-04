/**
 * Edit Tool - Search & Replace
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { isPathSafe, validateFileReadable } from '../security.js';

export const editInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    file_path: { type: 'string', description: 'The absolute or relative path to the file to edit' },
    old_string: { type: 'string', description: 'The exact text to search for and replace' },
    new_string: { type: 'string', description: 'The text to replace old_string with' },
  },
  required: ['file_path', 'old_string', 'new_string'],
  additionalProperties: false,
};

export async function editFile(
  filePath: string,
  oldString: string,
  newString: string,
  context: SecurityContext,
): Promise<ToolResult> {
  let resolvedPath: string;
  try { resolvedPath = path.resolve(context.cwd, filePath); } catch {
    return { output: `Error: Invalid file path: ${filePath}`, isError: true, errorCode: 1 };
  }

  const permission = isPathSafe(resolvedPath);
  if (!permission.allowed) {
    return { output: `Error: ${permission.reason}`, isError: true, errorCode: permission.errorCode ?? 2 };
  }

  const readable = validateFileReadable(resolvedPath);
  if (!readable.allowed) {
    return { output: `Error: ${readable.reason}`, isError: true, errorCode: readable.errorCode ?? 3 };
  }

  let content: string;
  try { content = fs.readFileSync(resolvedPath, 'utf8'); } catch {
    return { output: `Error: File not found: ${resolvedPath}`, isError: true, errorCode: 4 };
  }

  const occurrences = content.split(oldString).length - 1;
  if (occurrences === 0) {
    return { output: `Error: Text not found in file: ${oldString.substring(0, 100)}${oldString.length > 100 ? '...' : ''}`, isError: true, errorCode: 5 };
  }
  if (occurrences > 1) {
    return { output: `Error: Text found ${occurrences} times. Must be unique. Provide more context to make it unique.`, isError: true, errorCode: 6 };
  }

  const newContent = content.replace(oldString, newString);
  try { fs.writeFileSync(resolvedPath, newContent, 'utf8'); } catch (error) {
    return { output: `Error: Failed to write file: ${error instanceof Error ? error.message : String(error)}`, isError: true, errorCode: 7 };
  }

  const oldLines = oldString.split('\n').length;
  const newLines = newString.split('\n').length;

  return {
    output: `File edited successfully: ${resolvedPath}\nReplaced ${oldLines} line(s) with ${newLines} line(s).`,
    isError: false,
    metadata: { filePath: resolvedPath, occurrences, oldLines, newLines },
  };
}

export const EditTool: ToolDefinition = {
  name: 'edit',
  description: 'Search and replace text in a file. The old_string must match exactly and appear only once.',
  inputSchema: editInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return editFile(
      input.file_path as string,
      input.old_string as string,
      input.new_string as string,
      { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false },
    );
  },
};
