import { describe, it, expect } from 'vitest';
import { createHook, HookEvents } from './hook.js';
import { mockContext } from './test/index.js';

describe('createHook', () => {
  it('should create a valid hook definition', () => {
    const hook = createHook({
      event: 'session:start',
      handler: async () => {},
    });

    expect(hook.event).toBe('session:start');
    expect(hook.handler).toBeDefined();
    expect(hook.priority).toBe(0);
  });

  it('should throw if event is missing', () => {
    expect(() => createHook({
      event: '',
      handler: async () => {},
    })).toThrow('Hook must have event and handler');
  });

  it('should throw if handler is missing', () => {
    expect(() => createHook({
      event: 'test',
      handler: undefined as any,
    })).toThrow('Hook must have event and handler');
  });

  it('should accept custom priority', () => {
    const hook = createHook({
      event: 'test',
      handler: async () => {},
      priority: 10,
    });
    expect(hook.priority).toBe(10);
  });

  it('should have default priority of 0', () => {
    const hook = createHook({
      event: 'test',
      handler: async () => {},
    });
    expect(hook.priority).toBe(0);
  });
});

describe('HookEvents', () => {
  it('should define session lifecycle events', () => {
    expect(HookEvents.SESSION_START).toBe('session:start');
    expect(HookEvents.SESSION_END).toBe('session:end');
    expect(HookEvents.SESSION_PAUSE).toBe('session:pause');
    expect(HookEvents.SESSION_RESUME).toBe('session:resume');
  });

  it('should define tool execution events', () => {
    expect(HookEvents.TOOL_EXECUTE_BEFORE).toBe('tool:execute:before');
    expect(HookEvents.TOOL_EXECUTE_AFTER).toBe('tool:execute:after');
    expect(HookEvents.TOOL_EXECUTE_ERROR).toBe('tool:execute:error');
  });

  it('should define message handling events', () => {
    expect(HookEvents.MESSAGE_RECEIVE).toBe('message:receive');
    expect(HookEvents.MESSAGE_SEND).toBe('message:send');
    expect(HookEvents.MESSAGE_PARSE_BEFORE).toBe('message:parse:before');
    expect(HookEvents.MESSAGE_PARSE_AFTER).toBe('message:parse:after');
  });

  it('should define context management events', () => {
    expect(HookEvents.CONTEXT_UPDATE).toBe('context:update');
    expect(HookEvents.CONTEXT_PRUNE).toBe('context:prune');
  });

  it('should define plugin lifecycle events', () => {
    expect(HookEvents.PLUGIN_ACTIVATE).toBe('plugin:activate');
    expect(HookEvents.PLUGIN_DEACTIVATE).toBe('plugin:deactivate');
  });

  it('should support custom events', () => {
    expect(HookEvents.CUSTOM('my-event')).toBe('custom:my-event');
  });
});

describe('hook integration with EventBus', () => {
  it('should trigger handler when event is emitted', async () => {
    const ctx = mockContext();
    let triggered = false;
    let receivedData: any = null;

    const hook = createHook({
      event: 'test:event',
      handler: async (data) => {
        triggered = true;
        receivedData = data;
      },
    });

    ctx.events.on(hook.event, hook.handler);
    ctx.events.emit('test:event', { foo: 'bar' });

    expect(triggered).toBe(true);
    expect(receivedData).toEqual({ foo: 'bar' });
  });

  it('should support multiple handlers for same event', async () => {
    const ctx = mockContext();
    const results: string[] = [];

    ctx.events.on('multi', async () => { results.push('first'); });
    ctx.events.on('multi', async () => { results.push('second'); });

    ctx.events.emit('multi', {});

    expect(results).toEqual(['first', 'second']);
  });

  it('should remove handler when off is called', async () => {
    const ctx = mockContext();
    let called = false;

    const handler = async () => { called = true; };
    ctx.events.on('remove-test', handler);
    ctx.events.off('remove-test', handler);
    ctx.events.emit('remove-test', {});

    expect(called).toBe(false);
  });
});
