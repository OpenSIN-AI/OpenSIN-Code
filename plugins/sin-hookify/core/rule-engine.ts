/**
 * sin-hookify — Rule Evaluation Engine
 * Evaluates rules against hook input data
 * Portiert aus sin-claude/claude-code-main/plugins/hookify/core/rule_engine.py
 */

import { HookRule, HookCondition, HookInput, HookOutput, HookEventName } from './types';

// Regex cache (LRU-style with max size)
const regexCache = new Map<string, RegExp>();
const MAX_REGEX_CACHE = 128;

function compileRegex(pattern: string): RegExp {
  if (regexCache.has(pattern)) {
    return regexCache.get(pattern)!;
  }
  const regex = new RegExp(pattern, 'i');
  if (regexCache.size >= MAX_REGEX_CACHE) {
    const firstKey = regexCache.keys().next().value;
    if (firstKey) regexCache.delete(firstKey);
  }
  regexCache.set(pattern, regex);
  return regex;
}

/**
 * Extract field value from tool input or hook input data
 */
function extractField(
  field: string,
  toolName: string,
  toolInput: Record<string, unknown>,
  inputData: HookInput
): string | null {
  // Direct tool_input fields
  if (field in toolInput) {
    const value = toolInput[field];
    return typeof value === 'string' ? value : String(value);
  }

  // Stop event specific fields
  if (field === 'reason') {
    return inputData.reason || '';
  }
  if (field === 'transcript' && inputData.transcript_path) {
    try {
      const fs = require('fs');
      return fs.readFileSync(inputData.transcript_path, 'utf-8');
    } catch {
      return '';
    }
  }
  if (field === 'user_prompt') {
    return inputData.user_prompt || '';
  }

  // Handle special cases by tool type
  if (toolName === 'Bash') {
    if (field === 'command') return (toolInput.command as string) || '';
  } else if (toolName === 'Write' || toolName === 'Edit') {
    if (field === 'content') return (toolInput.content as string) || (toolInput.new_string as string) || '';
    if (field === 'new_text' || field === 'new_string') return (toolInput.new_string as string) || '';
    if (field === 'old_text' || field === 'old_string') return (toolInput.old_string as string) || '';
    if (field === 'file_path') return (toolInput.file_path as string) || '';
  } else if (toolName === 'MultiEdit') {
    if (field === 'file_path') return (toolInput.file_path as string) || '';
    if (field === 'new_text' || field === 'content') {
      const edits = (toolInput.edits as Array<{ new_string?: string }>) || [];
      return edits.map(e => e.new_string || '').join(' ');
    }
  }

  return null;
}

/**
 * Check if tool_name matches the matcher pattern
 */
function matchesTool(matcher: string, toolName: string): boolean {
  if (matcher === '*') return true;
  return matcher.split('|').includes(toolName);
}

/**
 * Check if a single condition matches
 */
function checkCondition(
  condition: HookCondition,
  toolName: string,
  toolInput: Record<string, unknown>,
  inputData: HookInput
): boolean {
  const fieldValue = extractField(condition.field, toolName, toolInput, inputData);
  if (fieldValue === null) return false;

  const { operator, pattern } = condition;

  switch (operator) {
    case 'regex_match':
      try {
        return compileRegex(pattern).test(fieldValue);
      } catch {
        return false;
      }
    case 'contains':
      return fieldValue.includes(pattern);
    case 'equals':
      return fieldValue === pattern;
    case 'not_contains':
      return !fieldValue.includes(pattern);
    case 'starts_with':
      return fieldValue.startsWith(pattern);
    case 'ends_with':
      return fieldValue.endsWith(pattern);
    default:
      return false;
  }
}

/**
 * Check if rule matches input data
 */
function ruleMatches(rule: HookRule, inputData: HookInput): boolean {
  const toolName = inputData.tool_name || '';
  const toolInput = inputData.tool_input || {};

  // Check tool matcher if specified
  if (rule.tool_matcher && !matchesTool(rule.tool_matcher, toolName)) {
    return false;
  }

  // All conditions must match
  if (rule.conditions.length === 0) return false;

  for (const condition of rule.conditions) {
    if (!checkCondition(condition, toolName, toolInput, inputData)) {
      return false;
    }
  }

  return true;
}

/**
 * Evaluate all rules and return combined results
 */
export function evaluateRules(rules: HookRule[], inputData: HookInput): HookOutput {
  const hookEvent = inputData.hook_event_name || '';
  const blockingRules: HookRule[] = [];
  const warningRules: HookRule[] = [];

  for (const rule of rules) {
    if (ruleMatches(rule, inputData)) {
      if (rule.action === 'block') {
        blockingRules.push(rule);
      } else {
        warningRules.push(rule);
      }
    }
  }

  // If any blocking rules matched, block the operation
  if (blockingRules.length > 0) {
    const combinedMessage = blockingRules
      .map(r => `**[${r.name}]**\n${r.message}`)
      .join('\n\n');

    if (hookEvent === 'Stop') {
      return {
        decision: 'block',
        reason: combinedMessage,
        systemMessage: combinedMessage,
      };
    } else if (hookEvent === 'PreToolUse' || hookEvent === 'PostToolUse') {
      return {
        hookSpecificOutput: {
          hookEventName: hookEvent as HookEventName,
          permissionDecision: 'deny',
        },
        systemMessage: combinedMessage,
      };
    } else {
      return { systemMessage: combinedMessage };
    }
  }

  // If only warnings, show them but allow operation
  if (warningRules.length > 0) {
    const messages = warningRules.map(r => `**[${r.name}]**\n${r.message}`).join('\n\n');
    return { systemMessage: messages };
  }

  // No matches - allow operation
  return {};
}
