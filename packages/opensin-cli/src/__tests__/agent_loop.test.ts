import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentLoop } from '../core/agent.js';
import type { Config, Message } from '../core/types.js';
import { ToolRegistry } from '../tools/index.js';

vi.mock('../utils/llm.js', () => ({
  callLLM: vi.fn(),
}));

describe('AgentLoop', () => {
  let agent: AgentLoop;
  let config: Config;
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    config = { model: 'test-model' };
    toolRegistry = new ToolRegistry();
    agent = new AgentLoop(config, toolRegistry);
  });

  it('should create instance with config and registry', () => {
    expect(agent).toBeInstanceOf(AgentLoop);
  });

  it('should return messages from start', async () => {
    const { callLLM } = await import('../utils/llm.js');
    vi.mocked(callLLM).mockResolvedValue({
      role: 'assistant',
      content: 'Hello from mock',
    });

    const messages = await agent.start('Hi', undefined);
    expect(messages.length).toBeGreaterThan(0);
    expect(messages[0].role).toBe('user');
  });

  it('should call LLM with messages', async () => {
    const { callLLM } = await import('../utils/llm.js');
    vi.mocked(callLLM).mockResolvedValue({
      role: 'assistant',
      content: 'Done',
    });

    await agent.start('Test query', undefined);
    expect(callLLM).toHaveBeenCalled();
    const callArgs = vi.mocked(callLLM).mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(Array);
  });

  it('should set callbacks', () => {
    const onMessage = vi.fn();
    const onToolCall = vi.fn();
    const onToolResult = vi.fn();

    agent.setCallbacks({ onMessage, onToolCall, onToolResult });
    expect(onMessage).not.toHaveBeenCalled();
  });

  it('should stop the agent loop', async () => {
    const { callLLM } = await import('../utils/llm.js');
    vi.mocked(callLLM).mockImplementation(async () => {
      agent.stop();
      return { role: 'assistant', content: 'stopped' };
    });

    const messages = await agent.start('stop me', undefined);
    expect(messages.length).toBeLessThanOrEqual(2);
  });

  it('should get current messages', () => {
    const msgs = agent.getMessages();
    expect(msgs).toBeInstanceOf(Array);
  });

  it('should handle LLM errors gracefully', async () => {
    const { callLLM } = await import('../utils/llm.js');
    vi.mocked(callLLM).mockRejectedValue(new Error('API failed'));

    const messages = await agent.start('Test', undefined);
    const lastMsg = messages[messages.length - 1];
    expect(lastMsg.content).toContain('Error');
  });

  it('should resume session with existing messages', async () => {
    const { callLLM } = await import('../utils/llm.js');
    vi.mocked(callLLM).mockResolvedValue({
      role: 'assistant',
      content: 'Resumed response',
    });

    const existingSession = {
      sessionId: 'test-session',
      title: 'Test',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        { role: 'user', content: 'Previous message' },
        { role: 'assistant', content: 'Previous response' },
      ],
      cwd: '/tmp',
    };

    const messages = await agent.start('New message', existingSession as any);
    const userMsgs = messages.filter((m) => m.role === 'user');
    expect(userMsgs.length).toBe(2);
    expect(userMsgs[0].content).toBe('Previous message');
    expect(userMsgs[1].content).toBe('New message');
  });
});
