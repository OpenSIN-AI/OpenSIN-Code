import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';
import { truncate } from '../utils/helpers.js';

export class GrepTool implements ToolDefinition {
  name = 'Grep';
  description = 'Search file contents using regex. Supports content, files_with_matches, and count output modes.';
  parameters = {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Search pattern (literal string or regex)' },
      path: { type: 'string', description: 'Directory or file to search in (default: current directory)' },
      include: { type: 'string', description: 'Glob pattern for files to include (e.g., "*.ts")' },
      exclude: { type: 'string', description: 'Glob pattern for files to exclude' },
      outputMode: { type: 'string', enum: ['content', 'files_with_matches', 'count'], description: 'Output mode', default: 'content' },
      contextLines: { type: 'number', description: 'Lines of context before/after match', default: 0 },
      maxResults: { type: 'number', description: 'Maximum number of results', default: 100 },
      useRegex: { type: 'boolean', description: 'Treat pattern as regex (default: false, uses literal match)', default: false },
    },
    required: ['pattern'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const pattern = input.pattern as string;
    const searchPath = input.path ? resolve(input.path as string) : process.cwd();
    const include = input.include as string | undefined;
    const exclude = input.exclude as string | undefined;
    const outputMode = (input.outputMode as string) || 'content';
    const contextLines = (input.contextLines as number) || 0;
    const maxResults = (input.maxResults as number) || 100;
    const useRegex = (input.useRegex as boolean) || false;

    if (!existsSync(searchPath)) {
      return { output: `Path not found: ${searchPath}`, isError: true };
    }

    let regex: RegExp;
    try {
      if (useRegex) {
        regex = new RegExp(pattern, 'gi');
      } else {
        regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      }
    } catch (e: any) {
      return { output: `Invalid regex pattern: ${e.message}`, isError: true };
    }

    try {
      const { glob } = await import('glob');
      const files = await glob('**/*', {
        cwd: searchPath,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      const filteredFiles = files.filter((f) => {
        if (include && !safeGlobMatch(f, include)) return false;
        if (exclude && safeGlobMatch(f, exclude)) return false;
        return true;
      });

      const results: Array<{ file: string; line: number; content: string }> = [];
      const fileCounts: Record<string, number> = {};

      for (const file of filteredFiles.slice(0, 500)) {
        const fullPath = resolve(searchPath, file);
        const stats = statSync(fullPath);
        if (stats.size > 1024 * 1024) continue;

        try {
          const content = readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            regex.lastIndex = 0;
            if (regex.test(lines[i])) {
              fileCounts[file] = (fileCounts[file] || 0) + 1;

              if (outputMode === 'content' && results.length < maxResults) {
                const start = Math.max(0, i - contextLines);
                const end = Math.min(lines.length - 1, i + contextLines);
                const context = lines.slice(start, end + 1)
                  .map((l, idx) => `${start + idx + 1}: ${l}`)
                  .join('\n');
                results.push({ file, line: i + 1, content: context });
              }
            }
          }
        } catch {
          continue;
        }
      }

      let output: string;
      if (outputMode === 'files_with_matches') {
        output = Object.keys(fileCounts).join('\n');
      } else if (outputMode === 'count') {
        output = Object.entries(fileCounts)
          .map(([file, count]) => `${file}: ${count}`)
          .join('\n');
      } else {
        output = results.map((r) => `${r.file}:${r.line}\n${r.content}`).join('\n---\n');
      }

      output = truncate(output, 50000);
      return { output, metadata: { totalMatches: results.length, filesSearched: filteredFiles.length } };
    } catch (error) {
      return { output: `Grep error: ${error instanceof Error ? error.message : String(error)}`, isError: true };
    }
  }
}

function safeGlobMatch(filePath: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\x00DOUBLE\x00')
    .replace(/\*/g, '[^/]*')
    .replace(/\x00DOUBLE\x00/g, '.*')
    .replace(/\?/g, '.');
  try {
    return new RegExp(`^${regexStr}$`).test(filePath);
  } catch {
    return false;
  }
}
