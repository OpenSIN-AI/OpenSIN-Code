export interface BuddyConfig {
  enabled: boolean;
  personality: 'helpful' | 'concise' | 'detailed';
  autoSuggest: boolean;
  maxSuggestions: number;
}

export interface BuddySuggestion {
  id: string;
  text: string;
  context: string;
  confidence: number;
  timestamp: Date;
}

export interface BuddyState {
  active: boolean;
  suggestions: BuddySuggestion[];
  lastInteraction: Date | null;
}
