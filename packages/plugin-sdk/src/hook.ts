// src/hook.ts
import { HookDefinition, PluginContext } from './context.js';

export function createHook(definition: HookDefinition): HookDefinition {
  // Validate hook definition
  if (!definition.event || !definition.handler) {
    throw new Error('Hook must have event and handler');
  }

  return {
    priority: 0,
    ...definition,
  };
}

// Pre-defined hook events
export const HookEvents = {
  // Session lifecycle
  SESSION_START: 'session:start',
  SESSION_END: 'session:end',
  SESSION_PAUSE: 'session:pause',
  SESSION_RESUME: 'session:resume',

  // Tool execution
  TOOL_EXECUTE_BEFORE: 'tool:execute:before',
  TOOL_EXECUTE_AFTER: 'tool:execute:after',
  TOOL_EXECUTE_ERROR: 'tool:execute:error',

  // Message handling
  MESSAGE_RECEIVE: 'message:receive',
  MESSAGE_SEND: 'message:send',
  MESSAGE_PARSE_BEFORE: 'message:parse:before',
  MESSAGE_PARSE_AFTER: 'message:parse:after',

  // Context management
  CONTEXT_UPDATE: 'context:update',
  CONTEXT_PRUNE: 'context:prune',

  // Plugin lifecycle
  PLUGIN_ACTIVATE: 'plugin:activate',
  PLUGIN_DEACTIVATE: 'plugin:deactivate',

  // Custom events
  CUSTOM: (eventName: string) => `custom:${eventName}`,
} as const;