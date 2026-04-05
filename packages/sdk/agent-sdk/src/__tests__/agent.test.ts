import { describe, it, expect, beforeEach } from 'vitest';
import { Agent, AgentBuilder, createAgent } from '../agent.js';
import { ToolRegistry } from '../tools.js';
import { PermissionManager } from '../permissions.js';

describe('Agent', () => {
  it('should create agent with config', () => {
    const agent = createAgent({
      id: 'test-agent',
      name: 'Test Agent',
      description: 'A test agent',
      version: '0.1.0',
    });

    expect(agent).toBeInstanceOf(Agent);
    expect(agent.getConfig().name).toBe('Test Agent');
  });

  it('should have correct initial lifecycle state', () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    const lifecycle = agent.getLifecycle();
    expect(lifecycle.initialized).toBe(true);
    expect(lifecycle.running).toBe(false);
    expect(lifecycle.error).toBeNull();
  });

  it('should start and stop agent', async () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    await agent.start();
    expect(agent.getLifecycle().running).toBe(true);

    await agent.stop();
    expect(agent.getLifecycle().running).toBe(false);
    expect(agent.getLifecycle().stoppedAt).not.toBeNull();
  });

  it('should throw if starting already running agent', async () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    await agent.start();
    await expect(agent.start()).rejects.toThrow('already running');
    await agent.stop();
  });

  it('should throw if stopping non-running agent', async () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    await expect(agent.stop()).rejects.toThrow('not running');
  });

  it('should return tool registry and permission manager', () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    expect(agent.getToolRegistry()).toBeInstanceOf(ToolRegistry);
    expect(agent.getPermissionManager()).toBeInstanceOf(PermissionManager);
  });

  it('should return empty tool calls initially', () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    expect(agent.getToolCalls()).toEqual([]);
  });

  it('should run agent and return result', async () => {
    const agent = createAgent({
      id: 'test',
      name: 'Test',
      description: '',
      version: '0.1.0',
    });

    const result = await agent.run();
    expect(result.success).toBe(true);
    expect(result.output).toContain('Test');
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

describe('AgentBuilder', () => {
  it('should build agent with fluent API', () => {
    const agent = new AgentBuilder()
      .setId('my-agent')
      .setName('My Agent')
      .setDescription('My custom agent')
      .setVersion('1.0.0')
      .setMaxConcurrentTasks(5)
      .setTimeout(30000)
      .build();

    const config = agent.getConfig();
    expect(config.id).toBe('my-agent');
    expect(config.name).toBe('My Agent');
    expect(config.description).toBe('My custom agent');
    expect(config.version).toBe('1.0.0');
    expect(config.maxConcurrentTasks).toBe(5);
    expect(config.timeout).toBe(30000);
  });

  it('should throw if id or name missing', () => {
    expect(() => new AgentBuilder().build()).toThrow('required');
    expect(() => new AgentBuilder().setId('x').build()).toThrow('required');
    expect(() => new AgentBuilder().setName('y').build()).toThrow('required');
  });

  it('should use defaults for optional fields', () => {
    const agent = new AgentBuilder()
      .setId('x')
      .setName('y')
      .build();

    const config = agent.getConfig();
    expect(config.description).toBe('');
    expect(config.version).toBe('0.1.0');
  });
});
