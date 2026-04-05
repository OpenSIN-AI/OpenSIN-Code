import { describe, it, expect, beforeEach } from 'vitest';
import { HookRegistry } from '../hook_system/registry';
import { executeHook } from '../hook_system/executor';

describe('HookRegistry', () => {
  let registry: HookRegistry;

  beforeEach(() => {
    registry = new HookRegistry();
  });

  it('registers and retrieves hooks', () => {
    registry.register({ id: 'hook-1', event: 'PreToolUse', command: 'echo' });
    registry.register({ id: 'hook-2', event: 'PostToolUse', command: 'echo' });

    expect(registry.getHooks('PreToolUse')).toHaveLength(1);
    expect(registry.getHooks('PostToolUse')).toHaveLength(1);
    expect(registry.getAll()).toHaveLength(2);
  });

  it('sorts hooks by order', () => {
    registry.register({ id: 'hook-2', event: 'PreToolUse', command: 'echo', order: 20 });
    registry.register({ id: 'hook-1', event: 'PreToolUse', command: 'echo', order: 10 });

    const hooks = registry.getHooks('PreToolUse');
    expect(hooks[0].id).toBe('hook-1');
    expect(hooks[1].id).toBe('hook-2');
  });

  it('unregisters hooks', () => {
    registry.register({ id: 'hook-1', event: 'PreToolUse', command: 'echo' });
    expect(registry.unregister('hook-1')).toBe(true);
    expect(registry.getHooks('PreToolUse')).toHaveLength(0);
    expect(registry.unregister('nonexistent')).toBe(false);
  });

  it('clears all hooks', () => {
    registry.register({ id: 'hook-1', event: 'PreToolUse', command: 'echo' });
    registry.register({ id: 'hook-2', event: 'PostToolUse', command: 'echo' });
    registry.clear();
    expect(registry.getAll()).toHaveLength(0);
  });
});

describe('executeHook', () => {
  it('executes successful hook', async () => {
    const result = await executeHook({ id: 'test', event: 'PreToolUse', command: 'echo', args: ['hello'] });
    expect(result.success).toBe(true);
    expect(result.output).toBe('hello');
  });

  it('handles failing hook', async () => {
    const result = await executeHook({ id: 'test', event: 'PreToolUse', command: 'false' });
    expect(result.success).toBe(false);
  });

  it('passes context via env', async () => {
    const result = await executeHook(
      { id: 'test', event: 'PreToolUse', command: 'sh', args: ['-c', 'echo $OPENCODE_HOOK_ID'] },
      { toolName: 'Bash' }
    );
    expect(result.success).toBe(true);
    expect(result.output).toBe('test');
  });
});

describe('hook_system exports', () => {
  it('exports all public API from index', async () => {
    const hs = await import('../hook_system/index');
    expect(hs.HookRegistry).toBeDefined();
    expect(hs.executeHook).toBeDefined();
  });
});
