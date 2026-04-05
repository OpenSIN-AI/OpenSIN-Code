/**
 * OpenSIN Morph Fast Apply — High-speed code editing
 *
 * Integrates Morph's Fast Apply API for faster code editing with
 * lazy edit markers and unified diff output.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawn, ChildProcess } from 'node:child_process';
import type { ToolDefinition, ToolResult } from '../types.js';

interface MorphConfig {
  apiKey: string;
  apiUrl?: string;
  model?: string;
}

interface MorphApplyInput {
  file_path: string;
  edits: Array<{
    oldText: string;
    newText: string;
  }>;
  context_lines?: number;
}

const DEFAULT_API_URL = 'https://api.morph.io/v1';

export class MorphFastApply {
  private config: MorphConfig | null = null;
  private configPath: string;

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, 'morph.json')
      : path.join(os.homedir(), '.opensin', 'morph.json');
  }

  async init(): Promise<boolean> {
    await this.loadConfig();
    return this.config !== null;
  }

  private async loadConfig(): Promise<void> {
    try {
      if (process.env.MORPH_API_KEY) {
        this.config = {
          apiKey: process.env.MORPH_API_KEY,
          apiUrl: process.env.MORPH_API_URL || DEFAULT_API_URL,
          model: process.env.MORPH_MODEL,
        };
        return;
      }

      const raw = await fs.readFile(this.configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.config = {
        apiKey: parsed.apiKey,
        apiUrl: parsed.apiUrl || DEFAULT_API_URL,
        model: parsed.model,
      };
    } catch {
      this.config = null;
    }
  }

  async applyEdits(input: MorphApplyInput): Promise<{ success: boolean; output: string; tokensPerSecond?: number }> {
    if (!this.config) {
      return { success: false, output: 'Morph API key not configured. Set MORPH_API_KEY environment variable.' };
    }

    const startTime = Date.now();
    let totalChars = 0;

    try {
      const content = await fs.readFile(input.file_path, 'utf-8');
      totalChars = content.length;

      const response = await fetch(`${this.config.apiUrl}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: input.file_path,
          content,
          edits: input.edits,
          context_lines: input.context_lines ?? 3,
          model: this.config.model,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, output: `Morph API error: ${response.status} - ${error}` };
      }

      const result = await response.json() as { content?: string; diff?: string };
      const durationMs = Date.now() - startTime;

      if (result.content) {
        await fs.writeFile(input.file_path, result.content, 'utf-8');
      }

      const tokensPerSecond = totalChars > 0 ? Math.round(totalChars / (durationMs / 1000)) : undefined;

      return {
        success: true,
        output: result.diff || `Applied ${input.edits.length} edits to ${input.file_path}`,
        tokensPerSecond,
      };
    } catch (error) {
      return {
        success: false,
        output: `Failed to apply edits: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  async applyDiff(filePath: string, diff: string): Promise<{ success: boolean; output: string }> {
    if (!this.config) {
      return { success: false, output: 'Morph API key not configured' };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/apply-diff`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_path: filePath,
          diff,
        }),
      });

      if (!response.ok) {
        return { success: false, output: `Morph API error: ${response.status}` };
      }

      const result = await response.json() as { content?: string };
      if (result.content) {
        await fs.writeFile(filePath, result.content, 'utf-8');
      }

      return { success: true, output: `Applied diff to ${filePath}` };
    } catch (error) {
      return { success: false, output: `Failed: ${error instanceof Error ? error.message : 'Unknown'}` };
    }
  }
}

export const MorphFastApplyTool: ToolDefinition = {
  name: 'morph_apply',
  description: 'Apply code edits using Morph Fast Apply for high-speed editing. Faster than traditional file editing for large files.',
  inputSchema: {
    type: 'object',
    properties: {
      file_path: { type: 'string', description: 'Path to the file to edit' },
      edits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            oldText: { type: 'string' },
            newText: { type: 'string' },
          },
          required: ['oldText', 'newText'],
        },
      },
      context_lines: { type: 'number', description: 'Lines of context (default: 3)' },
    },
    required: ['file_path', 'edits'],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const morph = new MorphFastApply();
    await morph.init();

    const result = await morph.applyEdits(input as MorphApplyInput);

    return {
      content: [{ type: 'text', text: result.output }],
      isError: !result.success,
      metadata: result.tokensPerSecond ? { tokensPerSecond: result.tokensPerSecond } : undefined,
    };
  },
};

export function createMorphFastApply(configDir?: string): MorphFastApply {
  return new MorphFastApply(configDir);
}
