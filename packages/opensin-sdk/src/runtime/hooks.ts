import { spawn } from 'child_process';

export interface HookCommandOutcome {
  type: 'allow' | 'deny' | 'warn';
  message?: string;
}

export interface HookRunResult {
  success: boolean;
  messages: string[];
}

export function formatHookWarning(
  command: string,
  code: number,
  message?: string,
  stderr?: string
): string {
  return `Hook \`${command}\` exited with code ${code}${message ? `: ${message}` : ''}${stderr ? `\nstderr: ${stderr}` : ''}`;
}

export async function runShellCommand(
  shellCommand: string,
  shellArgs: string[],
  env: Record<string, string>
): Promise<HookCommandOutcome> {
  return new Promise<HookCommandOutcome>((resolve) => {
    const child = spawn(shellCommand || 'sh', shellArgs, {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => { stdout += data.toString(); });
    }
    if (child.stderr) {
      child.stderr.on('data', (data) => { stderr += data.toString(); });
    }

    child.on('close', (code) => {
      const message = stdout.trim() || undefined;
      if (code === 0) {
        resolve({ type: 'allow', message });
      } else if (code === 2) {
        resolve({ type: 'deny', message });
      } else if (code !== null) {
        resolve({
          type: 'warn',
          message: formatHookWarning(shellCommand, code, message, stderr),
        });
      } else {
        resolve({
          type: 'warn',
          message: `Hook \`${shellCommand}\` terminated by signal`,
        });
      }
    });

    child.on('error', (error) => {
      resolve({
        type: 'warn',
        message: `Hook \`${shellCommand}\` failed to start: ${error.message}`,
      });
    });
  });
}
