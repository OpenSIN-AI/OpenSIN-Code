/**
 * Glob Tool - File Pattern Matching
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { isPathSafe } from '../security.js';

export const DEFAULT_GLOB_LIMIT = 100;

export const globInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: 'The glob pattern to match (e.g. "*.ts", "src/**/*.tsx")' },
    path: { type: 'string', description: 'The directory to search in. Default: current directory' },
    offset: { type: 'number', description: 'Skip first N results. Default: 0', minimum: 0 },
    limit: { type: 'number', description: `Maximum results to return. Default: ${DEFAULT_GLOB_LIMIT}`, minimum: 1 },
  },
  required: ['pattern'],
  additionalProperties: false,
};

function globToRegex(pattern: string): RegExp {
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE_STAR___/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regex}$`);
}

function walkDir(dir: string, pattern: RegExp, results: string[], baseDir: string): void {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(baseDir, fullPath);
      if (entry.isDirectory()) {
        if (pattern.test(relPath) || relPath.split('/').some(p => pattern.test(p))) {
          walkDir(fullPath, pattern, results, baseDir);
        } else {
          walkDir(fullPath, pattern, results, baseDir);
        }
      } else if (pattern.test(relPath)) {
        results.push(relPath);
      }
    }
  } catch { /* skip unreadable dirs */ }
}

export async function globFiles(
  pattern: string,
  context: SecurityContext,
  options?: { path?: string; offset?: number; limit?: number },
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

  const regex = globToRegex(pattern);
  const results: string[] = [];
  walkDir(resolvedPath, regex, results, resolvedPath);

  const totalMatches = results.length;
  if (totalMatches === 0) {
    return { output: `No files matched pattern: ${pattern}`,
    isError: false, metadata: { pattern, searchPath, totalMatches: 0 } };
  }

  const limit = options?.limit ?? DEFAULT_GLOB_LIMIT;
  const offset = options?.offset ?? 0;
  const sliced = results.slice(offset, offset + limit);

  let output = sliced.join('\n');
  if (offset + limit < totalMatches) {
    output += `\n\n[Showing ${sliced.length} of ${totalMatches} matches. Use offset=${offset + limit} for more.]`;
  }

  return {
    output,
    isError: false,
    metadata: { pattern, searchPath, totalMatches, shown: sliced.length, offset },
  };
}

export const GlobTool: ToolDefinition = {
  name: 'glob',
  description: 'Find files matching a glob pattern. Supports ** for recursive matching.',
  inputSchema: globInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return globFiles(
      input.pattern as string,
      { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false },
      {
        path: input.path as string | undefined,
        offset: input.offset as number | undefined,
        limit: input.limit as number | undefined,
      },
    );
  },
};
