import { HookResult, HookConfig, HookExecutionContext } from "./types.js";
export declare class HookExecutor {
    execute(hook: HookConfig, context: HookExecutionContext, defaultTimeout?: number): Promise<HookResult>;
    private buildEnv;
}
//# sourceMappingURL=executor.d.ts.map