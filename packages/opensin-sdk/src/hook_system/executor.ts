import { spawn } from 'child_process';
import { HookDefinition, HookResult } from './types';

export async function executeHook(hook: HookDefinition, context?: Record<string, unknown>): Promise<HookResult> {
  return new Promise((resolve) => {
    const env = { ...process.env, OPENCODE_HOOK_ID: hook.id };
    if (context) {
      env.OPENCODE_HOOK_CONTEXT = JSON.stringify(context);
    }

    const child = spawn(hook.command, hook.args || [], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => { stdout += data.toString(); });
    child.stderr?.on('data', (data: Buffer) => { stderr += data.toString(); });

    child.on('exit', (code) => {
      if (code === 0) {
        try {
          resolve({ success: true, output: JSON.parse(stdout) });
        } catch {
          resolve({ success: true, output: stdout.trim() });
        }
      } else {
        resolve({ success: false, error: stderr.trim() || `Exit code: ${code}` });
      }
    });

    child.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    child.stdin.end();
  });
}
