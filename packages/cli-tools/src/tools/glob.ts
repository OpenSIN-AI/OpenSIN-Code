/**
 * Glob Tool - File Pattern Matching
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { validateFilePath, isProtectedPath } from '../security.js';

export const DEFAULT_GLOB_LIMIT = 100;
export const MAX_GLOB_LIMIT = 10000;

export const EXCLUDED_DIRS = new Set(['.git', '.svn', '.hg', '.bzr', 'node_modules', '.next', '.nuxt', '.output', 'dist', 'build', 'out', '__pycache__', '.pytest_cache', '.mypy_cache', 'vendor', '.terraform', '.cache', 'coverage', '.nyc_output']);

export const globInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: 'The glob pattern to match files against (e.g. "**/*.ts", "src/**/*.tsx")' },
    path: { type: 'string', description: 'The directory to search in. Defaults to current working directory.' },
    case_sensitive: { type: 'boolean', description: 'Case sensitive matching. Default: false' },
    head_limit: { type: 'number', description: 'Limit results to first N files. Defaults to 100. Pass 0 for unlimited.' },
  },
  required: ['pattern'],
  additionalProperties: false,
};

function globToRegex(pattern: string): RegExp {
  let regex = pattern.replace(/\./g, '\\.').replace(/\+/g, '\\+').replace(/\^/g, '\\^').replace(/\$/g, '\\$').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/\[/g, '\\[').replace(/\]/g, '\\]').replace(/\*\*\//g, '(?:.+/)?').replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\{([^}]+)\}/g, (_, inner) => '(' + inner.replace(/,/g, '|') + ')').replace(/!/g, '^');
  return new RegExp('^' + regex + '$');
}

export async function globSearch(pattern: string, context: SecurityContext, options?: { path?: string; caseSensitive?: boolean; headLimit?: number }): Promise<ToolResult> {
  if (!pattern || !pattern.trim()) {
    return { content: [{ type: 'text', text: 'Error: Empty pattern provided' }], isError: true, errorCode: 1 };
  }
  const regex = globToRegex(pattern);
  const searchPath = options?.path ? path.resolve(context.cwd, options.path) : context.cwd;
  const permission = validateFilePath(searchPath, context);
  if (!permission.allowed) {
    return { content: [{ type: 'text', text: 'Error: ' + permission.reason }], isError: true, errorCode: permission.errorCode ?? 2 };
  }
  let stats: fs.Stats;
  try { stats = fs.statSync(searchPath); } catch {
    return { content: [{ type: 'text', text: 'Error: Directory does not exist: ' + searchPath }], isError: true, errorCode: 3 };
  }
  if (!stats.isDirectory()) {
    return { content: [{ type: 'text', text: 'Error: Path is not a directory: ' + searchPath }], isError: true, errorCode: 4 };
  }
  const matches: string[] = [];
  const headLimit = options?.headLimit ?? DEFAULT_GLOB_LIMIT;
  const effectiveLimit = headLimit === 0 ? Infinity : headLimit;
  function searchDir(dir: string): void {
    if (matches.length >= effectiveLimit) return;
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (matches.length >= effectiveLimit) return;
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(context.cwd, fullPath);
      if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
      if (entry.isDirectory()) { searchDir(fullPath); }
      else if (entry.isFile()) {
        if (regex.test(relativePath) || regex.test(entry.name)) matches.push(relativePath);
      }
    }
  }
  searchDir(searchPath);
  matches.sort();
  if (matches.length === 0) {
    return { content: [{ type: 'text', text: 'No files found' }], metadata: { pattern, searchPath, totalFiles: 0 } };
  }
  const truncated = matches.length >= effectiveLimit && effectiveLimit !== Infinity;
  const output = matches.join('\n') + (truncated ? '\n\n[Results truncated. Showing ' + matches.length + ' of many matches.]' : '');
  return { content: [{ type: 'text', text: output }], metadata: { pattern, searchPath, totalFiles: matches.length, truncated } };
}

export const GlobTool: ToolDefinition = {
  name: 'glob',
  description: 'Find files matching a glob pattern. Supports ** for recursive matching, * for wildcard, and {a,b} for alternation. Use to quickly locate files by name pattern.',
  inputSchema: globInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return globSearch(input.pattern as string, { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false }, {
      path: input.path as string | undefined, caseSensitive: input.case_sensitive as boolean | undefined, headLimit: input.head_limit as number | undefined,
    });
  },
};
