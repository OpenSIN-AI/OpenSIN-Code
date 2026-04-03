import { HookEvent, HookDefinition, HookResult, HookExecutionContext } from "./types.js";
export declare class HookRegistry {
    private hooks;
    private executor;
    private defaultTimeout;
    private defaultAbortOnError;
    constructor(options?: {
        defaultTimeout?: number;
        defaultAbortOnError?: boolean;
    });
    register(hook: HookDefinition): void;
    registerMany(hooks: HookDefinition[]): void;
    unregister(hookId: string): boolean;
    getHooks(event: HookEvent): HookDefinition[];
    getEnabledHooks(event: HookEvent): HookDefinition[];
    executeHooks(event: HookEvent, context: HookExecutionContext, options?: {
        abortOnError?: boolean;
    }): Promise<{
        results: HookResult[];
        aborted: boolean;
        abortReason?: string;
    }>;
    clear(): void;
    clearEvent(event: HookEvent): void;
    hasHooks(event: HookEvent): boolean;
    listAllHooks(): Map<HookEvent, HookDefinition[]>;
}
//# sourceMappingURL=registry.d.ts.map