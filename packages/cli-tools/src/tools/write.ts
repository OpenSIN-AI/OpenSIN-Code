/**
 * Write Tool - File Creation
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { validateFilePath, isProtectedPath, ensureDirectoryExists } from '../security.js';

export const MAX_FILE_WRITE_SIZE = 10 * 1024 * 1024;

export const writeInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    file_path: { type: 'string', description: 'The absolute or relative path to the file to write' },
    content: { type: 'string', description: 'The content to write to the file' },
  },
  required: ['file_path', 'content'],
  additionalProperties: false,
};

export async function writeFile(filePath: string, content: string, context: SecurityContext): Promise<ToolResult> {
  if (content === undefined || content === null) {
    return { content: [{ type: 'text', text: 'Error: Content is required' }], isError: true, errorCode: 1 };
  }
  const contentBytes = Buffer.byteLength(content, 'utf8');
  if (contentBytes > MAX_FILE_WRITE_SIZE) {
    return { content: [{ type: 'text', text: 'Error: Content too large (' + (contentBytes / 1024 / 1024).toFixed(1) + 'MB). Maximum: 10MB.' }], isError: true, errorCode: 2 };
  }
  let resolvedPath: string;
  try { resolvedPath = path.resolve(context.cwd, filePath); } catch {
    return { content: [{ type: 'text', text: 'Error: Invalid file path: ' + filePath }], isError: true, errorCode: 3 };
  }
  const permission = validateFilePath(resolvedPath, context);
  if (!permission.allowed) {
    return { content: [{ type: 'text', text: 'Error: ' + permission.reason }], isError: true, errorCode: permission.errorCode ?? 4 };
  }
  if (isProtectedPath(resolvedPath)) {
    return { content: [{ type: 'text', text: 'Error: Cannot write to protected path: ' + resolvedPath }], isError: true, errorCode: 5 };
  }
  let isUpdate = false;
  try { fs.readFileSync(resolvedPath, 'utf8'); isUpdate = true; } catch { isUpdate = false; }
  const dir = path.dirname(resolvedPath);
  const dirResult = await ensureDirectoryExists(dir, context);
  if (!dirResult.success) {
    return { content: [{ type: 'text', text: 'Error: ' + dirResult.error }], isError: true, errorCode: 6 };
  }
  try { fs.writeFileSync(resolvedPath, content, 'utf8'); } catch (error) {
    return { content: [{ type: 'text', text: 'Error: Failed to write file: ' + (error instanceof Error ? error.message : String(error)) }], isError: true, errorCode: 7 };
  }
  const lineCount = content.split('\n').length;
  const operationType = isUpdate ? 'update' : 'create';
  const message = isUpdate ? 'File updated successfully: ' + resolvedPath : 'File created successfully: ' + resolvedPath;
  return { content: [{ type: 'text', text: message }], metadata: { type: operationType, filePath: resolvedPath, lineCount, sizeBytes: contentBytes } };
}

export const WriteTool: ToolDefinition = {
  name: 'write',
  description: 'Create a new file or overwrite an existing file with the given content. Parent directories are created automatically.',
  inputSchema: writeInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return writeFile(input.file_path as string, input.content as string, { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false });
  },
};
