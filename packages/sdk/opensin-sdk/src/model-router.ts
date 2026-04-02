export interface ModelConfig {
  task: 'coding' | 'chat' | 'analysis' | 'design';
  complexity: 'simple' | 'medium' | 'complex';
}

export class ModelRouter {
  private static readonly ROUTING_TABLE: Record<string, Record<string, string>> = {
    coding: { simple: 'openai/gpt-5.4', medium: 'google/antigravity-claude-sonnet-4-6', complex: 'google/antigravity-claude-opus-4-6-thinking' },
    chat: { simple: 'openai/gpt-5.4', medium: 'google/antigravity-gemini-3-flash', complex: 'google/antigravity-gemini-3.1-pro' },
    analysis: { simple: 'openai/gpt-5.4', medium: 'google/antigravity-gemini-3-flash', complex: 'google/antigravity-gemini-3.1-pro' },
    design: { simple: 'google/antigravity-gemini-3-flash', medium: 'google/antigravity-gemini-3.1-pro', complex: 'google/antigravity-gemini-3.1-pro' },
  };

  static resolve(config: ModelConfig): string {
    return this.ROUTING_TABLE[config.task]?.[config.complexity] ?? 'openai/gpt-5.4';
  }
}
