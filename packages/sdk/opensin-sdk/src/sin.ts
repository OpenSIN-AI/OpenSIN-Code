import { execa } from 'execa';

export interface SINOptions {
  model?: string;
  fallback?: string;
  timeout?: number;
  format?: 'json' | 'text';
}

export class SIN {
  private options: Required<SINOptions>;

  constructor(options: SINOptions = {}) {
    this.options = {
      model: options.model ?? 'auto',
      fallback: options.fallback ?? 'openai/gpt-5.4',
      timeout: options.timeout ?? 120000,
      format: options.format ?? 'json',
    };
  }

  async chat(prompt: string, options?: SINOptions): Promise<string> {
    const opts = { ...this.options, ...options };
    const cmd = ['sincode', 'run', prompt, '--format', opts.format];
    if (opts.model !== 'auto') cmd.push('--model', opts.model);

    try {
      const { stdout } = await execa(cmd[0], cmd.slice(1), { timeout: opts.timeout });
      if (opts.format === 'json') {
        const lines = stdout.split('\n').filter(l => l.trim());
        const parts: string[] = [];
        for (const line of lines) {
          try {
            const ev = JSON.parse(line);
            if (ev.type === 'text') parts.push(ev.part?.text ?? '');
          } catch { /* skip non-json */ }
        }
        return parts.join('').trim();
      }
      return stdout.trim();
    } catch (error: any) {
      if (opts.fallback && error.exitCode !== 0) {
        console.warn(`Primary model failed, trying fallback: ${opts.fallback}`);
        return this.chat(prompt, { ...opts, model: opts.fallback });
      }
      throw error;
    }
  }
}
