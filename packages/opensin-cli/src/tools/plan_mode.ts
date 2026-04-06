import { ToolDefinition } from '../core/types.js';

export class PlanModeTool implements ToolDefinition {
  name = 'plan_mode';
  description = 'Enter or exit plan mode for structured planning. In plan mode, the agent focuses on creating plans before executing.';
  parameters = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['enter', 'exit', 'status'], description: 'Action to perform' },
      plan: { type: 'string', description: 'Plan content (for enter)' },
    },
    required: ['action'],
  };

  async execute(input: Record<string, unknown>): Promise<{ output: string; isError?: boolean }> {
    const { action, plan } = input as Record<string, any>;
    switch (action) {
      case 'enter':
        return { output: `Entered plan mode. Plan: ${plan || '(no plan provided)'}` };
      case 'exit':
        return { output: 'Exited plan mode. Ready for execution.' };
      case 'status':
        return { output: 'Plan mode: not active (use action=enter to activate)' };
      default:
        return { output: `Unknown action: ${action}`, isError: true };
    }
  }
}
