import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpStdioClient } from '../mcp_stdio/client';
import { McpServerManager } from '../mcp_stdio/server_manager';
import { discoverTools, discoverResources, callTool, readResource } from '../mcp_stdio/tool_discovery';
import { listResources, readMcpResource, listResourceTemplates } from '../mcp_stdio/resource_access';

vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    stdin: { write: vi.fn() },
    on: vi.fn(),
    kill: vi.fn(),
    pid: 12345,
    killed: false,
  })),
}));

describe('McpStdioClient', () => {
  let client: McpStdioClient;

  beforeEach(() => {
    client = new McpStdioClient({
      name: 'test-server',
      command: 'node',
      args: ['server.js'],
      timeout: 5000,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('creates client with config', () => {
    expect(client).toBeDefined();
    expect(client.isRunning()).toBe(false);
  });

  it('returns undefined pid when not running', () => {
    expect(client.getPid()).toBeUndefined();
  });
});

describe('McpServerManager', () => {
  let manager: McpServerManager;

  beforeEach(() => {
    manager = new McpServerManager({
      name: 'test-server',
      command: 'node',
      args: ['server.js'],
    }, {
      maxRestarts: 2,
      restartDelay: 100,
      healthCheckInterval: 5000,
    });
  });

  it('creates manager with stopped status', () => {
    const health = manager.getHealth();
    expect(health.status).toBe('stopped');
    expect(health.restartCount).toBe(0);
  });

  it('returns null client when stopped', () => {
    expect(manager.getClient()).toBeNull();
  });
});

describe('tool_discovery', () => {
  it('exports discoverTools function', () => {
    expect(typeof discoverTools).toBe('function');
  });

  it('exports discoverResources function', () => {
    expect(typeof discoverResources).toBe('function');
  });

  it('exports callTool function', () => {
    expect(typeof callTool).toBe('function');
  });

  it('exports readResource function', () => {
    expect(typeof readResource).toBe('function');
  });
});

describe('resource_access', () => {
  it('exports listResources function', () => {
    expect(typeof listResources).toBe('function');
  });

  it('exports readMcpResource function', async () => {
    const mcpStdio = await import('../mcp_stdio/index');
    expect(typeof mcpStdio.readMcpResource).toBe('function');
  });

  it('exports listResourceTemplates function', () => {
    expect(typeof listResourceTemplates).toBe('function');
  });
});

describe('mcp_stdio exports', () => {
  it('exports all public API from index', async () => {
    const mcpStdio = await import('../mcp_stdio/index');
    expect(mcpStdio.McpStdioClient).toBeDefined();
    expect(mcpStdio.McpServerManager).toBeDefined();
    expect(mcpStdio.discoverTools).toBeDefined();
    expect(mcpStdio.discoverResources).toBeDefined();
    expect(mcpStdio.callTool).toBeDefined();
    expect(mcpStdio.readResource).toBeDefined();
    expect(mcpStdio.listResources).toBeDefined();
    expect(mcpStdio.readMcpResource).toBeDefined();
    expect(mcpStdio.listResourceTemplates).toBeDefined();
  });
});
