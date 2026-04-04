/**
 * Read Tool - File Reading
 * 
 * Reads file contents with offset/limit support, encoding detection,
 * and security validation.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { validateFilePath, isProtectedPath } from '../security.js';

export const MAX_FILE_READ_SIZE = 1024 * 1024;
export const DEFAULT_READ_LIMIT = 2000;

export const readInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    file_path: { type: 'string', description: 'The absolute or relative path to the file to read' },
    offset: { type: 'number', description: 'The line number to start reading from (1-indexed). Default: 1', minimum: 0 },
    limit: { type: 'number', description: `The number of lines to read. Default: ${DEFAULT_READ_LIMIT}`, minimum: 1 },
  },
  required: ['file_path'],
  additionalProperties: false,
};

function detectEncoding(buffer: Buffer): BufferEncoding {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) return 'utf8';
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) return 'utf16le';
  return 'utf8';
}

function isBinaryFile(buffer: Buffer, sampleSize = 8192): boolean {
  const sample = buffer.slice(0, Math.min(sampleSize, buffer.length));
  let nullBytes = 0;
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) { nullBytes++; if (nullBytes > 2) return true; }
  }
  return false;
}

export async function readFile(
  filePath: string,
  context: SecurityContext,
  options?: { offset?: number; limit?: number },
): Promise<ToolResult> {
  let resolvedPath: string;
  try { resolvedPath = path.resolve(context.cwd, filePath); } catch {
    return { content: [{ type: 'text', text: `Error: Invalid file path: ${filePath}` }], isError: true, errorCode: 1 };
  }

  const permission = validateFilePath(resolvedPath, context);
  if (!permission.allowed) {
    return { content: [{ type: 'text', text: `Error: ${permission.reason}` }], isError: true, errorCode: permission.errorCode ?? 2 };
  }

  if (isProtectedPath(resolvedPath)) {
    return { content: [{ type: 'text', text: `Error: Access to protected path denied: ${resolvedPath}` }], isError: true, errorCode: 3 };
  }

  let stats: fs.Stats;
  try { stats = fs.statSync(resolvedPath); } catch {
    const dir = path.dirname(resolvedPath);
    const base = path.basename(resolvedPath);
    let suggestion = '';
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        const similar = files.find(f => f.toLowerCase().includes(base.toLowerCase()) || base.toLowerCase().includes(f.toLowerCase().replace(/\.[^.]+$/, '')));
        if (similar) suggestion = `\nDid you mean: ${path.join(dir, similar)}?`;
      }
    } catch { /* ignore */ }
    return { content: [{ type: 'text', text: `Error: File not found: ${resolvedPath}${suggestion}` }], isError: true, errorCode: 4 };
  }

  if (stats.isDirectory()) {
    return { content: [{ type: 'text', text: `Error: Path is a directory, not a file: ${resolvedPath}\nUse Glob to list files in this directory.` }], isError: true, errorCode: 5 };
  }

  if (stats.size > MAX_FILE_READ_SIZE) {
    return { content: [{ type: 'text', text: `Error: File too large to read (${(stats.size / 1024 / 1024).toFixed(1)}MB). Maximum: 1MB.\nUse offset and limit parameters to read specific portions.` }], isError: true, errorCode: 6 };
  }

  let buffer: Buffer;
  try { buffer = fs.readFileSync(resolvedPath); } catch (error) {
    return { content: [{ type: 'text', text: `Error: Cannot read file: ${error instanceof Error ? error.message : String(error)}` }], isError: true, errorCode: 7 };
  }

  if (buffer.length === 0) {
    return { content: [{ type: 'text', text: '(File is empty)' }], metadata: { filePath: resolvedPath, totalLines: 0, sizeBytes: 0 } };
  }

  if (isBinaryFile(buffer)) {
    const ext = path.extname(resolvedPath);
    return { content: [{ type: 'text', text: `Error: Cannot read binary file (${ext || 'unknown'} format).` }], isError: true, errorCode: 8 };
  }

  const encoding = detectEncoding(buffer);
  const content = buffer.toString(encoding);
  const lines = content.split('\n');
  const totalLines = lines.length;

  const offset = Math.max(0, (options?.offset ?? 1) - 1);
  const limit = options?.limit ?? DEFAULT_READ_LIMIT;
  const slicedLines = lines.slice(offset, offset + limit);
  const startLine = offset + 1;
  const endLine = Math.min(offset + limit, totalLines);

  const formattedLines = slicedLines.map((line, i) => `${startLine + i}: ${line}`);
  let output = formattedLines.join('\n');
  if (endLine < totalLines) {
    output += `\n\n[Showing lines ${startLine}-${endLine} of ${totalLines}. Use offset=${endLine + 1} to continue.]`;
  }

  return {
    content: [{ type: 'text', text: output }],
    metadata: { filePath: resolvedPath, startLine, endLine, totalLines, sizeBytes: buffer.length, encoding },
  };
}

export const ReadTool: ToolDefinition = {
  name: 'read',
  description: 'Read the contents of a file with optional offset and limit for large files. Shows line numbers and supports partial reads.',
  inputSchema: readInputSchema,
  handler: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return readFile(input.file_path as string, { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false }, { offset: input.offset as number | undefined, limit: input.limit as number | undefined });
  },
};
