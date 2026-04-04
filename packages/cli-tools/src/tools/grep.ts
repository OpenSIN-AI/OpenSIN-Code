/**
 * Grep Tool - Content Search
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { isPathSafe } from '../security.js';

export const DEFAULT_GREP_LIMIT = 100;

export const grepInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: 'The regex pattern to search for' },
    path: { type: 'string', description: 'The directory or file to search in. Default: current directory' },
    include: { type: 'string', description: 'Glob pattern to filter files (e.g. "*.ts", "*.py")' },
    case_sensitive: { type: 'boolean', description: 'Whether the search is case-sensitive. Default: false' },
    offset: { type: 'number', description: 'Skip first N results. Default: 0', minimum: 0 },
    limit: { type: 'number', description: `Maximum results to return. Default: ${DEFAULT_GREP_LIMIT}`, minimum: 1 },
  },
  required: ['pattern'],
  additionalProperties: false,
};

export async function grepContent(
  pattern: string,
  context: SecurityContext,
  options?: { path?: string; include?: string; case_sensitive?: boolean; offset?: number; limit?: number },
): Promise<ToolResult> {
  const searchPath = options?.path || context.cwd;
  const resolvedPath = path.resolve(context.cwd, searchPath);

  const permission = isPathSafe(resolvedPath);
  if (!permission.allowed) {
    return { output: `Error: ${permission.reason}`, isError: true, errorCode: 1 };
  }

  if (!fs.existsSync(resolvedPath)) {
    return { output: `Error: Path not found: ${resolvedPath}`, isError: true, errorCode: 2 };
  }

  const limit = options?.limit ?? DEFAULT_GREP_LIMIT;
  const offset = options?.offset ?? 0;
  const caseFlag = options?.case_sensitive ? '' : '-i';
  const includeFlag = options?.include ? `--include="${options.include}"` : '';

  return new Promise((resolve) => {
    const cmd = `grep -rn ${caseFlag} ${includeFlag} --no-messages --line-buffered -m ${offset + limit} "${pattern.replace(/"/g, '\\"')}" "${resolvedPath}" 2>/dev/null`;
    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error && (error as NodeJS.ErrnoException).code !== 'ENOENT' && (error as any).code !== 1) {
        resolve({ output: `Error: grep failed: ${(error as Error).message}`, isError: true, errorCode: 3 });
        return;
      }

      const lines = stdout.trim().split('\n').filter(Boolean);
      const totalMatches = lines.length;

      if (totalMatches === 0) {
        resolve({ output: `No matches found for pattern: ${pattern}`, isError: false, metadata: { pattern, searchPath, totalMatches: 0 } });
        return;
      }

      const slicedLines = lines.slice(offset, offset + limit);
      const output = slicedLines.join('\n');

      let result = output;
      if (offset + limit < totalMatches) {
        result += `\n\n[Showing ${slicedLines.length} of ${totalMatches} matches. Use offset=${offset + limit} for more.]`;
      }

      resolve({
        output: result,
        isError: false,
        metadata: { pattern, searchPath, totalMatches, shown: slicedLines.length, offset },
      });
    });
  });
}

export const GrepTool: ToolDefinition = {
  name: 'grep',
  description: 'Search for a regex pattern in files. Supports glob filtering, case sensitivity, and pagination.',
  inputSchema: grepInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return grepContent(
      input.pattern as string,
      { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false },
      {
        path: input.path as string | undefined,
        include: input.include as string | undefined,
        case_sensitive: input.case_sensitive as boolean | undefined,
        offset: input.offset as number | undefined,
        limit: input.limit as number | undefined,
      },
    );
  },
};
