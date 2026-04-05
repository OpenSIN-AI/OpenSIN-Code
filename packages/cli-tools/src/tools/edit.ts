/**
 * Edit Tool - Search and Replace
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { validateFilePath, isProtectedPath } from '../security.js';

export const MAX_EDIT_FILE_SIZE = 10 * 1024 * 1024;

export const editInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    file_path: { type: 'string', description: 'The absolute or relative path to the file to edit' },
    old_string: { type: 'string', description: 'The exact text to find and replace. Must match the file content exactly.' },
    new_string: { type: 'string', description: 'The new text to replace the old_string with' },
    replace_all: { type: 'boolean', description: 'Replace all occurrences of old_string. Default: false' },
  },
  required: ['file_path', 'old_string', 'new_string'],
  additionalProperties: false,
};

function generateDiff(original: string, modified: string, filePath: string): string {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const diffLines: string[] = ['--- ' + filePath, '+++ ' + filePath];
  let origIdx = 0, modIdx = 0, origStart = 0, modStart = 0;
  let hunk: string[] = [];
  while (origIdx < origLines.length || modIdx < modLines.length) {
    const origLine = origIdx < origLines.length ? origLines[origIdx] : undefined;
    const modLine = modIdx < modLines.length ? modLines[modIdx] : undefined;
    if (origLine === modLine) {
      if (hunk.length > 0) {
        diffLines.push('@@ -' + (origStart + 1) + ',' + (origIdx - origStart) + ' +' + (modStart + 1) + ',' + (modIdx - modStart) + ' @@');
        diffLines.push(...hunk); hunk = [];
      }
      origIdx++; modIdx++;
    } else {
      if (hunk.length === 0) { origStart = origIdx; modStart = modIdx; }
      if (origLine !== undefined) { hunk.push('- ' + origLine); origIdx++; }
      if (modLine !== undefined) { hunk.push('+ ' + modLine); modIdx++; }
    }
  }
  if (hunk.length > 0) {
    diffLines.push('@@ -' + (origStart + 1) + ',' + (origLines.length - origStart) + ' +' + (modStart + 1) + ',' + (modLines.length - modIdx) + ' @@');
    diffLines.push(...hunk);
  }
  return diffLines.join('\n');
}

function findActualString(fileContent: string, searchString: string): string | null {
  const exactIndex = fileContent.indexOf(searchString);
  if (exactIndex !== -1) return searchString;
  const normalizedSearch = searchString.replace(/\r\n/g, '\n');
  const normalizedContent = fileContent.replace(/\r\n/g, '\n');
  if (normalizedContent.indexOf(normalizedSearch) !== -1) return normalizedSearch;
  return null;
}

export async function editFile(filePath: string, oldString: string, newString: string, context: SecurityContext, options?: { replaceAll?: boolean }): Promise<ToolResult> {
  if (oldString === newString) {
    return { content: [{ type: 'text', text: 'Error: No changes to make - old_string and new_string are exactly the same.' }], isError: true, errorCode: 1 };
  }
  let resolvedPath: string;
  try { resolvedPath = path.resolve(context.cwd, filePath); } catch {
    return { content: [{ type: 'text', text: 'Error: Invalid file path: ' + filePath }], isError: true, errorCode: 2 };
  }
  const permission = validateFilePath(resolvedPath, context);
  if (!permission.allowed) {
    return { content: [{ type: 'text', text: 'Error: ' + permission.reason }], isError: true, errorCode: permission.errorCode ?? 3 };
  }
  if (isProtectedPath(resolvedPath)) {
    return { content: [{ type: 'text', text: 'Error: Cannot edit protected path: ' + resolvedPath }], isError: true, errorCode: 4 };
  }
  let originalContent: string;
  try {
    const stats = fs.statSync(resolvedPath);
    if (stats.size > MAX_EDIT_FILE_SIZE) {
      return { content: [{ type: 'text', text: 'Error: File too large to edit (' + (stats.size / 1024 / 1024).toFixed(1) + 'MB). Maximum: 10MB.' }], isError: true, errorCode: 5 };
    }
    originalContent = fs.readFileSync(resolvedPath, 'utf8');
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === 'ENOENT') {
      return { content: [{ type: 'text', text: 'Error: File does not exist: ' + resolvedPath + '\nUse the Write tool to create new files.' }], isError: true, errorCode: 6 };
    }
    return { content: [{ type: 'text', text: 'Error: Cannot read file: ' + (error instanceof Error ? error.message : String(error)) }], isError: true, errorCode: 7 };
  }
  const actualOldString = findActualString(originalContent, oldString);
  if (!actualOldString) {
    const lines = originalContent.split('\n');
    let suggestion = '';
    for (const oldLine of oldString.split('\n')) {
      if (oldLine.trim()) {
        const foundLine = lines.find(l => l.includes(oldLine.trim()));
        if (foundLine) { suggestion = '\n\nA similar line was found: "' + foundLine.trim().substring(0, 80) + '..."'; break; }
      }
    }
    return { content: [{ type: 'text', text: 'Error: String to replace not found in file.\n\nSearch string: ' + oldString.substring(0, 200) + (oldString.length > 200 ? '...' : '') + suggestion }], isError: true, errorCode: 8 };
  }
  const occurrences = originalContent.split(actualOldString).length - 1;
  const replaceAll = options?.replaceAll ?? false;
  if (occurrences > 1 && !replaceAll) {
    return { content: [{ type: 'text', text: 'Error: Found ' + occurrences + ' occurrences of the string to replace, but replace_all is false. Set replace_all to true to replace all occurrences.' }], isError: true, errorCode: 9 };
  }
  const newContent = replaceAll ? originalContent.replaceAll(actualOldString, newString) : originalContent.replace(actualOldString, newString);
  try { fs.writeFileSync(resolvedPath, newContent, 'utf8'); } catch (error) {
    return { content: [{ type: 'text', text: 'Error: Failed to write file: ' + (error instanceof Error ? error.message : String(error)) }], isError: true, errorCode: 10 };
  }
  const diff = generateDiff(originalContent, newContent, resolvedPath);
  const linesChanged = newContent.split('\n').length - originalContent.split('\n').length;
  return { content: [{ type: 'text', text: 'File edited successfully: ' + resolvedPath + '\n\n' + diff }], metadata: { type: 'update', filePath: resolvedPath, occurrencesReplaced: replaceAll ? occurrences : 1, linesChanged } };
}

export const EditTool: ToolDefinition = {
  name: 'edit',
  description: 'Edit a file by replacing a specific string with new content. Requires the file to exist and the old_string to match exactly. Use replace_all to replace multiple occurrences.',
  inputSchema: editInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return editFile(input.file_path as string, input.old_string as string, input.new_string as string, { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false }, { replaceAll: input.replace_all as boolean | undefined });
  },
};
