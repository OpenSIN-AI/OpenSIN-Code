/**
 * OpenSIN Agent Loop — Comprehensive Tests
 *
 * Tests for:
 * - Core loop runs continuously
 * - Handles tool results correctly
 * - Streams NDJSON output
 * - Error recovery works (retry logic)
 * - Context window management
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentLoop, createAgentLoop } from '../agent_loop/agent_loop';
import { ToolRegistry, createToolRegistry } from '../agent_loop/tool_registry';
import { AgentLoopContext, estimateMessageTokens, estimateTotalTokens } from '../agent_loop/context';
import {
  toNDJSONLine,
  emitNDJSON,
  makeEvent,
  parseNDJSONLine,
  parseNDJSONStream,
  streamNDJSON,
} from '../agent_loop/ndjson';
import type {
  AgentLoopConfig,
  LLMCaller,
  LLMResponse,
  AgentEvent,
} from '../agent_loop/types';
import type { Message, ToolCall, ToolResult, ToolDefinition } from '../types';

// --- Helpers ---

function createMockLLMCaller(responses: LLMResponse[]): LLMCaller {
  let callIndex = 0;
  return async (): Promise<LLMResponse> => {
    if (callIndex >= responses.length) {
      return {
        content: 'No more responses configured',
        toolCalls: [],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        stopReason: 'end_turn',
      };
    }
    return responses[callIndex++]!;
  };
}

function createFailingLLMCaller(failCount: number, successResponse: LLMResponse): LLMCaller {
  let callIndex = 0;
  return async (): Promise<LLMResponse> => {
    callIndex++;
    if (callIndex <= failCount) {
      throw new Error(`Transient error #${callIndex} — rate limit exceeded`);
    }
    return successResponse;
  };
}

function createToolCall(name: string, input: Record<string, unknown> = {}): ToolCall {
  return {
    id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    input,
  };
}

function createToolResult(output: string, isError = false): ToolResult {
  return {
    output,
    is_error: isError,
    metadata: {},
  };
}

function createToolDefinition(name: string): ToolDefinition {
  return {
    name,
    description: `Test tool: ${name}`,
    input_schema: {
      type: 'object',
      properties: {},
    },
  };
}

// Capture stdout for NDJSON tests
function captureStdout(): { output: string; restore: () => void } {
  let output = '';
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (chunk: string | Uint8Array): boolean => {
    if (typeof chunk === 'string') {
      output += chunk;
    }
    return true;
  };
  return {
    output: '',
    restore: () => {
      process.stdout.write = originalWrite;
    },
  };
}

// --- NDJSON Tests ---

describe('NDJSON Streaming', () => {
  it('serializes an event to NDJSON', () => {
    const event = makeEvent('status', { status: 'running' }, 'turn-1');
    const line = toNDJSONLine(event);
    const parsed = JSON.parse(line);
    expect(parsed.type).toBe('status');
    expect(parsed.status).toBe('running');
    expect(parsed.turn).toBe('turn-1');
    expect(typeof parsed.ts).toBe('string');
  });

  it('parses a valid NDJSON line', () => {
    const line = JSON.stringify({ type: 'text_delta', ts: '2026-01-01T00:00:00Z', content: 'hello' });
    const event = parseNDJSONLine(line);
    expect(event).not.toBeNull();
    expect(event!.type).toBe('text_delta');
    expect(event!.data.content).toBe('hello');
  });

  it('returns null for invalid NDJSON', () => {
    expect(parseNDJSONLine('not json')).toBeNull();
    expect(parseNDJSONLine('')).toBeNull();
    expect(parseNDJSONLine('   ')).toBeNull();
  });

  it('parses multiple NDJSON lines', () => {
    const lines = [
      JSON.stringify({ type: 'status', ts: 't1', status: 'start' }),
      JSON.stringify({ type: 'thinking', ts: 't2', message: 'hello' }),
      JSON.stringify({ type: 'text_delta', ts: 't3', content: 'world' }),
    ].join('\n');

    const events = parseNDJSONStream(lines);
    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('status');
    expect(events[1].type).toBe('thinking');
    expect(events[2].type).toBe('text_delta');
  });

  it('skips empty lines in NDJSON stream', () => {
    const lines = [
      JSON.stringify({ type: 'status', ts: 't1' }),
      '',
      '',
      JSON.stringify({ type: 'done', ts: 't2' }),
    ].join('\n');

    const events = parseNDJSONStream(lines);
    expect(events).toHaveLength(2);
  });

  it('makeEvent creates proper event structure', () => {
    const event = makeEvent('tool_call_start', { tool_name: 'bash', tool_id: 'tc-1' }, 'turn-1');
    expect(event.type).toBe('tool_call_start');
    expect(event.turnId).toBe('turn-1');
    expect(event.data.tool_name).toBe('bash');
    expect(event.data.tool_id).toBe('tc-1');
    expect(typeof event.timestamp).toBe('string');
  });
});

// --- Tool Registry Tests ---

describe('Tool Registry', () => {
  it('registers and retrieves tools', () => {
    const registry = createToolRegistry();
    const def = createToolDefinition('bash');
    registry.register('bash', {
      definition: def,
      execute: async () => createToolResult('ok'),
    });

    expect(registry.has('bash')).toBe(true);
    expect(registry.get('bash')).toBeDefined();
    expect(registry.getDefinitions()).toHaveLength(1);
    expect(registry.getNames()).toEqual(['bash']);
  });

  it('executes a registered tool', async () => {
    const registry = createToolRegistry();
    registry.register('bash', {
      definition: createToolDefinition('bash'),
      execute: async (tc) => createToolResult(`executed: ${tc.input.command}`),
    });

    const tc = createToolCall('bash', { command: 'ls -la' });
    const result = await registry.execute(tc, '/workspace', 'session-1');
    expect(result.is_error).toBe(false);
    expect(result.output).toBe('executed: ls -la');
  });

  it('returns error for unknown tool', async () => {
    const registry = createToolRegistry();
    const tc = createToolCall('nonexistent');
    const result = await registry.execute(tc, '/workspace', 'session-1');
    expect(result.is_error).toBe(true);
    expect(result.output).toContain('Unknown tool');
  });

  it('handles tool execution errors', async () => {
    const registry = createToolRegistry();
    registry.register('failing', {
      definition: createToolDefinition('failing'),
      execute: async () => { throw new Error('Tool crashed'); },
    });

    const tc = createToolCall('failing');
    const result = await registry.execute(tc, '/workspace', 'session-1');
    expect(result.is_error).toBe(true);
    expect(result.output).toContain('Tool crashed');
  });

  it('unregisters tools', () => {
    const registry = createToolRegistry();
    registry.register('temp', {
      definition: createToolDefinition('temp'),
      execute: async () => createToolResult('ok'),
    });
    expect(registry.has('temp')).toBe(true);
    registry.unregister('temp');
    expect(registry.has('temp')).toBe(false);
  });
});

// --- Context Management Tests ---

describe('Context Window Management', () => {
  it('estimates tokens for messages', () => {
    const msg: Message = { role: 'user', content: 'Hello world' };
    const tokens = estimateMessageTokens(msg);
    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBe(Math.ceil('Hello world'.length / 4));
  });

  it('estimates total tokens for message array', () => {
    const messages: Message[] = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ];
    const total = estimateTotalTokens(messages);
    expect(total).toBe(Math.ceil(5 / 4) + Math.ceil(8 / 4));
  });

  it('creates context and tracks utilization', () => {
    const config: AgentLoopConfig = {
      maxToolIterations: 10,
      maxRetries: 3,
      retryBaseDelayMs: 100,
      retryMaxDelayMs: 1000,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
      streamNDJSON: false,
      model: 'test-model',
      workspace: '/tmp',
      permissionMode: 'auto',
    };
    const ctx = new AgentLoopContext('test-session', config);
    ctx.addMessage({ role: 'user', content: 'Hello world' });

    const stats = ctx.getStats();
    expect(stats.messageCount).toBe(1);
    expect(stats.totalTokens).toBeGreaterThan(0);
    expect(stats.utilization).toBeGreaterThanOrEqual(0);
  });

  it('adds system messages with highest priority', () => {
    const config: AgentLoopConfig = {
      maxToolIterations: 10,
      maxRetries: 3,
      retryBaseDelayMs: 100,
      retryMaxDelayMs: 1000,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
      streamNDJSON: false,
      model: 'test-model',
      workspace: '/tmp',
      permissionMode: 'auto',
    };
    const ctx = new AgentLoopContext('test-session', config);
    ctx.addSystemMessage('You are a helpful assistant');
    ctx.addMessage({ role: 'user', content: 'Hello' });

    const messages = ctx.getMessages();
    expect(messages[0].role).toBe('assistant');
    expect(messages[0].content).toContain('[SYSTEM]');
    expect(messages[0].content).toContain('You are a helpful assistant');
    expect(messages[1].role).toBe('user');
  });

  it('clears conversation but keeps system messages', () => {
    const config: AgentLoopConfig = {
      maxToolIterations: 10,
      maxRetries: 3,
      retryBaseDelayMs: 100,
      retryMaxDelayMs: 1000,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
      streamNDJSON: false,
      model: 'test-model',
      workspace: '/tmp',
      permissionMode: 'auto',
    };
    const ctx = new AgentLoopContext('test-session', config);
    ctx.addSystemMessage('System prompt');
    ctx.addMessage({ role: 'user', content: 'Hello' });
    ctx.addMessage({ role: 'assistant', content: 'Hi' });

    ctx.clearConversation();
    const messages = ctx.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('assistant');
    expect(messages[0].content).toContain('[SYSTEM]');
  });

  it('compresses context when needed', () => {
    const config: AgentLoopConfig = {
      maxToolIterations: 10,
      maxRetries: 3,
      retryBaseDelayMs: 100,
      retryMaxDelayMs: 1000,
      maxContextTokens: 100,
      compressionThreshold: 0.5,
      streamNDJSON: false,
      model: 'test-model',
      workspace: '/tmp',
      permissionMode: 'auto',
    };
    const ctx = new AgentLoopContext('test-session', config);
    ctx.addSystemMessage('System');

    // Add many messages to trigger compression
    for (let i = 0; i < 20; i++) {
      ctx.addMessage({ role: 'user', content: `User message ${i} with some content to add tokens` });
      ctx.addMessage({ role: 'assistant', content: `Assistant response ${i} with some content to add tokens` });
    }

    const before = ctx.getTotalTokens();
    const saved = ctx.compress();
    const after = ctx.getTotalTokens();

    expect(saved).toBeGreaterThanOrEqual(0);
    expect(after).toBeLessThanOrEqual(before);
  });
});

// --- Core Agent Loop Tests ---

describe('Core Agent Loop', () => {
  it('runs a simple turn without tool calls', async () => {
    const registry = createToolRegistry();
    const caller = createMockLLMCaller([
      {
        content: 'Hello! How can I help you?',
        toolCalls: [],
        usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
        stopReason: 'end_turn',
      },
    ]);

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 2,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Hello', 'test-session');

    expect(result.finalContent).toBe('Hello! How can I help you?');
    expect(result.toolCallsExecuted).toBe(0);
    expect(result.iterations).toBe(1);
    expect(result.totalTokens.total_tokens).toBe(30);
    expect(result.error).toBeUndefined();
  });

  it('handles tool calls and re-injects results', async () => {
    const registry = createToolRegistry();
    registry.register('read_file', {
      definition: createToolDefinition('read_file'),
      execute: async () => createToolResult('file contents here'),
    });

    const caller = createMockLLMCaller([
      {
        content: '',
        toolCalls: [createToolCall('read_file', { path: 'test.txt' })],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        stopReason: 'tool_use',
      },
      {
        content: 'The file contains: file contents here',
        toolCalls: [],
        usage: { input_tokens: 20, output_tokens: 15, total_tokens: 35 },
        stopReason: 'end_turn',
      },
    ]);

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 2,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Read test.txt', 'test-session');

    expect(result.toolCallsExecuted).toBe(1);
    expect(result.iterations).toBe(2);
    expect(result.finalContent).toBe('The file contains: file contents here');
    expect(result.totalTokens.total_tokens).toBe(50);
  });

  it('handles multiple tool calls in one response', async () => {
    const registry = createToolRegistry();
    registry.register('read_file', {
      definition: createToolDefinition('read_file'),
      execute: async (tc) => createToolResult(`contents of ${tc.input.path}`),
    });
    registry.register('grep', {
      definition: createToolDefinition('grep'),
      execute: async (tc) => createToolResult(`grep results for ${tc.input.pattern}`),
    });

    const caller = createMockLLMCaller([
      {
        content: '',
        toolCalls: [
          createToolCall('read_file', { path: 'a.txt' }),
          createToolCall('grep', { pattern: 'foo' }),
        ],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        stopReason: 'tool_use',
      },
      {
        content: 'Found foo in a.txt',
        toolCalls: [],
        usage: { input_tokens: 20, output_tokens: 10, total_tokens: 30 },
        stopReason: 'end_turn',
      },
    ]);

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 2,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Search for foo', 'test-session');

    expect(result.toolCallsExecuted).toBe(2);
    expect(result.iterations).toBe(2);
    expect(result.finalContent).toBe('Found foo in a.txt');
  });

  it('respects max tool iterations limit', async () => {
    const registry = createToolRegistry();
    registry.register('loop_tool', {
      definition: createToolDefinition('loop_tool'),
      execute: async () => createToolResult('looping'),
    });

    // Always returns a tool call — would loop forever without limit
    const caller: LLMCaller = async () => ({
      content: '',
      toolCalls: [createToolCall('loop_tool')],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
      stopReason: 'tool_use',
    });

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 3,
      maxRetries: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Loop forever', 'test-session');

    expect(result.iterations).toBe(3);
    expect(result.toolCallsExecuted).toBe(3);
  });

  it('can be cancelled mid-turn', async () => {
    const registry = createToolRegistry();
    registry.register('slow_tool', {
      definition: createToolDefinition('slow_tool'),
      execute: async () => {
        await new Promise(r => setTimeout(r, 50));
        return createToolResult('done');
      },
    });

    const caller: LLMCaller = async () => ({
      content: '',
      toolCalls: [createToolCall('slow_tool')],
      usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
      stopReason: 'tool_use',
    });

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 10,
      maxRetries: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');

    // Cancel after a short delay
    setTimeout(() => loop.cancel(), 30);

    const result = await loop.processTurn('Cancel me', 'test-session');
    expect(result.iterations).toBeLessThanOrEqual(10);
  });
});

// --- Error Recovery / Retry Tests ---

describe('Error Recovery & Retry Logic', () => {
  it('retries on transient LLM errors and succeeds', async () => {
    const registry = createToolRegistry();
    const caller = createFailingLLMCaller(2, {
      content: 'Success after retries',
      toolCalls: [],
      usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
      stopReason: 'end_turn',
    });

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 3,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Hello', 'test-session');

    expect(result.finalContent).toBe('Success after retries');
    expect(result.error).toBeUndefined();
  });

  it('fails after exhausting retries', async () => {
    const registry = createToolRegistry();
    const caller = createFailingLLMCaller(10, {
      content: 'Never reached',
      toolCalls: [],
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      stopReason: 'end_turn',
    });

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 2,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Hello', 'test-session');

    expect(result.error).toBeDefined();
    expect(result.finalContent).toBe('');
  });

  it('does not retry on non-transient errors', async () => {
    const registry = createToolRegistry();
    const caller: LLMCaller = async () => {
      throw new Error('Invalid API key — permanent failure');
    };

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 3,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Hello', 'test-session');

    expect(result.error).toContain('Invalid API key');
  });

  it('handles tool execution errors gracefully', async () => {
    const registry = createToolRegistry();
    registry.register('crash_tool', {
      definition: createToolDefinition('crash_tool'),
      execute: async () => { throw new Error('Tool crashed hard'); },
    });

    const caller = createMockLLMCaller([
      {
        content: '',
        toolCalls: [createToolCall('crash_tool')],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        stopReason: 'tool_use',
      },
      {
        content: 'The tool failed, but I can still respond',
        toolCalls: [],
        usage: { input_tokens: 20, output_tokens: 15, total_tokens: 35 },
        stopReason: 'end_turn',
      },
    ]);

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    const result = await loop.processTurn('Use crash tool', 'test-session');

    // The loop should continue even after tool failure
    expect(result.iterations).toBe(2);
    expect(result.finalContent).toBe('The tool failed, but I can still respond');
  });
});

// --- NDJSON Streaming Integration Tests ---

describe('NDJSON Streaming Integration', () => {
  it('emits NDJSON events during a turn', async () => {
    const registry = createToolRegistry();
    const caller = createMockLLMCaller([
      {
        content: 'Hello back',
        toolCalls: [],
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
        stopReason: 'end_turn',
      },
    ]);

    // Capture NDJSON output
    let ndjsonOutput = '';
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') {
        ndjsonOutput += chunk;
      }
      return true;
    };

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: true,
      maxToolIterations: 5,
      maxRetries: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    await loop.processTurn('Hello', 'test-session');

    // Restore stdout
    process.stdout.write = originalWrite;

    // Parse the NDJSON output
    const events = parseNDJSONStream(ndjsonOutput);
    expect(events.length).toBeGreaterThan(0);

    // Should have session_start, status, thinking, text_delta, turn_complete, session_end
    const types = events.map(e => e.type);
    expect(types).toContain('session_start');
    expect(types).toContain('status');
    expect(types).toContain('thinking');
    expect(types).toContain('text_delta');
    expect(types).toContain('turn_complete');
    expect(types).toContain('session_end');
  });

  it('emits tool_call events during tool execution', async () => {
    const registry = createToolRegistry();
    registry.register('echo', {
      definition: createToolDefinition('echo'),
      execute: async (tc) => createToolResult(String(tc.input.text)),
    });

    const caller = createMockLLMCaller([
      {
        content: '',
        toolCalls: [createToolCall('echo', { text: 'hello' })],
        usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15 },
        stopReason: 'tool_use',
      },
      {
        content: 'Echo result: hello',
        toolCalls: [],
        usage: { input_tokens: 15, output_tokens: 10, total_tokens: 25 },
        stopReason: 'end_turn',
      },
    ]);

    let ndjsonOutput = '';
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') {
        ndjsonOutput += chunk;
      }
      return true;
    };

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: true,
      maxToolIterations: 5,
      maxRetries: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    await loop.processTurn('Echo hello', 'test-session');

    process.stdout.write = originalWrite;

    const events = parseNDJSONStream(ndjsonOutput);
    const types = events.map(e => e.type);
    expect(types).toContain('tool_call_start');
    expect(types).toContain('tool_call_end');
    expect(types).toContain('tool_result');
  });

  it('emits retry events on transient errors', async () => {
    const registry = createToolRegistry();
    const caller = createFailingLLMCaller(1, {
      content: 'Recovered',
      toolCalls: [],
      usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
      stopReason: 'end_turn',
    });

    let ndjsonOutput = '';
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = (chunk: string | Uint8Array): boolean => {
      if (typeof chunk === 'string') {
        ndjsonOutput += chunk;
      }
      return true;
    };

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: true,
      maxToolIterations: 5,
      maxRetries: 3,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');
    await loop.processTurn('Hello', 'test-session');

    process.stdout.write = originalWrite;

    const events = parseNDJSONStream(ndjsonOutput);
    const types = events.map(e => e.type);
    expect(types).toContain('retry');
  });
});

// --- Async NDJSON Stream Tests ---

describe('NDJSON Async Stream', () => {
  it('parses events from an async string stream', async () => {
    async function* generateLines() {
      yield JSON.stringify({ type: 'status', ts: 't1', status: 'start' }) + '\n';
      yield JSON.stringify({ type: 'text_delta', ts: 't2', content: 'hello' }) + '\n';
      yield JSON.stringify({ type: 'done', ts: 't3' }) + '\n';
    }

    const events: AgentEvent[] = [];
    for await (const event of streamNDJSON(generateLines())) {
      events.push(event);
    }

    expect(events).toHaveLength(3);
    expect(events[0].type).toBe('status');
    expect(events[1].type).toBe('text_delta');
    expect(events[2].type).toBe('done');
  });

  it('handles partial lines across chunks', async () => {
    async function* generateLines() {
      // Split a JSON line across two chunks
      yield '{"type": "status", "ts": "t1", "st';
      yield 'atus": "start"}\n';
    }

    const events: AgentEvent[] = [];
    for await (const event of streamNDJSON(generateLines())) {
      events.push(event);
    }

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('status');
  });
});

// --- Turn State Tests ---

describe('Turn State', () => {
  it('tracks turn state during execution', async () => {
    const registry = createToolRegistry();
    const caller = createMockLLMCaller([
      {
        content: 'Done',
        toolCalls: [],
        usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
        stopReason: 'end_turn',
      },
    ]);

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
      maxToolIterations: 5,
      maxRetries: 1,
      retryBaseDelayMs: 10,
      retryMaxDelayMs: 100,
      maxContextTokens: 1000,
      compressionThreshold: 0.8,
    });

    loop.init('test-session');

    // Before processing
    expect(loop.getTurnState()).toBeNull();
    expect(loop.isRunning()).toBe(false);

    // During processing (we can't easily test this synchronously, but we can check after)
    const result = await loop.processTurn('Hello', 'test-session');

    // After processing
    const state = loop.getTurnState();
    expect(state).not.toBeNull();
    expect(state!.status).toBe('completed');
    expect(state!.iterationCount).toBe(1);
    expect(state!.turnId).toBe(result.turnId);
    expect(loop.isRunning()).toBe(false);
  });

  it('provides access to context and tool registry', () => {
    const registry = createToolRegistry();
    const caller = createMockLLMCaller([]);

    const loop = createAgentLoop(caller, registry, {
      streamNDJSON: false,
    });

    expect(loop.getToolRegistry()).toBe(registry);
    expect(loop.getContext()).toBeNull();

    loop.init('test-session');
    expect(loop.getContext()).not.toBeNull();
  });
});
