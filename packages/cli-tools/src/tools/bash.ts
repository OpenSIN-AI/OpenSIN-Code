/**
 * Bash Tool - Command Execution
 * 
 * Executes shell commands with security checks, timeout handling,
 * and structured output formatting.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { ToolDefinition, ToolResult, SecurityContext } from '../types.js';
import { checkCommandPermission, isDangerousCommand } from '../security.js';

const execAsync = promisify(exec);

export const DEFAULT_BASH_TIMEOUT_MS = 30_000;
export const MAX_BASH_TIMEOUT_MS = 300_000;
export const MAX_OUTPUT_SIZE = 100 * 1024;

export const bashInputSchema: ToolDefinition['inputSchema'] = {
  type: 'object',
  properties: {
    command: { type: 'string', description: 'The shell command to execute' },
    timeout: { type: 'number', description: `Timeout in milliseconds (default: ${DEFAULT_BASH_TIMEOUT_MS}, max: ${MAX_BASH_TIMEOUT_MS})` },
    description: { type: 'string', description: 'Clear, concise description of what this command does' },
    cwd: { type: 'string', description: 'Working directory for command execution' },
  },
  required: ['command'],
  additionalProperties: false,
};

export async function executeCommand(
  command: string,
  context: SecurityContext,
  options?: { timeout?: number; cwd?: string },
): Promise<ToolResult> {
  if (!command || !command.trim()) {
    return { content: [{ type: 'text', text: 'Error: Empty command provided' }], isError: true, errorCode: 1 };
  }

  if (isDangerousCommand(command)) {
    return { content: [{ type: 'text', text: `Error: Command contains dangerous pattern and was blocked: ${command}` }], isError: true, errorCode: 2 };
  }

  const permission = checkCommandPermission(command, context);
  if (!permission.allowed) {
    return { content: [{ type: 'text', text: `Error: ${permission.reason}` }], isError: true, errorCode: permission.errorCode ?? 3 };
  }

  const timeout = Math.min(options?.timeout ?? DEFAULT_BASH_TIMEOUT_MS, MAX_BASH_TIMEOUT_MS);
  const cwd = options?.cwd ?? context.cwd;

  try {
    const { stdout, stderr } = await execAsync(command, { timeout, cwd, maxBuffer: MAX_OUTPUT_SIZE, env: { ...process.env } });
    const trimmedStdout = stdout.trimEnd();
    const trimmedStderr = stderr.trimEnd();
    const parts: string[] = [];
    if (trimmedStdout) parts.push(trimmedStdout);
    if (trimmedStderr) parts.push(`[stderr]\n${trimmedStderr}`);
    if (parts.length === 0) parts.push('Command completed successfully (no output)');

    return {
      content: [{ type: 'text', text: parts.join('\n\n') }],
      metadata: { exitCode: 0, stdoutLength: trimmedStdout.length, stderrLength: trimmedStderr.length, command },
    };
  } catch (error) {
    const err = error as { code?: string; signal?: string; stdout?: string; stderr?: string; killed?: boolean };
    let errorMessage: string;
    let errorCode = 4;

    if (err.killed) {
      errorMessage = `Error: Command was killed after timeout (${timeout}ms)\nCommand: ${command}`;
      errorCode = 5;
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ERR_CHILD_PROCESS_TIMEOUT') {
      errorMessage = `Error: Command timed out after ${timeout}ms\nCommand: ${command}`;
      errorCode = 5;
    } else if (err.code === 'ERR_CHILD_PROCESS_STDOUT_MAXBUFFER' || err.code === 'ENOBUFS') {
      const stdout = err.stdout ?? '';
      const stderr = err.stderr ?? '';
      const truncated = stdout.length > MAX_OUTPUT_SIZE ? stdout.substring(0, MAX_OUTPUT_SIZE) + '\n\n[Output truncated]' : stdout;
      return { content: [{ type: 'text', text: `${truncated}${stderr ? `\n\n[stderr]\n${stderr}` : ''}` }], isError: true, errorCode: 6, metadata: { command, truncated: true } };
    } else {
      const stdout = (err.stdout ?? '').trimEnd();
      const stderr = (err.stderr ?? '').trimEnd();
      const parts: string[] = [];
      if (stdout) parts.push(stdout);
      if (stderr) parts.push(stderr);
      errorMessage = parts.length > 0 ? parts.join('\n\n') : `Error: Command failed\nCommand: ${command}`;
    }

    return { content: [{ type: 'text', text: errorMessage }], isError: true, errorCode, metadata: { command } };
  }
}

export const BashTool: ToolDefinition = {
  name: 'bash',
  description: 'Execute a shell command with security checks and timeout handling. Use for running CLI tools, scripts, git operations, package managers, and any terminal command.',
  inputSchema: bashInputSchema,
  handler: async (input: Record<string, unknown>): Promise<ToolResult> => {
    return executeCommand(input.command as string, { cwd: process.cwd(), permissionMode: 'auto', sandboxEnabled: false }, { timeout: input.timeout as number | undefined, cwd: input.cwd as string | undefined });
  },
};
