import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import type { HookDefinition, HookEvent } from '../core/types.js';
import { truncate } from '../utils/helpers.js';

const execAsync = promisify(exec);

export class HookManager {
  private hooks: HookDefinition[] = [];

  constructor(hooks: HookDefinition[] = []) {
    this.hooks = hooks;
  }

  addHook(hook: HookDefinition): void {
    this.hooks.push(hook);
  }

  async execute(event: HookEvent, context: Record<string, unknown>): Promise<void> {
    const matchingHooks = this.hooks.filter((h) => {
      if (h.event !== event) return false;
      if (h.condition) {
        return this.evaluateCondition(h.condition, context);
      }
      return true;
    });

    for (const hook of matchingHooks) {
      try {
        const { stdout, stderr } = await execAsync(hook.command, {
          timeout: 30000,
          maxBuffer: 1024 * 1024,
        });

        const output = stdout + stderr;
        if (output.length > 50000) {
          // save to disk if too large
        }
      } catch {
        // hook execution failed, continue
      }
    }
  }

  private evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    const toolMatch = condition.match(/^(\w+)\((.+)\)$/);
    if (!toolMatch) return true;

    const toolName = toolMatch[1];
    const pattern = toolMatch[2];

    const contextTool = context.tool as string;
    if (contextTool !== toolName) return false;

    const contextInput = JSON.stringify(context.input || '');
    return this.matchesPattern(contextInput, pattern);
  }

  private matchesPattern(input: string, pattern: string): boolean {
    const regexStr = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '___DBL___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DBL___/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp('^' + regexStr + '$').test(input);
  }
}
