import { CopyOptions, CopyResult } from './types';
import { copyToClipboard, formatForClipboard } from './clipboard';

const DEFAULT_OPTIONS: CopyOptions = {
  format: 'plain',
  includeLineNumbers: false,
  includeLanguage: false,
  trimWhitespace: true,
};

export class Copier {
  private options: CopyOptions;

  constructor(options?: Partial<CopyOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async copy(content: string): Promise<CopyResult> {
    let processed = this.options.trimWhitespace ? content.trim() : content;

    if (this.options.includeLineNumbers) {
      processed = processed
        .split('\n')
        .map((line, i) => `${i + 1}: ${line}`)
        .join('\n');
    }

    const formatted = formatForClipboard(processed, this.options.format);
    const success = await copyToClipboard(formatted);

    return {
      success,
      content: formatted,
      length: formatted.length,
    };
  }

  updateOptions(options: Partial<CopyOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
