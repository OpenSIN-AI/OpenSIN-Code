import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';
import { truncate } from '../utils/helpers.js';

export class ReadTool implements ToolDefinition {
  name = 'Read';
  description = 'Read file contents. Supports line range selection and handles large files.';
  parameters = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to read' },
      startLine: { type: 'number', description: 'Start line (0-indexed)', default: 0 },
      endLine: { type: 'number', description: 'End line (inclusive, -1 for end)', default: -1 },
    },
    required: ['path'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const filePath = resolve(input.path as string);
    const startLine = (input.startLine as number) ?? 0;
    const endLine = (input.endLine as number) ?? -1;

    if (!existsSync(filePath)) {
      return { output: `File not found: ${filePath}`, isError: true };
    }

    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      return { output: `Path is a directory: ${filePath}`, isError: true };
    }

    if (stats.size > 1024 * 1024) {
      return {
        output: `File too large (${(stats.size / 1024 / 1024).toFixed(1)}MB). Max 1MB.`,
        isError: true,
      };
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const start = Math.max(0, startLine);
      const end = endLine >= 0 ? Math.min(endLine, lines.length - 1) : lines.length - 1;
      const selectedLines = lines.slice(start, end + 1);

      let output = selectedLines
        .map((line, i) => `${start + i + 1}: ${line}`)
        .join('\n');

      output = truncate(output, 50000);

      return {
        output,
        metadata: { totalLines: lines.length, shownLines: selectedLines.length, filePath },
      };
    } catch (error) {
      return { output: `Error reading file: ${error instanceof Error ? error.message : String(error)}`, isError: true };
    }
  }
}
