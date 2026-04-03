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
  autoLint?: {
    enabled?: boolean;
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
      event: HookEvent.PostEdit,
      command: "npx",
      args: ["prettier", "--write", ...(prettierOpts.args ?? ["${OPENSIN_HOOK_FILE:-.}"])],
      timeout: prettierOpts.timeout ?? 15000,
      onError: "continue",
      enabled: true,
    });
  }

  const eslintOpts = options?.eslint ?? {};
  if (eslintOpts.enabled !== false) {
    hooks.push({
      id: "builtin:eslint",
      event: HookEvent.PostEdit,
      command: "npx",
      args: ["eslint", "--fix", ...(eslintOpts.args ?? ["${OPENSIN_HOOK_FILE:-.}"])],
      timeout: eslintOpts.timeout ?? 30000,
      onError: "continue",
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
      event: HookEvent.PostEdit,
      command: "npx",
      args: ["tsc", "--noEmit", ...(typecheckOpts.args ?? [])],
      timeout: typecheckOpts.timeout ?? 30000,
      onError: "continue",
      enabled: true,
    });
  }

  const autoLintOpts = options?.autoLint ?? {};
  if (autoLintOpts.enabled !== false) {
    hooks.push({
      id: "builtin:auto-lint",
      event: HookEvent.PostEdit,
      command: "npx",
      args: ["--no", "opensin", "lint", "--fix", "${OPENSIN_HOOK_FILE:-.}"],
      timeout: autoLintOpts.timeout ?? 45000,
      onError: "continue",
      enabled: true,
    });
  }

  hooks.push({
    id: "builtin:pre-commit-lint",
    event: HookEvent.PreCommit,
    command: "npx",
    args: ["--no", "opensin", "lint"],
    timeout: 60000,
    onError: "abort",
    enabled: true,
  });

  registry.registerMany(hooks);
}
