/**
 * sin-hookify — UserPromptSubmit Hook
 * Called when user submits a prompt. For prompt filtering/analysis.
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

export async function userPromptSubmitHook(input: HookInput, config: HookifyConfig = DEFAULT_CONFIG): Promise<Record<string, unknown>> {
  try {
    const rules = loadRules(config, 'prompt');
    const result = evaluateRules(rules, input);
    return result;
  } catch (e) {
    return { systemMessage: `Hookify prompt error: ${e}` };
  }
}
