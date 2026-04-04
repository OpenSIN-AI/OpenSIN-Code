/**
 * Bash Tool - Command Execution
 */

import { exec } from 'child_process';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { isCommandSafe } from '../security.js';

export const DEFAULT_BASH_TIMEOUT_MS = 30000;
export const MAX_BASH_TIMEOUT_MS = 120000;
export const MAX_OUTPUT_SIZE = 50000;

export const bashInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    command: { type: 'string', description: 'The shell command to execute' },
    timeout: { type: 'number', description: 'Timeout in milliseconds. Default: 30000', minimum: 1000 },
    cwd: { type: 'string', description: 'Working directory for the command' },
  },
  required: ['command'],
  additionalProperties: false,
};

const DANGEROUS_PATTERNS = [
  'rm -rf /', 'rm -rf /*', ':(){:|:&};:', 'mkfs',
  'dd if=/dev/zero', 'chmod -R 777 /', 'chown -R',
];

function isDangerousCommand(command: string): boolean {
  const trimmed = command.trim();
  for (const pattern of DANGEROUS_PATTERNS) {
    if (trimmed.includes(pattern)) return true;
  }
  if (/:\(\)\{.*\|.*&.*\};/.test(trimmed)) return true;
  if (/rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+\/\s*$/.test(trimmed)) return true;
  return false;
}

export async function executeCommand(
  command: string,
  context: SecurityContext,
  options?: { timeout?: number; cwd?: string },
): Promise<ToolResult> {
  if (!command || !command.trim()) {
    return { output: 'Error: Empty command provided', isError: true, errorCode: 1 };
  }

  if (isDangerousCommand(command)) {
    return { output: `Error: Command contains dangerous pattern and was blocked: ${command}`, isError: true, errorCode: 2 };
  }

  const permission = isCommandSafe(command);
  if (!permission.allowed) {
    return { output: `Error: ${permission.reason}`, isError: true, errorCode: permission.errorCode ?? 3 };
  }

  const timeout = Math.min(options?.timeout ?? DEFAULT_BASH_TIMEOUT_MS, MAX_BASH_TIMEOUT_MS);
  const cwd = options?.cwd || context.cwd;

  return new Promise((resolve) => {
    exec(command, { timeout, cwd, maxBuffer: MAX_OUTPUT_SIZE }, (error, stdout, stderr) => {
      if (error) {
        if ((error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
          resolve({ output: `Error: Command timed out after ${timeout}ms`, isError: true, errorCode: 5, metadata: { command } });
          return;
        }
        const exitCode = (error as any).code === 127 ? 127 : (error as any).code || 1;
        const out = (stdout ?? '').trimEnd();
        const err = (stderr ?? '').trimEnd();
        let errorMessage = err || out || `Command failed with exit code ${exitCode}`;
        if (errorMessage.length > MAX_OUTPUT_SIZE) {
          errorMessage = errorMessage.substring(0, MAX_OUTPUT_SIZE) + '\n\n[Output truncated]';
        }
        resolve({ output: errorMessage, isError: true, errorCode: exitCode, metadata: { command } });
        return;
      }

      const trimmedStdout = (stdout ?? '').trimEnd();
      const trimmedStderr = (stderr ?? '').trimEnd();
      const parts: string[] = [];
      if (trimmedStdout) parts.push(trimmedStdout);
      if (trimmedStderr) parts.push(`[stderr]\n${trimmedStderr}`);
      if (parts.length === 0) parts.push('Command completed successfully (no output)');

      resolve({
        output: parts.join('\n\n'),
        isError: false,
        metadata: { exitCode: 0, stdoutLength: trimmedStdout.length, stderrLength: trimmedStderr.length, command },
      });
    });
  });
}

export const BashTool: ToolDefinition = {
  name: 'bash',
  description: 'Execute a shell command with security checks and timeout handling.',
  inputSchema: bashInputSchema,
  execute: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return executeCommand(
      input.command as string,
      { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false },
      { timeout: input.timeout as number | undefined, cwd: input.cwd as string | undefined },
    );
  },
};
