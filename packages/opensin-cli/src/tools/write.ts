import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';

export class WriteTool implements ToolDefinition {
  name = 'Write';
  description = 'Write content to a file. Creates directories if needed. Overwrites existing files.';
  parameters = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to write' },
      content: { type: 'string', description: 'Content to write' },
    },
    required: ['path', 'content'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const filePath = resolve(input.path as string);
    const content = input.content as string;

    try {
      const dir = dirname(filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const tmpPath = filePath + '.sincode.tmp';
      writeFileSync(tmpPath, content, 'utf-8');

      const { renameSync } = await import('node:fs');
      renameSync(tmpPath, filePath);

      return {
        output: `File written: ${filePath} (${content.length} bytes)`,
        metadata: { filePath, bytesWritten: content.length },
      };
    } catch (error) {
      return {
        output: `Error writing file: ${error instanceof Error ? error.message : String(error)}`,
        isError: true,
      };
    }
  }
}
