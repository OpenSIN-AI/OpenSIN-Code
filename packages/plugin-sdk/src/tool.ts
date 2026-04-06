import { ToolDefinition } from './context.js';

export function createTool(definition: ToolDefinition): ToolDefinition {
  if (!definition.name || !definition.description || !definition.execute) {
    throw new Error('Tool must have name, description, and execute function');
  }

  if (definition.parameters) {
    for (const [paramName, paramDef] of Object.entries(definition.parameters)) {
      const def = paramDef as { type?: string };
      if (!def.type) {
        throw new Error(`Parameter ${paramName} must have a type`);
      }
    }
  }

  return definition;
}

export const ParamTypes = {
  string: (options: {
    required?: boolean;
    description?: string;
    default?: string;
    enum?: string[];
  } = {}) => ({
    type: 'string' as const,
    ...options,
  }),

  number: (options: {
    required?: boolean;
    description?: string;
    default?: number;
    minimum?: number;
    maximum?: number;
  } = {}) => ({
    type: 'number' as const,
    ...options,
  }),

  boolean: (options: {
    required?: boolean;
    description?: string;
    default?: boolean;
  } = {}) => ({
    type: 'boolean' as const,
    ...options,
  }),

  array: (options: {
    required?: boolean;
    description?: string;
    default?: unknown[];
    items?: Record<string, unknown>;
  } = {}) => ({
    type: 'array' as const,
    ...options,
  }),

  object: (options: {
    required?: boolean;
    description?: string;
    default?: Record<string, unknown>;
    properties?: Record<string, Record<string, unknown>>;
  } = {}) => ({
    type: 'object' as const,
    ...options,
  }),
};
