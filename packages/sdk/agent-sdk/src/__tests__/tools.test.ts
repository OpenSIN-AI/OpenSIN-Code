import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry, createTool, registerTools } from '../tools.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should register and retrieve a tool', () => {
    const tool = createTool('echo', 'Echo tool', {
      type: 'object',
      properties: { message: { type: 'string' } },
    }, async (input) => ({
      success: true,
      content: String(input.message || ''),
    }));

    const registered = registry.register(tool);
    expect(registered.name).toBe('echo');
    expect(registered.id).toBeTruthy();
    expect(registry.getTool('echo')).toBeDefined();
  });

  it('should unregister a tool', () => {
    const tool = createTool('temp', 'Temp', {
      type: 'object',
      properties: {},
    }, async () => ({ success: true, content: '' }));

    registry.register(tool);
    expect(registry.hasTool('temp')).toBe(true);

    registry.unregister('temp');
    expect(registry.hasTool('temp')).toBe(false);
  });

  it('should return all tools', () => {
    const toolA = createTool('a', 'A', { type: 'object', properties: {} }, async () => ({ success: true, content: '' }));
    const toolB = createTool('b', 'B', { type: 'object', properties: {} }, async () => ({ success: true, content: '' }));
    registry.register(toolA);
    registry.register(toolB);
    expect(registry.getAllTools()).toHaveLength(2);
  });

  it('should execute a tool', async () => {
    const addTool = createTool('add', 'Add numbers', {
      type: 'object',
      properties: { a: { type: 'number' }, b: { type: 'number' } },
    }, async (input) => ({
      success: true,
      content: String(Number(input.a) + Number(input.b)),
    }));

    registry.register(addTool);

    const result = await registry.executeTool('add', { a: 2, b: 3 }, {
      agentId: 'test',
      cwd: process.cwd(),
      permissions: { allowed: true },
    });

    expect(result.success).toBe(true);
    expect(result.content).toBe('5');
  });

  it('should return error for unknown tool', async () => {
    const result = await registry.executeTool('unknown', {}, {
      agentId: 'test',
      cwd: process.cwd(),
      permissions: { allowed: true },
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should get tool descriptions without handler', () => {
    const testTool = createTool('test', 'Test', {
      type: 'object',
      properties: { x: { type: 'string' } },
    }, async () => ({ success: true, content: '' }), ['tag1']);

    registry.register(testTool);

    const descriptions = registry.getToolDescriptions();
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]).toHaveProperty('name', 'test');
    expect(descriptions[0]).toHaveProperty('description', 'Test');
    expect(descriptions[0]).toHaveProperty('inputSchema');
    expect(descriptions[0]).toHaveProperty('tags');
    expect(descriptions[0]).not.toHaveProperty('handler');
  });

  it('should handle tool execution errors', async () => {
    const failTool = createTool('fail', 'Fail', {
      type: 'object',
      properties: {},
    }, async () => {
      throw new Error('Intentional failure');
    });

    registry.register(failTool);

    const result = await registry.executeTool('fail', {}, {
      agentId: 'test',
      cwd: process.cwd(),
      permissions: { allowed: true },
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Intentional failure');
  });
});

describe('createTool', () => {
  it('should create a tool definition', () => {
    const tool = createTool('test', 'Test tool', {
      type: 'object',
      properties: { input: { type: 'string' } },
    }, async () => ({ success: true, content: '' }), ['test']);

    expect(tool.name).toBe('test');
    expect(tool.description).toBe('Test tool');
    expect(tool.inputSchema.properties.input.type).toBe('string');
    expect(tool.tags).toEqual(['test']);
  });
});

describe('registerTools', () => {
  it('should register multiple tools at once', () => {
    const registry = new ToolRegistry();
    const toolA = createTool('a', 'A', { type: 'object', properties: {} }, async () => ({ success: true, content: '' }));
    const toolB = createTool('b', 'B', { type: 'object', properties: {} }, async () => ({ success: true, content: '' }));
    const toolC = createTool('c', 'C', { type: 'object', properties: {} }, async () => ({ success: true, content: '' }));
    const tools = [toolA, toolB, toolC];

    const registered = registerTools(registry, tools);
    expect(registered).toHaveLength(3);
    expect(registry.getAllTools()).toHaveLength(3);
  });
});
