import { HookRegistry } from "./registry.js";
export interface BuiltinHookOptions {
    prettier?: {
        enabled?: boolean;
        args?: string[];
        timeout?: number;
    };
    eslint?: {
        enabled?: boolean;
        args?: string[];
        timeout?: number;
    };
    pytest?: {
        enabled?: boolean;
        args?: string[];
        timeout?: number;
    };
    typecheck?: {
        enabled?: boolean;
        args?: string[];
        timeout?: number;
    };
    autoLint?: {
        enabled?: boolean;
        timeout?: number;
    };
}
export declare function registerBuiltinHooks(registry: HookRegistry, options?: BuiltinHookOptions): void;
//# sourceMappingURL=builtin.d.ts.map