/**
 * sin-hookify — Stop Hook
 * Called when the agent wants to stop. Enables Ralph Loop and completion checks.
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

export async function stopHook(input: HookInput, config: HookifyConfig = DEFAULT_CONFIG): Promise<Record<string, unknown>> {
  try {
    const rules = loadRules(config, 'stop');
    const result = evaluateRules(rules, input);
    return result;
  } catch (e) {
    return { systemMessage: `Hookify stop error: ${e}` };
  }
}
