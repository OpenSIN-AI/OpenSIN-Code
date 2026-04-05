/**
 * sin-hookify — Main Plugin Entry Point
 */

export { loadRules, loadRuleFile, extractFrontmatter } from './core/config-loader';
export { evaluateRules } from './core/rule-engine';
export { preToolUseHook } from './hooks/pretooluse';
export { postToolUseHook } from './hooks/posttooluse';
export { stopHook } from './hooks/stop';
export { userPromptSubmitHook } from './hooks/userpromptsubmit';
export type { HookRule, HookCondition, HookInput, HookOutput, HookEvent, HookAction, HookifyConfig } from './core/types';
