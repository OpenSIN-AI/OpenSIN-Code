import { ClipboardManager, getClipboardManager } from "./clipboard.js";
import {
  AssistantResponse,
  ClipboardFormat,
  CopyCommandConfig,
  CopyResult,
} from "./types.js";

const DEFAULT_CONFIG: CopyCommandConfig = {
  maxHistory: 100,
  defaultFormat: "text",
  autoTrim: true,
};

export class CopyCommand {
  private history: AssistantResponse[] = [];
  private clipboard: ClipboardManager;
  private config: CopyCommandConfig;

  constructor(config?: Partial<CopyCommandConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.clipboard = getClipboardManager();
  }

  async addResponse(content: string, format?: ClipboardFormat): Promise<number> {
    const response: AssistantResponse = {
      index: this.history.length + 1,
      content: this.config.autoTrim ? content.trim() : content,
      timestamp: new Date().toISOString(),
      format: format ?? this.config.defaultFormat,
    };
    this.history.push(response);

    if (this.history.length > this.config.maxHistory) {
      this.history = this.history.slice(-this.config.maxHistory);
      this.history.forEach((r, i) => (r.index = i + 1));
    }

    return response.index;
  }

  async copyLatest(): Promise<CopyResult> {
    if (this.history.length === 0) {
      return {
        success: false,
        index: 0,
        content: "",
        format: this.config.defaultFormat,
        error: "No assistant responses in history",
      };
    }
    return this.copyNth(this.history.length);
  }

  async copyNth(n: number): Promise<CopyResult> {
    if (n < 1 || n > this.history.length) {
      return {
        success: false,
        index: n,
        content: "",
        format: this.config.defaultFormat,
        error: `Invalid response index: ${n}. History contains ${this.history.length} responses.`,
      };
    }

    const response = this.history[n - 1];
    const success = await this.clipboard.write(response.content, response.format);

    return {
      success,
      index: n,
      content: response.content,
      format: response.format,
      error: success ? undefined : "Failed to write to clipboard",
    };
  }

  getHistory(): AssistantResponse[] {
    return [...this.history];
  }

  getLatest(): AssistantResponse | undefined {
    return this.history.length > 0 ? this.history[this.history.length - 1] : undefined;
  }

  clearHistory(): void {
    this.history = [];
  }

  getHistorySize(): number {
    return this.history.length;
  }
}

let _copyCommand: CopyCommand | null = null;

export function getCopyCommand(config?: Partial<CopyCommandConfig>): CopyCommand {
  if (!_copyCommand) {
    _copyCommand = new CopyCommand(config);
  }
  return _copyCommand;
}

export function resetCopyCommand(): void {
  _copyCommand = null;
}
