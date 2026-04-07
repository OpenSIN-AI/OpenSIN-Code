import { BuddyConfig, BuddySuggestion, BuddyState } from './types';

const DEFAULT_CONFIG: BuddyConfig = {
  enabled: false,
  personality: 'helpful',
  autoSuggest: true,
  maxSuggestions: 3,
};

export class BuddyEngine {
  private config: BuddyConfig;
  private state: BuddyState;

  constructor(config?: Partial<BuddyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = { active: false, suggestions: [], lastInteraction: null };
  }

  activate(): void {
    this.state.active = true;
  }

  deactivate(): void {
    this.state.active = false;
  }

  async generateSuggestions(context: string): Promise<BuddySuggestion[]> {
    if (!this.state.active || !this.config.autoSuggest) {
      return [];
    }

    const suggestions: BuddySuggestion[] = [
      {
        id: `buddy-${Date.now()}-1`,
        text: 'Would you like me to review the current changes?',
        context,
        confidence: 0.7,
        timestamp: new Date(),
      },
    ];

    this.state.suggestions = suggestions.slice(0, this.config.maxSuggestions);
    this.state.lastInteraction = new Date();
    return this.state.suggestions;
  }

  getState(): BuddyState {
    return { ...this.state };
  }

  getConfig(): BuddyConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<BuddyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
