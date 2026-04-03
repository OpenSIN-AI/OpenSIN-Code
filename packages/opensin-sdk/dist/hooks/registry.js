import { HookExecutor } from "./executor.js";
export class HookRegistry {
    hooks = new Map();
    executor;
    defaultTimeout;
    defaultAbortOnError;
    constructor(options) {
        this.defaultTimeout = options?.defaultTimeout ?? 30000;
        this.defaultAbortOnError = options?.defaultAbortOnError ?? false;
        this.executor = new HookExecutor();
    }
    register(hook) {
        const event = hook.event;
        const existing = this.hooks.get(event) ?? [];
        existing.push(hook);
        this.hooks.set(event, existing);
    }
    registerMany(hooks) {
        for (const hook of hooks) {
            this.register(hook);
        }
    }
    unregister(hookId) {
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
    getHooks(event) {
        return this.hooks.get(event) ?? [];
    }
    getEnabledHooks(event) {
        return this.getHooks(event).filter((h) => h.enabled !== false);
    }
    async executeHooks(event, context, options) {
        const hooks = this.getEnabledHooks(event);
        if (hooks.length === 0) {
            return { results: [], aborted: false };
        }
        const globalAbortOnError = options?.abortOnError ?? this.defaultAbortOnError;
        const results = [];
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
    clear() {
        this.hooks.clear();
    }
    clearEvent(event) {
        this.hooks.delete(event);
    }
    hasHooks(event) {
        const hooks = this.hooks.get(event);
        return hooks !== undefined && hooks.length > 0;
    }
    listAllHooks() {
        return new Map(this.hooks);
    }
}
//# sourceMappingURL=registry.js.map