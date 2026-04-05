/**
 * OpenSIN Model Announcer — Model self-awareness
 *
 * Automatically injects the current model name into the chat context
 * so the LLM is self-aware and can adjust behavior accordingly.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

interface ModelAnnouncerConfig {
  enabled: boolean;
  includeCapabilities?: boolean;
  includeContextWindow?: boolean;
}

const DEFAULT_CONFIG: ModelAnnouncerConfig = {
  enabled: true,
  includeCapabilities: true,
  includeContextWindow: true,
};

const MODEL_INFO: Record<string, { provider: string; capabilities: string[]; contextWindow: number }> = {
  'gpt-4o': { provider: 'OpenAI', capabilities: ['text', 'vision', 'function-calling', 'json-mode'], contextWindow: 128000 },
  'gpt-4-turbo': { provider: 'OpenAI', capabilities: ['text', 'vision', 'function-calling'], contextWindow: 128000 },
  'gpt-3.5-turbo': { provider: 'OpenAI', capabilities: ['text', 'function-calling'], contextWindow: 16385 },
  'claude-3-5-sonnet-20241022': { provider: 'Anthropic', capabilities: ['text', 'vision', 'tool-use', 'computer-use'], contextWindow: 200000 },
  'claude-3-opus-20240229': { provider: 'Anthropic', capabilities: ['text', 'vision', 'tool-use'], contextWindow: 200000 },
  'claude-3-haiku-20240307': { provider: 'Anthropic', capabilities: ['text', 'vision', 'tool-use'], contextWindow: 200000 },
  'gemini-2.0-flash': { provider: 'Google', capabilities: ['text', 'vision', 'function-calling'], contextWindow: 1048576 },
  'gemini-1.5-pro': { provider: 'Google', capabilities: ['text', 'vision', 'audio', 'function-calling'], contextWindow: 2097152 },
  'gemini-1.5-flash': { provider: 'Google', capabilities: ['text', 'vision', 'audio', 'function-calling'], contextWindow: 1048576 },
  'deepseek-chat': { provider: 'DeepSeek', capabilities: ['text'], contextWindow: 64000 },
  'deepseek-coder': { provider: 'DeepSeek', capabilities: ['text', 'code'], contextWindow: 16384 },
};

export class ModelAnnouncer {
  private config: ModelAnnouncerConfig;
  private configPath: string;
  private currentModel: string | null = null;

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, 'model_announcer.json')
      : path.join(os.homedir(), '.opensin', 'model_announcer.json');
    this.config = { ...DEFAULT_CONFIG };
  }

  async init(): Promise<void> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  setModel(modelId: string): void {
    this.currentModel = modelId;
  }

  getAnnouncement(): string {
    if (!this.config.enabled || !this.currentModel) {
      return '';
    }

    const modelId = this.currentModel;
    const info = MODEL_INFO[modelId] || {
      provider: 'Unknown',
      capabilities: ['text'],
      contextWindow: 8192,
    };

    let announcement = `<model-identity>\n`;
    announcement += `You are running as ${modelId} (${info.provider}).\n`;

    if (this.config.includeCapabilities && info.capabilities.length > 0) {
      announcement += `Capabilities: ${info.capabilities.join(', ')}.\n`;
    }

    if (this.config.includeContextWindow) {
      const ctxK = Math.round(info.contextWindow / 1000);
      announcement += `Context window: ~${ctxK}K tokens.\n`;
    }

    announcement += `Adjust your responses accordingly. Be aware of your strengths and limitations.\n`;
    announcement += `</model-identity>`;

    return announcement;
  }

  injectIntoSystemPrompt(systemPrompt: string): string {
    const announcement = this.getAnnouncement();
    if (!announcement) return systemPrompt;

    return `${systemPrompt}\n\n${announcement}`;
  }

  getModelInfo(modelId?: string): { provider: string; capabilities: string[]; contextWindow: number } | null {
    const id = modelId || this.currentModel;
    if (!id) return null;
    return MODEL_INFO[id] || null;
  }

  listKnownModels(): string[] {
    return Object.keys(MODEL_INFO);
  }

  isVisionCapable(modelId?: string): boolean {
    const info = this.getModelInfo(modelId);
    return info?.capabilities.includes('vision') ?? false;
  }

  isToolUseCapable(modelId?: string): boolean {
    const info = this.getModelInfo(modelId);
    const caps = info?.capabilities || []; return caps.includes('tool-use') || caps.includes('function-calling');
  }

  getContextWindow(modelId?: string): number {
    const info = this.getModelInfo(modelId);
    return info?.contextWindow ?? 8192;
  }
}

export function createModelAnnouncer(configDir?: string): ModelAnnouncer {
  return new ModelAnnouncer(configDir);
}

export function getModelAwarenessPrompt(modelId: string): string {
  const announcer = new ModelAnnouncer();
  announcer.setModel(modelId);
  return announcer.getAnnouncement();
}
