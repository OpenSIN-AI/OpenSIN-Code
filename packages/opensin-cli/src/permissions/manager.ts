import { existsSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { Config } from '../core/types.js';

const PROTECTED_DIRS = ['.git', '.opensin', '.husky', 'node_modules'];

export class PermissionManager {
  private mode: 'ask' | 'auto' | 'dangerFullAccess';
  private rules: Array<{ pattern: string; action: 'allow' | 'deny'; tool?: string }>;

  constructor(config: Config) {
    this.mode = config.permissions?.mode || 'ask';
    this.rules = config.permissions?.rules || [];
  }

  async checkTool(toolName: string, input: Record<string, unknown>): Promise<'allow' | 'deny' | 'defer'> {
    if (this.mode === 'dangerFullAccess') {
      return 'allow';
    }

    const ruleMatch = this.findMatchingRule(toolName, input);
    if (ruleMatch) {
      return ruleMatch.action === 'allow' ? 'allow' : 'deny';
    }

    if (this.mode === 'auto') {
      return 'allow';
    }

    return 'defer';
  }

  private findMatchingRule(toolName: string, input: Record<string, unknown>): { pattern: string; action: 'allow' | 'deny' } | null {
    for (const rule of this.rules) {
      if (rule.tool && rule.tool !== toolName) continue;

      const command = this.extractCommand(toolName, input);
      if (!command) continue;

      if (this.matchesPattern(command, rule.pattern)) {
        return { pattern: rule.pattern, action: rule.action };
      }
    }
    return null;
  }

  private extractCommand(toolName: string, input: Record<string, unknown>): string | null {
    if (toolName === 'Bash') {
      return input.command as string || null;
    }
    if (toolName === 'Read' || toolName === 'Write' || toolName === 'Edit') {
      return (input.file_path || input.path) as string || null;
    }
    return null;
  }

  private matchesPattern(command: string, pattern: string): boolean {
    const regex = new RegExp(
      '^' + pattern
        .replace(/\*\*/g, '___DOUBLE___')
        .replace(/\*/g, '[^/]*')
        .replace(/___DOUBLE___/g, '.*')
        .replace(/\?/g, '.')
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\\\*\\\*/g, '.*')
        .replace(/\\\*/g, '[^/]*')
        .replace(/\\\?/g, '.')
      + '$'
    );
    return regex.test(command);
  }

  isProtectedPath(path: string): boolean {
    const resolved = resolve(path);
    for (const protectedDir of PROTECTED_DIRS) {
      if (resolved.includes(protectedDir)) {
        return true;
      }
    }
    return false;
  }
}
