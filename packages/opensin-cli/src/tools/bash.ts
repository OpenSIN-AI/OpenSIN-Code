import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ToolDefinition, ToolExecutionResult } from '../core/types.js';
import { maskSecrets, truncate } from '../utils/helpers.js';

const execFileAsync = promisify(execFile);

const DANGEROUS_COMMANDS = [
  /\brm\s+(-rf?|--no-preserve-root)\s+\/\s*$/,
  /\bmkfs\b/,
  /\bdd\s+.*of=\/dev\//,
  /:\(\)\s*\{\s*:\|:\s*&\s*\}\s*;/,
];

export class BashTool implements ToolDefinition {
  name = 'Bash';
  description = 'Execute shell commands. Supports background mode. Dangerous commands are blocked.';
  parameters = {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The shell command to execute' },
      timeout: { type: 'number', description: 'Timeout in seconds (default: 120)', default: 120 },
      background: { type: 'boolean', description: 'Run in background', default: false },
    },
    required: ['command'],
  };

  async execute(input: Record<string, unknown>): Promise<ToolExecutionResult> {
    const command = input.command as string;
    const timeout = (input.timeout as number) || 120;
    const background = input.background as boolean || false;

    for (const pattern of DANGEROUS_COMMANDS) {
      if (pattern.test(command)) {
        return { output: `Blocked dangerous command: ${command}`, isError: true };
      }
    }

    if (background) {
      execFile('/bin/sh', ['-c', command], { timeout: timeout * 1000 }).unref();
      return { output: `Command started in background: ${command}`, metadata: { background: true } };
    }

    try {
      const { stdout, stderr } = await execFileAsync('/bin/sh', ['-c', command], {
        timeout: timeout * 1000,
        maxBuffer: 1024 * 1024,
      });

      let output = stdout;
      if (stderr) output += stderr;
      output = maskSecrets(output);
      output = truncate(output, 50000);
      return { output, metadata: { exitCode: 0 } };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; code?: number };
      let output = '';
      if (err.stdout) output += err.stdout;
      if (err.stderr) output += err.stderr;
      output = maskSecrets(output || String(error));
      output = truncate(output, 50000);
      return { output, isError: true, metadata: { exitCode: err.code ?? 1 } };
    }
  }
}
