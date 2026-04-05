import type { SessionState, HandoffConfig, HandoffPrompt } from './types.js';

const DEFAULT_CONFIG: HandoffConfig = {
  maxRecentActions: 10,
  includeOpenFiles: true,
  includePendingItems: true,
  includeContextSummary: true,
};

export function captureSessionState(options?: {
  currentTask?: string;
  openFiles?: string[];
  recentActions?: string[];
  pendingItems?: string[];
  contextSummary?: string;
}): SessionState {
  return {
    currentTask: options?.currentTask ?? 'No active task',
    openFiles: options?.openFiles ?? [],
    recentActions: options?.recentActions ?? [],
    pendingItems: options?.pendingItems ?? [],
    contextSummary: options?.contextSummary ?? '',
    timestamp: new Date().toISOString(),
  };
}

export function generateHandoffPrompt(
  state: SessionState,
  config: Partial<HandoffConfig> = {}
): HandoffPrompt {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lines: string[] = [];

  lines.push('# Session Handoff');
  lines.push('');
  lines.push('## Current Task');
  lines.push(state.currentTask);
  lines.push('');

  if (cfg.includeOpenFiles && state.openFiles.length > 0) {
    lines.push('## Open Files');
    for (const f of state.openFiles) lines.push('- ' + f);
    lines.push('');
  }

  if (cfg.includePendingItems && state.pendingItems.length > 0) {
    lines.push('## Pending Items');
    for (const item of state.pendingItems) lines.push('- [ ] ' + item);
    lines.push('');
  }

  if (cfg.includeContextSummary && state.contextSummary) {
    lines.push('## Context Summary');
    lines.push(state.contextSummary);
    lines.push('');
  }

  const recentActions = state.recentActions.slice(-cfg.maxRecentActions);
  if (recentActions.length > 0) {
    lines.push('## Recent Actions');
    for (const action of recentActions) lines.push('- ' + action);
    lines.push('');
  }

  lines.push('---');
  lines.push('Handoff generated at: ' + state.timestamp);

  return {
    prompt: lines.join('\n'),
    state,
    metadata: { generatedAt: new Date().toISOString(), version: '0.1.0' },
  };
}

export class HandoffPlugin {
  private config: HandoffConfig;
  private state: SessionState | null = null;

  constructor(config?: Partial<HandoffConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): HandoffConfig { return { ...this.config }; }
  setConfig(config: Partial<HandoffConfig>): void { this.config = { ...this.config, ...config }; }

  capture(options?: Parameters<typeof captureSessionState>[0]): SessionState {
    this.state = captureSessionState(options);
    return this.state;
  }

  generate(state?: SessionState): HandoffPrompt {
    return generateHandoffPrompt(state ?? this.state ?? captureSessionState(), this.config);
  }

  getState(): SessionState | null { return this.state; }

  getManifest() {
    return {
      id: 'handoff', name: 'Session Handoff Plugin', version: '0.1.0',
      description: 'Session handoff and continuity prompts for OpenSIN CLI', author: 'OpenSIN-AI', license: 'MIT',
    };
  }
}
