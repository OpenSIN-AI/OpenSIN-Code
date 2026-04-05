import { statSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';

export class GlobTool implements ToolDefinition {
  name = 'Glob';
  description = 'Find files matching glob patterns. Supports **, *, ?, and [seq] patterns.';
  parameters = {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Glob pattern (e.g., "**/*.ts", "src/**/*.tsx")' },
      path: { type: 'string', description: 'Directory to search in (default: current directory)' },
      ignore: { type: 'string', description: 'Glob pattern to exclude' },
    },
    required: ['pattern'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const pattern = input.pattern as string;
    const searchPath = input.path ? resolve(input.path as string) : process.cwd();
    const ignore = input.ignore as string | undefined;

    try {
      const { glob } = await import('glob');
      const files = await glob(pattern, {
        cwd: searchPath,
        nodir: false,
        ignore: ignore ? [ignore, '**/node_modules/**', '**/.git/**'] : ['**/node_modules/**', '**/.git/**'],
        absolute: true,
      });

      const relativeFiles = files.map((f) => relative(searchPath, f));

      return {
        output: relativeFiles.join('\n') || 'No files found',
        metadata: { count: files.length, searchPath },
      };
    } catch (error) {
      return {
        output: `Glob error: ${error instanceof Error ? error.message : String(error)}`,
        isError: true,
      };
    }
  }
}
