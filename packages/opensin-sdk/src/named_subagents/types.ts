export interface NamedSubAgent {
  id: string;
  name: string;
  description: string;
  icon?: string;
  capabilities: string[];
  lastUsed?: number;
  usageCount: number;
  tags: string[];
  systemPrompt?: string;
  modelPreferences?: string[];
}

export interface SubAgentMention {
  agentId: string;
  agentName: string;
  position: number;
  text: string;
}

export interface TypeaheadSuggestion {
  agent: NamedSubAgent;
  matchScore: number;
  matchReason: string;
  displayText: string;
}

export interface AgentRegistryConfig {
  maxSuggestions: number;
  minMatchScore: number;
  sortBy: "relevance" | "usage" | "alphabetical";
}
