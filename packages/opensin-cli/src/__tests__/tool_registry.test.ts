import { describe, it, expect, beforeEach } from 'vitest';
import { ToolRegistry } from '../tools/index.js';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;

  beforeEach(() => {
    registry = new ToolRegistry();
  });

  it('should return all built-in tools', () => {
    const tools = registry.getAllTools();
    expect(tools.length).toBeGreaterThan(0);
  });

  it('should list all tool names', () => {
    const names = registry.getAllTools().map(t => t.name);
    expect(names).toContain('Bash');
    expect(names).toContain('Read');
    expect(names).toContain('Write');
    expect(names).toContain('Edit');
    expect(names).toContain('Grep');
    expect(names).toContain('Glob');
  });

  it('should get tool by name', () => {
    const tool = registry.getTool('Bash');
    expect(tool).toBeDefined();
    expect(tool!.name).toBe('Bash');
  });

  it('should check if tool exists', () => {
    expect(registry.hasTool('Bash')).toBe(true);
    expect(registry.hasTool('nonexistent')).toBe(false);
  });

  it('should get tool descriptions without execute method', () => {
    const descriptions = registry.getToolDescriptions();
    expect(descriptions.length).toBeGreaterThan(0);
    for (const desc of descriptions) {
      expect(desc).toHaveProperty('name');
      expect(desc).toHaveProperty('description');
      expect(desc).toHaveProperty('parameters');
    }
  });

  it('should register and unregister a tool', () => {
    const newTool = {
      name: 'Custom',
      description: 'A custom tool',
      parameters: { type: 'object', properties: {}, required: [] },
      execute: async () => ({ output: 'ok' }),
    };
    registry.register(newTool as any);
    expect(registry.hasTool('Custom')).toBe(true);
    registry.unregister('Custom');
    expect(registry.hasTool('Custom')).toBe(false);
  });
});
