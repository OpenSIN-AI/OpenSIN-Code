import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';

export class EditTool implements ToolDefinition {
  name = 'Edit';
  description = 'Replace text in a file. Supports literal and regex mode. Use replaceAll for multiple occurrences.';
  parameters = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'File path to edit' },
      oldString: { type: 'string', description: 'Text to find and replace' },
      newString: { type: 'string', description: 'Replacement text' },
      replaceAll: { type: 'boolean', description: 'Replace all occurrences', default: false },
      useRegex: { type: 'boolean', description: 'Treat oldString as regex', default: false },
    },
    required: ['path', 'oldString', 'newString'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const filePath = resolve(input.path as string);
    const oldString = input.oldString as string;
    const newString = input.newString as string;
    const replaceAll = input.replaceAll as boolean || false;
    const useRegex = input.useRegex as boolean || false;

    if (!existsSync(filePath)) {
      return { output: `File not found: ${filePath}`, isError: true };
    }

    try {
      const content = readFileSync(filePath, 'utf-8');

      let newContent: string;
      if (useRegex) {
        const flags = replaceAll ? 'g' : '';
        const regex = new RegExp(oldString, flags + 's');
        newContent = content.replace(regex, newString);
      } else {
        if (replaceAll) {
          newContent = content.split(oldString).join(newString);
        } else {
          const idx = content.indexOf(oldString);
          if (idx === -1) {
            return { output: `String not found in ${filePath}`, isError: true };
          }
          newContent = content.slice(0, idx) + newString + content.slice(idx + oldString.length);
        }
      }

      if (newContent === content) {
        return { output: `No changes made — string not found in ${filePath}`, isError: true };
      }

      writeFileSync(filePath, newContent, 'utf-8');

      const addedLines = newString.split('\n').length - oldString.split('\n').length;
      return {
        output: `File edited: ${filePath} (${addedLines > 0 ? '+' : ''}${addedLines} lines)`,
        metadata: { filePath, linesChanged: addedLines },
      };
    } catch (error) {
      return {
        output: `Error editing file: ${error instanceof Error ? error.message : String(error)}`,
        isError: true,
      };
    }
  }
}
