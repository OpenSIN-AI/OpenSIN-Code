import { HookEvent, HookDefinition } from "./types.js";
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
}

export function registerBuiltinHooks(
  registry: HookRegistry,
  options?: BuiltinHookOptions,
): void {
  const hooks: HookDefinition[] = [];

  const prettierOpts = options?.prettier ?? {};
  if (prettierOpts.enabled !== false) {
    hooks.push({
      id: "builtin:prettier",
      event: HookEvent.PreEdit,
      command: "npx",
      args: ["prettier", "--write", ...(prettierOpts.args ?? ["${OPENCODE_FILE_PATH:-.}"])],
      timeout: prettierOpts.timeout ?? 15000,
      onError: "continue",
      enabled: true,
    });
  }

  const eslintOpts = options?.eslint ?? {};
  if (eslintOpts.enabled !== false) {
    hooks.push({
      id: "builtin:eslint",
      event: HookEvent.PreCommit,
      command: "npx",
      args: ["eslint", "--fix", ...(eslintOpts.args ?? ["."])],
      timeout: eslintOpts.timeout ?? 30000,
      onError: "abort",
      enabled: true,
    });
  }

  const pytestOpts = options?.pytest ?? {};
  if (pytestOpts.enabled !== false) {
    hooks.push({
      id: "builtin:pytest",
      event: HookEvent.PostEdit,
      command: "pytest",
      args: pytestOpts.args ?? ["-q", "--tb=short"],
      timeout: pytestOpts.timeout ?? 60000,
      onError: "continue",
      enabled: true,
    });
  }

  const typecheckOpts = options?.typecheck ?? {};
  if (typecheckOpts.enabled !== false) {
    hooks.push({
      id: "builtin:typecheck",
      event: HookEvent.PreCommit,
      command: "npx",
      args: ["tsc", "--noEmit", ...(typecheckOpts.args ?? [])],
      timeout: typecheckOpts.timeout ?? 30000,
      onError: "abort",
      enabled: true,
    });
  }

  registry.registerMany(hooks);
}
