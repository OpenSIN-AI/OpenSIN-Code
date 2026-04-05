/**
 * sin-hookify — PreToolUse Hook
 * Called before any tool executes. Evaluates hookify rules.
 * Portiert aus sin-claude/claude-code-main/plugins/hookify/hooks/pretooluse.py
 */

import { loadRules } from '../core/config-loader';
import { evaluateRules } from '../core/rule-engine';
import { HookInput, HookifyConfig } from '../core/types';

const DEFAULT_CONFIG: HookifyConfig = {
  rulesDirectory: '.opensin/hookify',
  ruleFilePattern: 'hookify.*.local.md',
  maxRules: 100,
  regexCacheSize: 128,
};

export async function preToolUseHook(input: HookInput, config: HookifyConfig = DEFAULT_CONFIG): Promise<Record<string, unknown>> {
  try {
    const toolName = input.tool_name || '';
    let event: string | undefined;

    if (toolName === 'Bash') event = 'bash';
    else if (['Edit', 'Write', 'MultiEdit'].includes(toolName)) event = 'file';

    const rules = loadRules(config, event as any);
    const result = evaluateRules(rules, input);

    return result;
  } catch (e) {
    return {
      systemMessage: `Hookify error: ${e}`,
    };
  }
}
