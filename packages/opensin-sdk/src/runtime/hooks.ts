import { spawn } from 'child_process';

export interface HookCommandOutcome {
  type: 'allow' | 'deny' | 'warn';
  message?: string;
}

export interface HookRunResult {
  success: boolean;
  messages: string[];
}

export function formatHookWarning(command: string, code: number, message?: string, stderr?: string): string {
  return `Hook \`${command}\` exited with code ${code}${message ? `: ${message}` : ''}`;
}

export async function runShellCommand(shellCommand: string, shellArgs: string[], env: Record<string, string>): Promise<HookCommandOutcome> {
  return new Promise<HookCommandOutcome>((resolve) => {
    const child = spawn(shellCommand || 'sh', shellArgs, { env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    if (child.stdout) child.stdout.on('data', (d) => { stdout += d.toString(); });
    if (child.stderr) child.stderr.on('data', (d) => { stderr += d.toString(); });
    child.on('close', (code) => {
      if (code === 0) resolve({ type: 'allow', message: stdout.trim() || undefined });
      else if (code === 2) resolve({ type: 'deny', message: stdout.trim() || undefined });
      else resolve({ type: 'warn', message: formatHookWarning(shellCommand, code ?? -1, stdout.trim() || undefined, stderr) });
    });
    child.on('error', (error) => {
      resolve({ type: 'warn', message: `Hook failed to start: ${error.message}` });
    });
  });
}
