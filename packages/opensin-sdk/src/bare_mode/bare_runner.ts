import { BareModeConfig, BareModeResult } from './types';
import { getBareModeConfig } from './config';

export class BareRunner {
  private config: BareModeConfig;

  constructor(config?: Partial<BareModeConfig>) {
    this.config = { ...getBareModeConfig(), ...config };
  }

  async run(prompt: string, execute: (p: string) => Promise<string>): Promise<BareModeResult> {
    const start = Date.now();
    const effectivePrompt = this.config.minimalPrompt
      ? prompt.trim()
      : prompt;

    const output = await execute(effectivePrompt);
    const duration = Date.now() - start;

    return {
      output: this.config.rawOutput ? output : output.trim(),
      tokensUsed: output.length / 4,
      duration,
    };
  }

  formatOutput(result: BareModeResult): string {
    if (this.config.noBranding) {
      return result.output;
    }
    return result.output;
  }
}
