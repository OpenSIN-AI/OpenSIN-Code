import { NamedSubAgent, AgentRegistryConfig, TypeaheadSuggestion } from "./types.js";

const DEFAULT_CONFIG: AgentRegistryConfig = {
  maxSuggestions: 8,
  minMatchScore: 0.3,
  sortBy: "relevance",
};

export class SubAgentRegistry {
  private agents: Map<string, NamedSubAgent> = new Map();
  private config: AgentRegistryConfig;

  constructor(config?: Partial<AgentRegistryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  register(agent: NamedSubAgent): void {
    this.agents.set(agent.id, agent);
  }

  unregister(agentId: string): boolean {
    return this.agents.delete(agentId);
  }

  get(agentId: string): NamedSubAgent | undefined {
    return this.agents.get(agentId);
  }

  getAll(): NamedSubAgent[] {
    return Array.from(this.agents.values());
  }

  search(query: string): TypeaheadSuggestion[] {
    const queryLower = query.toLowerCase().trim();

    if (!queryLower) {
      return this.getDefaultSuggestions();
    }

    const suggestions: TypeaheadSuggestion[] = [];

    for (const agent of this.agents.values()) {
      const score = this.computeMatchScore(agent, queryLower);

      if (score >= this.config.minMatchScore) {
        suggestions.push({
          agent,
          matchScore: score,
          matchReason: this.getMatchReason(agent, queryLower),
          displayText: this.buildDisplayText(agent),
        });
      }
    }

    return this.sortSuggestions(suggestions);
  }

  recordUsage(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.usageCount++;
      agent.lastUsed = Date.now();
    }
  }

  getRecentlyUsed(): NamedSubAgent[] {
    return this.getAll()
      .filter((a) => a.lastUsed !== undefined)
      .sort((a, b) => (b.lastUsed ?? 0) - (a.lastUsed ?? 0))
      .slice(0, this.config.maxSuggestions);
  }

  getMostUsed(): NamedSubAgent[] {
    return this.getAll()
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, this.config.maxSuggestions);
  }

  importAgents(agents: NamedSubAgent[]): void {
    for (const agent of agents) {
      this.agents.set(agent.id, agent);
    }
  }

  exportAgents(): NamedSubAgent[] {
    return this.getAll();
  }

  private computeMatchScore(agent: NamedSubAgent, query: string): number {
    let score = 0;

    if (agent.name.toLowerCase().startsWith(query)) {
      score = 1.0;
    } else if (agent.name.toLowerCase().includes(query)) {
      score = 0.8;
    }

    for (const tag of agent.tags) {
      if (tag.toLowerCase().includes(query)) {
        score = Math.max(score, 0.7);
        break;
      }
    }

    for (const cap of agent.capabilities) {
      if (cap.toLowerCase().includes(query)) {
        score = Math.max(score, 0.6);
        break;
      }
    }

    if (agent.description.toLowerCase().includes(query)) {
      score = Math.max(score, 0.4);
    }

    const recencyBonus = agent.lastUsed
      ? Math.min(0.1, (Date.now() - agent.lastUsed) / (1000 * 60 * 60 * 24 * 7) * 0.1)
      : 0;
    score += recencyBonus;

    const usageBonus = Math.min(0.1, agent.usageCount * 0.02);
    score += usageBonus;

    return Math.min(1.0, score);
  }

  private getMatchReason(agent: NamedSubAgent, query: string): string {
    if (agent.name.toLowerCase().startsWith(query)) {
      return "name starts with query";
    }
    if (agent.name.toLowerCase().includes(query)) {
      return "name contains query";
    }
    if (agent.tags.some((t) => t.toLowerCase().includes(query))) {
      return "matching tag";
    }
    if (agent.capabilities.some((c) => c.toLowerCase().includes(query))) {
      return "matching capability";
    }
    return "description match";
  }

  private buildDisplayText(agent: NamedSubAgent): string {
    const capPreview = agent.capabilities.slice(0, 2).join(", ");
    return `@${agent.name} — ${agent.description}${capPreview ? ` [${capPreview}]` : ""}`;
  }

  private getDefaultSuggestions(): TypeaheadSuggestion[] {
    const agents =
      this.config.sortBy === "usage"
        ? this.getMostUsed()
        : this.getRecentlyUsed();

    return agents.map((agent) => ({
      agent,
      matchScore: 0.5,
      matchReason: "recently used",
      displayText: this.buildDisplayText(agent),
    }));
  }

  private sortSuggestions(suggestions: TypeaheadSuggestion[]): TypeaheadSuggestion[] {
    switch (this.config.sortBy) {
      case "usage":
        return suggestions.sort(
          (a, b) => b.agent.usageCount - a.agent.usageCount,
        );
      case "alphabetical":
        return suggestions.sort((a, b) =>
          a.agent.name.localeCompare(b.agent.name),
        );
      default:
        return suggestions.sort((a, b) => b.matchScore - a.matchScore);
    }
  }
}

let _registry: SubAgentRegistry | null = null;

export function getSubAgentRegistry(): SubAgentRegistry {
  if (!_registry) {
    _registry = new SubAgentRegistry();
  }
  return _registry;
}

export function resetSubAgentRegistry(): void {
  _registry = null;
}
