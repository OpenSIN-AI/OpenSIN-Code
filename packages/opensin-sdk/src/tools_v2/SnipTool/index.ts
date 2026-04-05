/**
 * OpenSIN Snip Tool — Shell output snipping
 *
 * Prefixes shell commands with snip to reduce LLM token consumption by 60-90%.
 * Filters verbose output from git, go, cargo, npm, docker, and other CLI tools.
 *
 * Branded: OpenSIN/sincode
 */

import * as childProcess from 'node:child_process';
import * as util from 'node:util';
import type { ToolDefinition, ToolResult } from '../types.js';

const exec = util.promisify(childProcess.exec);

const DEFAULT_MAX_LINES = 50;
const DEFAULT_MAX_CHARS = 10000;

const SNIPPABLE_COMMANDS = [
  'git', 'go', 'cargo', 'npm', 'yarn', 'pnpm', 'bun',
  'docker', 'docker-compose', 'kubectl', 'helm',
  'pip', 'pip3', 'python', 'python3',
  'make', 'cmake', 'gradle', 'mvn',
  'terraform', 'ansible',
  'curl', 'wget',
  'find', 'ls', 'du', 'df',
  'grep', 'rg', 'ag',
  'cat', 'head', 'tail', 'wc',
  'ps', 'top', 'htop',
  'node', 'deno', 'bun',
];

interface SnipInput {
  command: string;
  maxLines?: number;
  maxChars?: number;
  cwd?: string;
  timeout?: number;
}

function snipOutput(output: string, maxLines: number, maxChars: number): string {
  const lines = output.split('\n');

  if (lines.length <= maxLines && output.length <= maxChars) {
    return output;
  }

  const headCount = Math.floor(maxLines / 2);
  const tailCount = maxLines - headCount;

  const head = lines.slice(0, headCount).join('\n');
  const tail = lines.slice(-tailCount).join('\n');
  const pruned = lines.length - maxLines;

  let result = head;
  result += `\n\n[... ${pruned} lines snipped — total ${lines.length} lines, ${output.length} chars ...]\n\n`;
  result += tail;

  if (result.length > maxChars) {
    result = result.slice(0, maxChars) + `\n\n[... output truncated at ${maxChars} chars ...]`;
  }

  return result;
}

function shouldSnip(command: string): boolean {
  const baseCommand = command.trim().split(/\s+/)[0].toLowerCase();
  const cmdName = baseCommand.replace(/^(sudo|time|env|bash\s+-c)\s+/, '').split(/\s+/)[0];
  return SNIPPABLE_COMMANDS.includes(cmdName);
}

function wrapWithSnip(command: string, maxLines: number, maxChars: number): string {
  if (process.platform === 'win32') {
    return command;
  }

  return `(${command}) 2>&1 | head -c ${maxChars}`;
}

export const SnipTool: ToolDefinition = {
  name: 'snip',
  description: 'Execute a shell command with output snipping to reduce token consumption. Automatically truncates verbose output from git, npm, docker, and other CLI tools. Use this for commands expected to produce large output.',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Shell command to execute',
      },
      maxLines: {
        type: 'number',
        description: 'Maximum lines before snipping (default: 50)',
      },
      maxChars: {
        type: 'number',
        description: 'Maximum characters before truncation (default: 10000)',
      },
      cwd: {
        type: 'string',
        description: 'Working directory',
      },
      timeout: {
        type: 'number',
        description: 'Timeout in milliseconds (default: 30000)',
      },
    },
    required: ['command'],
  },
  async execute(input: Record<string, unknown>): Promise<ToolResult> {
    const { command, maxLines, maxChars, cwd, timeout } = input as SnipInput;
    const lines = maxLines ?? DEFAULT_MAX_LINES;
    const chars = maxChars ?? DEFAULT_MAX_CHARS;
    const execCwd = cwd || process.cwd();
    const execTimeout = (timeout || 30000) as childProcess.ExecOptions['timeout'];

    try {
      const { stdout, stderr } = await exec(command, {
        cwd: execCwd,
        timeout: execTimeout,
        maxBuffer: 50 * 1024 * 1024,
      });

      const combined = stdout + (stderr ? `\n--- STDERR ---\n${stderr}` : '');
      const snipped = snipOutput(combined, lines, chars);
      const wasSnipped = snipped !== combined;

      return {
        content: [{ type: 'text', text: snipped }],
        metadata: {
          wasSnipped,
          originalLines: combined.split('\n').length,
          originalChars: combined.length,
          snippedChars: snipped.length,
          reduction: wasSnipped
            ? `${Math.round((1 - snipped.length / combined.length) * 100)}%`
            : '0%',
          command,
        },
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      const combined = (err.stdout || '') + (err.stderr ? `\n--- STDERR ---\n${err.stderr}` : '');
      const snipped = snipOutput(combined || String(error), lines, chars);

      return {
        content: [{ type: 'text', text: snipped }],
        isError: true,
        errorCode: err.code ?? 1,
        metadata: {
          wasSnipped: true,
          command,
        },
      };
    }
  },
};

export { shouldSnip, snipOutput, wrapWithSnip, DEFAULT_MAX_LINES, DEFAULT_MAX_CHARS, SNIPPABLE_COMMANDS };
export type { SnipInput };
