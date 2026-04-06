import { describe, it, expect } from 'vitest';
import { createTool, ParamTypes } from './tool.js';

describe('createTool', () => {
  it('should create a valid tool definition', () => {
    const tool = createTool({
      name: 'test_tool',
      description: 'A test tool',
      parameters: {
        input: { type: 'string', required: true },
      },
      execute: async () => ({ content: 'test' }),
    });

    expect(tool.name).toBe('test_tool');
    expect(tool.description).toBe('A test tool');
    expect(tool.execute).toBeDefined();
  });

  it('should throw if name is missing', () => {
    expect(() => createTool({
      name: '',
      description: 'test',
      execute: async () => ({ content: '' }),
    })).toThrow('Tool must have name, description, and execute function');
  });

  it('should throw if description is missing', () => {
    expect(() => createTool({
      name: 'test',
      description: '',
      execute: async () => ({ content: '' }),
    })).toThrow('Tool must have name, description, and execute function');
  });

  it('should throw if execute is missing', () => {
    expect(() => createTool({
      name: 'test',
      description: 'test',
      execute: undefined as any,
    })).toThrow('Tool must have name, description, and execute function');
  });

  it('should throw if parameter has no type', () => {
    expect(() => createTool({
      name: 'test',
      description: 'test',
      parameters: {
        badParam: {} as any,
      },
      execute: async () => ({ content: '' }),
    })).toThrow('Parameter badParam must have a type');
  });

  it('should accept tool with no parameters', () => {
    const tool = createTool({
      name: 'no_params_tool',
      description: 'No parameters needed',
      parameters: {},
      execute: async () => ({ content: 'done' }),
    });
    expect(tool.name).toBe('no_params_tool');
  });
});

describe('ParamTypes', () => {
  it('should create string param', () => {
    const param = ParamTypes.string({ required: true, description: 'A string' });
    expect(param.type).toBe('string');
    expect(param.required).toBe(true);
    expect(param.description).toBe('A string');
  });

  it('should create number param with constraints', () => {
    const param = ParamTypes.number({
      required: true,
      minimum: 0,
      maximum: 100,
      default: 50,
    });
    expect(param.type).toBe('number');
    expect(param.minimum).toBe(0);
    expect(param.maximum).toBe(100);
    expect(param.default).toBe(50);
  });

  it('should create boolean param', () => {
    const param = ParamTypes.boolean({ default: false });
    expect(param.type).toBe('boolean');
    expect(param.default).toBe(false);
  });

  it('should create array param', () => {
    const param = ParamTypes.array({
      description: 'A list',
      items: { type: 'string' },
    });
    expect(param.type).toBe('array');
    expect(param.items).toEqual({ type: 'string' });
  });

  it('should create object param', () => {
    const param = ParamTypes.object({
      properties: {
        name: { type: 'string' },
        age: { type: 'number' },
      },
    });
    expect(param.type).toBe('object');
    expect(param.properties).toBeDefined();
  });
});
