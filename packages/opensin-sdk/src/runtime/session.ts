export enum MessageRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
  Tool = 'tool',
}

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'toolUse'; id: string; name: string; input: string }
  | { type: 'toolResult'; toolUseId: string; toolName: string; output: string; isError: boolean };

export interface ConversationMessage {
  role: MessageRole;
  blocks: ContentBlock[];
  usage: TokenUsage | null;
}

export interface Session {
  version: number;
  messages: ConversationMessage[];
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

export class SessionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'SessionError';
  }
}

export function createSession(): Session {
  return {
    version: 1,
    messages: [],
  };
}

export function saveSessionToPath(session: Session, filePath: string): void {
  const json = sessionToJson(session);
  return;
}

export function loadSessionFromPath(filePath: string): Session {
  return createSession();
}

export function sessionToJson(session: Session): JsonValue {
  const obj: Record<string, JsonValue> = {
    version: session.version,
    messages: session.messages.map(conversationMessageToJson),
  };
  return obj;
}

export function sessionFromJson(value: JsonValue): Session {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SessionError('session must be an object');
  }

  const obj = value as Record<string, JsonValue>;
  const version = obj.version;
  if (typeof version !== 'number') {
    throw new SessionError('missing version');
  }

  const messagesValue = obj.messages;
  if (!Array.isArray(messagesValue)) {
    throw new SessionError('missing messages');
  }

  const messages = messagesValue.map(conversationMessageFromJson);

  return { version, messages };
}

export function conversationMessageUserText(text: string): ConversationMessage {
  return {
    role: MessageRole.User,
    blocks: [{ type: 'text', text }],
    usage: null,
  };
}

export function conversationMessageAssistant(blocks: ContentBlock[]): ConversationMessage {
  return {
    role: MessageRole.Assistant,
    blocks,
    usage: null,
  };
}

export function conversationMessageAssistantWithUsage(
  blocks: ContentBlock[],
  usage: TokenUsage | null
): ConversationMessage {
  return {
    role: MessageRole.Assistant,
    blocks,
    usage,
  };
}

export function conversationMessageToolResult(
  toolUseId: string,
  toolName: string,
  output: string,
  isError: boolean
): ConversationMessage {
  return {
    role: MessageRole.Tool,
    blocks: [{
      type: 'toolResult',
      toolUseId,
      toolName,
      output,
      isError,
    }],
    usage: null,
  };
}

export function conversationMessageToJson(message: ConversationMessage): JsonValue {
  const obj: Record<string, JsonValue> = {
    role: message.role,
    blocks: message.blocks.map(contentBlockToJson),
  };
  if (message.usage) {
    obj.usage = tokenUsageToJson(message.usage);
  }
  return obj;
}

export function conversationMessageFromJson(value: JsonValue): ConversationMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SessionError('message must be an object');
  }

  const obj = value as Record<string, JsonValue>;
  const roleValue = obj.role;
  if (typeof roleValue !== 'string') {
    throw new SessionError('missing role');
  }

  const role = parseMessageRole(roleValue);

  const blocksValue = obj.blocks;
  if (!Array.isArray(blocksValue)) {
    throw new SessionError('missing blocks');
  }

  const blocks = blocksValue.map(contentBlockFromJson);

  const usage = obj.usage ? tokenUsageFromJson(obj.usage) : null;

  return { role, blocks, usage };
}

function parseMessageRole(value: string): MessageRole {
  switch (value) {
    case 'system': return MessageRole.System;
    case 'user': return MessageRole.User;
    case 'assistant': return MessageRole.Assistant;
    case 'tool': return MessageRole.Tool;
    default:
      throw new SessionError(`unsupported message role: ${value}`);
  }
}

function contentBlockToJson(block: ContentBlock): JsonValue {
  switch (block.type) {
    case 'text':
      return { type: 'text', text: block.text };
    case 'toolUse':
      return { type: 'toolUse', id: block.id, name: block.name, input: block.input };
    case 'toolResult':
      return {
        type: 'toolResult',
        tool_use_id: block.toolUseId,
        tool_name: block.toolName,
        output: block.output,
        is_error: block.isError,
      };
  }
}

function contentBlockFromJson(value: JsonValue): ContentBlock {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SessionError('block must be an object');
  }

  const obj = value as Record<string, JsonValue>;
  const type = obj.type;
  if (typeof type !== 'string') {
    throw new SessionError('missing block type');
  }

  switch (type) {
    case 'text':
      return {
        type: 'text',
        text: requiredString(obj, 'text'),
      };
    case 'toolUse':
      return {
        type: 'toolUse',
        id: requiredString(obj, 'id'),
        name: requiredString(obj, 'name'),
        input: requiredString(obj, 'input'),
      };
    case 'toolResult':
      return {
        type: 'toolResult',
        toolUseId: requiredString(obj, 'tool_use_id'),
        toolName: requiredString(obj, 'tool_name'),
        output: requiredString(obj, 'output'),
        isError: requiredBool(obj, 'is_error'),
      };
    default:
      throw new SessionError(`unsupported block type: ${type}`);
  }
}

function tokenUsageToJson(usage: TokenUsage): JsonValue {
  return {
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    cache_creation_input_tokens: usage.cacheCreationInputTokens,
    cache_read_input_tokens: usage.cacheReadInputTokens,
  };
}

function tokenUsageFromJson(value: JsonValue): TokenUsage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new SessionError('usage must be an object');
  }

  const obj = value as Record<string, JsonValue>;
  return {
    inputTokens: requiredU32(obj, 'input_tokens'),
    outputTokens: requiredU32(obj, 'output_tokens'),
    cacheCreationInputTokens: requiredU32(obj, 'cache_creation_input_tokens'),
    cacheReadInputTokens: requiredU32(obj, 'cache_read_input_tokens'),
  };
}

function requiredString(obj: Record<string, JsonValue>, key: string): string {
  const value = obj[key];
  if (typeof value === 'string') return value;
  throw new SessionError(`missing ${key}`);
}

function requiredBool(obj: Record<string, JsonValue>, key: string): boolean {
  const value = obj[key];
  if (typeof value === 'boolean') return value;
  throw new SessionError(`missing ${key}`);
}

function requiredU32(obj: Record<string, JsonValue>, key: string): number {
  const value = obj[key];
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  throw new SessionError(`missing ${key}`);
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export class ConversationMessageBuilder {
  private role: MessageRole;
  private blocks: ContentBlock[] = [];
  private usage: TokenUsage | null = null;

  constructor(role: MessageRole) {
    this.role = role;
  }

  addText(text: string): this {
    this.blocks.push({ type: 'text', text });
    return this;
  }

  addToolUse(id: string, name: string, input: string): this {
    this.blocks.push({ type: 'toolUse', id, name, input });
    return this;
  }

  addToolResult(toolUseId: string, toolName: string, output: string, isError: boolean): this {
    this.blocks.push({ type: 'toolResult', toolUseId, toolName, output, isError });
    return this;
  }

  setUsage(usage: TokenUsage): this {
    this.usage = usage;
    return this;
  }

  build(): ConversationMessage {
    return {
      role: this.role,
      blocks: this.blocks,
      usage: this.usage,
    };
  }
}

export function createConversationMessage(role: MessageRole): ConversationMessageBuilder {
  return new ConversationMessageBuilder(role);
}

export function tokenUsageTotalTokens(usage: TokenUsage): number {
  return (
    usage.inputTokens +
    usage.outputTokens +
    usage.cacheCreationInputTokens +
    usage.cacheReadInputTokens
  );
}