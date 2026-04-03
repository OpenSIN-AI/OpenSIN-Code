import { HookEvent, HookDefinition, HookResult, HookExecutionContext } from "./types.js";
import { HookExecutor } from "./executor.js";

export class HookRegistry {
  private hooks = new Map<HookEvent, HookDefinition[]>();
  private executor: HookExecutor;
  private defaultTimeout: number;
  private defaultAbortOnError: boolean;

  constructor(options?: { defaultTimeout?: number; defaultAbortOnError?: boolean }) {
    this.defaultTimeout = options?.defaultTimeout ?? 30000;
    this.defaultAbortOnError = options?.defaultAbortOnError ?? false;
    this.executor = new HookExecutor();
  }

  register(hook: HookDefinition): void {
    const event = hook.event;
    const existing = this.hooks.get(event) ?? [];
    existing.push(hook);
    this.hooks.set(event, existing);
  }

  registerMany(hooks: HookDefinition[]): void {
    for (const hook of hooks) {
      this.register(hook);
    }
  }

  unregister(hookId: string): boolean {
    for (const [event, hooks] of this.hooks.entries()) {
      const index = hooks.findIndex((h) => h.id === hookId);
      if (index !== -1) {
        hooks.splice(index, 1);
        if (hooks.length === 0) {
          this.hooks.delete(event);
        }
        return true;
      }
    }
    return false;
  }

  getHooks(event: HookEvent): HookDefinition[] {
    return this.hooks.get(event) ?? [];
  }

  getEnabledHooks(event: HookEvent): HookDefinition[] {
    return this.getHooks(event).filter((h) => h.enabled !== false);
  }

  async executeHooks(
    event: HookEvent,
    context: HookExecutionContext,
    options?: { abortOnError?: boolean },
  ): Promise<{ results: HookResult[]; aborted: boolean; abortReason?: string }> {
    const hooks = this.getEnabledHooks(event);
    if (hooks.length === 0) {
      return { results: [], aborted: false };
    }

    const globalAbortOnError = options?.abortOnError ?? this.defaultAbortOnError;
    const results: HookResult[] = [];

    for (const hook of hooks) {
      const timeout = hook.timeout ?? this.defaultTimeout;
      const abortOnError = hook.onError === "abort" || (hook.onError === undefined && globalAbortOnError);
      const result = await this.executor.execute(hook, context, timeout);
      results.push(result);

      if (result.exitCode !== 0 && abortOnError) {
        return {
          results,
          aborted: true,
          abortReason: `Hook "${hook.id}" failed with exit code ${result.exitCode}`,
        };
      }

      if (result.timedOut && abortOnError) {
        return {
          results,
          aborted: true,
          abortReason: `Hook "${hook.id}" timed out after ${timeout}ms`,
        };
      }
    }

    return { results, aborted: false };
  }

  clear(): void {
    this.hooks.clear();
  }

  clearEvent(event: HookEvent): void {
    this.hooks.delete(event);
  }

  hasHooks(event: HookEvent): boolean {
    const hooks = this.hooks.get(event);
    return hooks !== undefined && hooks.length > 0;
  }

  listAllHooks(): Map<HookEvent, HookDefinition[]> {
    return new Map(this.hooks);
  }
}
