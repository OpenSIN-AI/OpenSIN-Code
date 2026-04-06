import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { A2AServer, A2AClient } from '../transport';

describe('A2A Transport Layer', () => {
  const TEST_PORT = 31999;
  const TEST_TOKEN = 'test-secret-token';
  const server = new A2AServer({ port: TEST_PORT, agentId: 'test-agent', expectedToken: TEST_TOKEN });
  const client = new A2AClient(TEST_TOKEN);
  const badClient = new A2AClient('wrong-token');

  beforeAll(() => {
    server.onTask(async (payload) => {
      if (payload.instruction === 'fail') throw new Error('Simulated failure');
      return {
        taskId: payload.taskId,
        status: 'completed',
        result: `Echo: ${payload.instruction}`
      };
    });
    server.start();
  });

  // Small delay to let server bind
  beforeAll(async () => new Promise(r => setTimeout(r, 500)));

  it('should pass health check with valid token', async () => {
    const health = await client.pingHealth(`http://localhost:${TEST_PORT}`);
    expect(health).not.toBeNull();
    expect(health?.agentId).toBe('test-agent');
    expect(health?.status).toBe('alive');
  });

  it('should reject health check with invalid token', async () => {
    const health = await badClient.pingHealth(`http://localhost:${TEST_PORT}`);
    expect(health).toBeNull();
  });

  it('should execute a task successfully', async () => {
    const response = await client.dispatchTask(`http://localhost:${TEST_PORT}`, {
      taskId: 'task-1',
      requesterId: 'test-manager',
      targetId: 'test-agent',
      instruction: 'hello world'
    });
    
    expect(response.status).toBe('completed');
    expect(response.result).toBe('Echo: hello world');
  });

  it('should handle task failures gracefully', async () => {
    const response = await client.dispatchTask(`http://localhost:${TEST_PORT}`, {
      taskId: 'task-2',
      requesterId: 'test-manager',
      targetId: 'test-agent',
      instruction: 'fail'
    });
    
    expect(response.status).toBe('failed');
    expect(response.error).toBe('Simulated failure');
  });
});
