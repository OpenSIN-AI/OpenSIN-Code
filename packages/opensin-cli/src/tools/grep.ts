import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';
import { truncate } from '../utils/helpers.js';

export class GrepTool implements ToolDefinition {
  name = 'Grep';
  description = 'Search file contents using regex. Supports content, files_with_matches, and count output modes.';
  parameters = {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Regex pattern to search for' },
      path: { type: 'string', description: 'Directory or file to search in (default: current directory)' },
      include: { type: 'string', description: 'Glob pattern for files to include (e.g., "*.ts")' },
      exclude: { type: 'string', description: 'Glob pattern for files to exclude' },
      outputMode: { type: 'string', enum: ['content', 'files_with_matches', 'count'], description: 'Output mode', default: 'content' },
      contextLines: { type: 'number', description: 'Lines of context before/after match', default: 0 },
      maxResults: { type: 'number', description: 'Maximum number of results', default: 100 },
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

    if (!existsSync(searchPath)) {
      return { output: `Path not found: ${searchPath}`, isError: true };
    }

    try {
      const { glob } = await import('glob');
      const files = await glob('**/*', {
        cwd: searchPath,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
      });

      const filteredFiles = files.filter((f) => {
        if (include && !matchesGlob(f, include)) return false;
        if (exclude && matchesGlob(f, exclude)) return false;
        return true;
      });

      const regex = new RegExp(pattern, 'gi');
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
            if (regex.test(lines[i])) {
              regex.lastIndex = 0;
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

function matchesGlob(filePath: string, pattern: string): boolean {
  const regex = pattern
    .replace(/\*\*/g, '___DOUBLE___')
    .replace(/\*/g, '[^/]*')
    .replace(/___DOUBLE___/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regex}$`).test(filePath);
}
