/**
 * OpenSIN Handoff Manager — Session continuity prompts
 * 
 * Creates focused handoff prompts for continuing work in a new session,
 * preserving context and intent.
 */

import type { HandoffContext, HandoffConfig } from './types.js';
import { DEFAULT_HANDOFF_CONFIG } from './types.js';

export class HandoffManager {
  private config: HandoffConfig;

  constructor(config: Partial<HandoffConfig> = {}) {
    this.config = { ...DEFAULT_HANDOFF_CONFIG, ...config };
  }

  generateHandoff(context: Partial<HandoffContext>): string {
    const ctx: HandoffContext = {
      sessionId: context.sessionId || 'unknown',
      summary: context.summary || '',
      completedTasks: context.completedTasks || [],
      pendingTasks: context.pendingTasks || [],
      keyDecisions: context.keyDecisions || [],
      fileChanges: context.fileChanges || [],
      timestamp: context.timestamp || new Date(),
    };

    let prompt = `# Session Handoff — ${ctx.sessionId}\n\n`;
    prompt += `## Summary\n${ctx.summary}\n\n`;
    
    if (ctx.completedTasks.length > 0) {
      prompt += `## Completed\n${ctx.completedTasks.map(t => `- ${t}`).join('\n')}\n\n`;
    }
    
    if (ctx.pendingTasks.length > 0) {
      prompt += `## Pending\n${ctx.pendingTasks.map(t => `- ${t}`).join('\n')}\n\n`;
    }
    
    if (this.config.includeDecisions && ctx.keyDecisions.length > 0) {
      prompt += `## Key Decisions\n${ctx.keyDecisions.map(d => `- ${d}`).join('\n')}\n\n`;
    }
    
    if (this.config.includeFileChanges && ctx.fileChanges.length > 0) {
      prompt += `## File Changes\n${ctx.fileChanges.map(f => `- ${f}`).join('\n')}\n\n`;
    }
    
    prompt += `Continue from where the previous session left off.`;
    
    return prompt.slice(0, this.config.maxSummaryLength);
  }

  generateContinuationPrompt(context: Partial<HandoffContext>): string {
    const handoff = this.generateHandoff(context);
    return `You are continuing a previous session. Here is the context:\n\n${handoff}`;
  }
}
