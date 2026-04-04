/**
 * Grep Tool - Content Search
 * 
 * Searches file contents using regular expressions with
 * support for file filtering, context lines, and output modes.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { validateFilePath, isProtectedPath } from '../security.js';

export const DEFAULT_GREP_LIMIT = 250;
export const MAX_GREP_LIMIT = 10000;

export const EXCLUDED_DIRS = new Set([
  '.git', '.svn', '.hg', '.bzr',
  'node_modules', '.next', '.nuxt', '.output',
  'dist', 'build', 'out',
  '__pycache__', '.pytest_cache', '.mypy_cache',
  'vendor', '.terraform', '.cache', 'coverage', '.nyc_output',
]);

export const grepInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    pattern: { type: 'string', description: 'The regular expression pattern to search for in file contents' },
    path: { type: 'string', description: 'File or directory to search in. Defaults to current working directory.' },
    glob: { type: 'string', description: 'Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}")' },
    output_mode: { type: 'string', enum: ['content', 'files_with_matches', 'count'], description: 'Output mode. Defaults to "files_with_matches".' },
    '-i': { type: 'boolean', description: 'Case insensitive search. Default: false' },
    '-n': { type: 'boolean', description: 'Show line numbers in output. Default: true (for content mode)' },
    head_limit: { type: 'number', description: `Limit output to first N results. Defaults to ${DEFAULT_GREP_LIMIT}. Pass 0 for unlimited.` },
    offset: { type: 'number', description: 'Skip first N results before applying head_limit. Defaults to 0.' },
  },
  required: ['pattern'],
  additionalProperties: false,
};

function matchesGlob(filename: string, pattern: string): boolean {
  const regexPattern = pattern.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.').replace(/\{([^}]+)\}/g, (_, inner) => `(${inner.replace(/,/g, '|')})`);
  return new RegExp(`^${regexPattern}$`).test(filename);
}

function isBinaryBuffer(buffer: Buffer, sampleSize = 8192): boolean {
  const sample = buffer.slice(0, Math.min(sampleSize, buffer.length));
  let nullBytes = 0;
  for (let i = 0; i < sample.length; i++) { if (sample[i] === 0) { nullBytes++; if (nullBytes > 2) return true; } }
  return false;
}

export async function grepSearch(
  pattern: string,
  context: SecurityContext,
  options?: { path?: string; glob?: string; outputMode?: 'content' | 'files_with_matches' | 'count'; caseInsensitive?: boolean; showLineNumbers?: boolean; headLimit?: number; offset?: number },
): Promise<ToolResult> {
  if (!pattern || !pattern.trim()) {
    return { content: [{ type: 'text', text: 'Error: Empty pattern provided' }], isError: true, errorCode: 1 };
  }

  let regex: RegExp;
  try { regex = new RegExp(pattern, options?.caseInsensitive ? 'gi' : 'g'); } catch (error) {
    return { content: [{ type: 'text', text: `Error: Invalid regular expression: ${error instanceof Error ? error.message : String(error)}` }], isError: true, errorCode: 2 };
  }

  const searchPath = options?.path ? path.resolve(context.cwd, options.path) : context.cwd;
  const permission = validateFilePath(searchPath, context);
  if (!permission.allowed) {
    return { content: [{ type: 'text', text: `Error: ${permission.reason}` }], isError: true, errorCode: permission.errorCode ?? 3 };
  }

  let stats: fs.Stats;
  try { stats = fs.statSync(searchPath); } catch {
    return { content: [{ type: 'text', text: `Error: Path does not exist: ${searchPath}` }], isError: true, errorCode: 4 };
  }

  const outputMode = options?.outputMode ?? 'files_with_matches';
  const showLineNumbers = options?.showLineNumbers ?? true;
  const headLimit = options?.headLimit ?? DEFAULT_GREP_LIMIT;
  const offset = options?.offset ?? 0;
  const filesToSearch: string[] = [];

  function collectFiles(dir: string): void {
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.' && entry.name !== '..') continue;
      if (entry.isDirectory()) { collectFiles(fullPath); }
      else if (entry.isFile()) {
        if (options?.glob && !matchesGlob(entry.name, options.glob)) continue;
        try {
          const fileStats = fs.statSync(fullPath);
          if (fileStats.size > 10 * 1024 * 1024) continue;
          const buffer = fs.readFileSync(fullPath);
          if (isBinaryBuffer(buffer)) continue;
        } catch { continue; }
        filesToSearch.push(fullPath);
      }
    }
  }

  if (stats.isFile()) filesToSearch.push(searchPath);
  else if (stats.isDirectory()) collectFiles(searchPath);

  const results: Array<{ file: string; line: number; content: string }> = [];
  const filesWithMatches = new Set<string>();
  const fileCounts = new Map<string, number>();

  for (const file of filesToSearch) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].match(regex);
        if (matches) {
          filesWithMatches.add(file);
          fileCounts.set(file, (fileCounts.get(file) ?? 0) + matches.length);
          if (outputMode === 'content') results.push({ file, line: i + 1, content: lines[i] });
        }
      }
    } catch { continue; }
  }

  const effectiveLimit = headLimit === 0 ? Infinity : headLimit;

  if (outputMode === 'content') {
    const slicedResults = results.slice(offset, offset + effectiveLimit);
    const lines = slicedResults.map(r => {
      const relPath = path.relative(context.cwd, r.file);
      return showLineNumbers ? `${relPath}:${r.line}: ${r.content}` : `${relPath}: ${r.content}`;
    });
    const output = lines.join('\n') || 'No matches found';
    const truncated = results.length > offset + effectiveLimit;
    return {
      content: [{ type: 'text', text: truncated ? `${output}\n\n[Results truncated. Use offset=${offset + effectiveLimit} for more.]` : output }],
      metadata: { mode: 'content', totalMatches: results.length, filesSearched: filesToSearch.length, filesWithMatches: filesWithMatches.size },
    };
  }

  if (outputMode === 'count') {
    const entries = Array.from(fileCounts.entries()).sort((a, b) => b[1] - a[1]).slice(offset, offset + effectiveLimit);
    const lines = entries.map(([file, count]) => `${path.relative(context.cwd, file)}:${count}`);
    const totalMatches = Array.from(fileCounts.values()).reduce((a, b) => a + b, 0);
    return {
      content: [{ type: 'text', text: lines.join('\n') || 'No matches found' }],
      metadata: { mode: 'count', totalMatches, filesWithMatches: filesWithMatches.size, filesSearched: filesToSearch.length },
    };
  }

  const sortedFiles = Array.from(filesWithMatches).sort();
  const slicedFiles = sortedFiles.slice(offset, offset + effectiveLimit);
  const relFiles = slicedFiles.map(f => path.relative(context.cwd, f));
  const truncated = sortedFiles.length > offset + effectiveLimit;

  if (relFiles.length === 0) {
    return { content: [{ type: 'text', text: 'No files found' }], metadata: { mode: 'files_with_matches', totalFiles: 0, filesSearched: filesToSearch.length } };
  }

  return {
    content: [{ type: 'text', text: `Found ${sortedFiles.length} file${sortedFiles.length === 1 ? '' : 's'}\n${relFiles.join('\n')}${truncated ? `\n\n[Results truncated. Use offset=${offset + effectiveLimit} for more.]` : ''}` }],
    metadata: { mode: 'files_with_matches', totalFiles: sortedFiles.length, filesSearched: filesToSearch.length },
  };
}

export const GrepTool: ToolDefinition = {
  name: 'grep',
  description: 'Search file contents using regular expressions. Supports filtering by glob patterns, case-insensitive search, and multiple output modes (content, files_with_matches, count).',
  inputSchema: grepInputSchema,
  handler: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return grepSearch(input.pattern as string, { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false }, {
      path: input.path as string | undefined, glob: input.glob as string | undefined,
      outputMode: input.output_mode as 'content' | 'files_with_matches' | 'count' | undefined,
      caseInsensitive: input['-i'] as boolean | undefined, showLineNumbers: input['-n'] as boolean | undefined,
      headLimit: input.head_limit as number | undefined, offset: input.offset as number | undefined,
    });
  },
};
