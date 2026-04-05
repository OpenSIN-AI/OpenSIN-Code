/**
 * sin-hookify — Configuration Loader
 * Lädt und parst .opensin/hookify/hookify.*.local.md Files
 * Portiert aus sin-claude/claude-code-main/plugins/hookify/core/config_loader.py
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { HookRule, HookCondition, HookEvent, HookifyConfig } from './types';

/**
 * Extract YAML frontmatter and message body from markdown
 */
export function extractFrontmatter(content: string): [Record<string, unknown>, string] {
  if (!content.startsWith('---')) {
    return [{}, content];
  }

  const parts = content.split('---', 3);
  if (parts.length < 3) {
    return [{}, content];
  }

  const frontmatterText = parts[1];
  const message = parts[2].trim();

  const frontmatter: Record<string, unknown> = {};
  const lines = frontmatterText.split('\n');

  let currentKey: string | null = null;
  const currentList: Record<string, unknown>[] = [];
  let currentDict: Record<string, unknown> = {};
  let inList = false;
  let inDictItem = false;

  for (const line of lines) {
    const stripped = line.trim();
    if (!stripped || stripped.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;

    if (indent === 0 && stripped.includes(':') && !stripped.startsWith('-')) {
      if (inList && currentKey) {
        if (inDictItem && Object.keys(currentDict).length > 0) {
          currentList.push({ ...currentDict });
          currentDict = {};
        }
        frontmatter[currentKey] = [...currentList];
        inList = false;
        inDictItem = false;
        currentList.length = 0;
      }

      const colonIdx = stripped.indexOf(':');
      const key = stripped.substring(0, colonIdx).trim();
      const value = stripped.substring(colonIdx + 1).trim();

      if (!value) {
        currentKey = key;
        inList = true;
      } else {
        frontmatter[key] = parseYamlValue(value);
      }
    } else if (stripped.startsWith('-') && inList) {
      if (inDictItem && Object.keys(currentDict).length > 0) {
        currentList.push({ ...currentDict });
        currentDict = {};
      }

      const itemText = stripped.substring(1).trim();
      if (itemText.includes(':') && itemText.includes(',')) {
        const itemDict: Record<string, unknown> = {};
        for (const part of itemText.split(',')) {
          if (part.includes(':')) {
            const [k, v] = part.split(':', 2);
            itemDict[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
          }
        }
        currentList.push(itemDict);
        inDictItem = false;
      } else if (itemText.includes(':')) {
        inDictItem = true;
        const [k, v] = itemText.split(':', 2);
        currentDict = { [k.trim()]: v.trim().replace(/^["']|["']$/g, '') };
      } else {
        currentList.push(itemText.replace(/^["']|["']$/g, ''));
        inDictItem = false;
      }
    } else if (indent > 2 && inDictItem && stripped.includes(':')) {
      const [k, v] = stripped.split(':', 2);
      currentDict[k.trim()] = v.trim().replace(/^["']|["']$/g, '');
    }
  }

  if (inList && currentKey) {
    if (inDictItem && Object.keys(currentDict).length > 0) {
      currentList.push({ ...currentDict });
    }
    frontmatter[currentKey] = [...currentList];
  }

  return [frontmatter, message];
}

function parseYamlValue(value: string): unknown {
  const cleaned = value.replace(/^["']|["']$/g, '');
  if (cleaned.toLowerCase() === 'true') return true;
  if (cleaned.toLowerCase() === 'false') return false;
  const num = Number(cleaned);
  if (!isNaN(num) && cleaned !== '') return num;
  return cleaned;
}

/**
 * Create HookCondition from dict
 */
function conditionFromDict(data: Record<string, unknown>): HookCondition {
  return {
    field: (data.field as string) || '',
    operator: (data.operator as HookOperator) || 'regex_match',
    pattern: (data.pattern as string) || '',
  };
}

/**
 * Create HookRule from frontmatter dict and message body
 */
function ruleFromDict(frontmatter: Record<string, unknown>, message: string): HookRule {
  const conditions: HookCondition[] = [];

  if ('conditions' in frontmatter) {
    const condList = frontmatter.conditions;
    if (Array.isArray(condList)) {
      for (const c of condList) {
        if (typeof c === 'object' && c !== null) {
          conditions.push(conditionFromDict(c as Record<string, unknown>));
        }
      }
    }
  }

  const simplePattern = frontmatter.pattern as string | undefined;
  if (simplePattern && conditions.length === 0) {
    const event = (frontmatter.event as HookEvent) || 'all';
    const field = event === 'bash' ? 'command' : event === 'file' ? 'new_text' : 'content';
    conditions.push({ field, operator: 'regex_match', pattern: simplePattern });
  }

  return {
    name: (frontmatter.name as string) || 'unnamed',
    enabled: (frontmatter.enabled as boolean) ?? true,
    event: (frontmatter.event as HookEvent) || 'all',
    pattern: simplePattern,
    conditions,
    action: (frontmatter.action as HookAction) || 'warn',
    tool_matcher: frontmatter.tool_matcher as string | undefined,
    message: message.trim(),
  };
}

/**
 * Load a single rule file
 */
export function loadRuleFile(filePath: string): HookRule | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const [frontmatter, message] = extractFrontmatter(content);

    if (Object.keys(frontmatter).length === 0) {
      console.error(`Warning: ${filePath} missing YAML frontmatter`);
      return null;
    }

    return ruleFromDict(frontmatter, message);
  } catch (e) {
    console.error(`Error: Cannot read ${filePath}: ${e}`);
    return null;
  }
}

/**
 * Load all hookify rules from .opensin/hookify directory
 */
export function loadRules(config: HookifyConfig, event?: HookEvent): HookRule[] {
  const rules: HookRule[] = [];
  const pattern = path.join(config.rulesDirectory, `${config.ruleFilePattern}`);

  try {
    const files = glob.sync(pattern);

    for (const filePath of files) {
      try {
        const rule = loadRuleFile(filePath);
        if (!rule) continue;

        if (event && rule.event !== 'all' && rule.event !== event) continue;
        if (!rule.enabled) continue;

        if (rules.length >= config.maxRules) {
          console.warn(`Max rules limit reached (${config.maxRules})`);
          break;
        }

        rules.push(rule);
      } catch (e) {
        console.error(`Warning: Failed to load ${filePath}: ${e}`);
      }
    }
  } catch (e) {
    console.error(`Warning: Failed to scan rules directory: ${e}`);
  }

  return rules;
}
