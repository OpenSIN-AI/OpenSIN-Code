export type Value = string | number | boolean | null | Value[] | { [key: string]: Value };

export interface MessageRequest {
  model: string;
  max_tokens: number;
  messages: InputMessage[];
  system?: string;
  tools?: ToolDefinition[];
  tool_choice?: ToolChoice;
  stream?: boolean;
}

export function createMessageRequest(options: {
  model: string;
  maxTokens?: number;
  messages: InputMessage[];
  system?: string;
  tools?: ToolDefinition[];
  toolChoice?: ToolChoice;
  stream?: boolean;
}): MessageRequest {
  return {
    model: options.model,
    max_tokens: options.maxTokens ?? 4096,
    messages: options.messages,
    system: options.system,
    tools: options.tools,
    tool_choice: options.toolChoice,
    stream: options.stream,
  };
}

export interface InputMessage {
  role: string;
  content: InputContentBlock[];
}

export function createUserTextMessage(text: string): InputMessage {
  return {
    role: "user",
    content: [{ type: "text", text }],
  };
}

export function createUserToolResultMessage(
  toolUseId: string,
  content: string,
  isError: boolean = false
): InputMessage {
  return {
    role: "user",
    content: [
      {
        type: "tool_result",
        tool_use_id: toolUseId,
        content: [{ type: "text", text: content }],
        is_error: isError,
      },
    ],
  };
}

export type InputContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Value }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: ToolResultContentBlock[];
      is_error?: boolean;
    };

export type ToolResultContentBlock =
  | { type: "text"; text: string }
  | { type: "json"; value: Value };

export interface ToolDefinition {
  name: string;
  description?: string;
  input_schema: Value;
}

export type ToolChoice =
  | { type: "auto" }
  | { type: "any" }
  | { type: "tool"; name: string };

export interface MessageResponse {
  id: string;
  type: string;
  role: string;
  content: OutputContentBlock[];
  model: string;
  stop_reason?: string;
  stop_sequence?: string;
  usage: Usage;
  request_id?: string;
}

export function getTotalTokens(response: MessageResponse): number {
  return response.usage.input_tokens + response.usage.output_tokens;
}

export type OutputContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Value }
  | { type: "thinking"; thinking: string; signature?: string }
  | { type: "redacted_thinking"; data: Value };

export interface Usage {
  input_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
  output_tokens: number;
}

export interface MessageStartEvent {
  message: MessageResponse;
}

export interface MessageDeltaEvent {
  delta: MessageDelta;
  usage: Usage;
}

export interface MessageDelta {
  stop_reason?: string;
  stop_sequence?: string;
}

export interface ContentBlockStartEvent {
  index: number;
  content_block: OutputContentBlock;
}

export interface ContentBlockDeltaEvent {
  index: number;
  delta: ContentBlockDelta;
}

export type ContentBlockDelta =
  | { type: "text_delta"; text: string }
  | { type: "input_json_delta"; partial_json: string }
  | { type: "thinking_delta"; thinking: string }
  | { type: "signature_delta"; signature: string };

export interface ContentBlockStopEvent {
  index: number;
}

export interface MessageStopEvent {}

export type StreamEvent =
  | { type: "message_start"; message_start: MessageStartEvent }
  | { type: "message_delta"; message_delta: MessageDeltaEvent }
  | { type: "content_block_start"; content_block_start: ContentBlockStartEvent }
  | { type: "content_block_delta"; content_block_delta: ContentBlockDeltaEvent }
  | { type: "content_block_stop"; content_block_stop: ContentBlockStopEvent }
  | { type: "message_stop"; message_stop: MessageStopEvent };

export function isStreamEvent(obj: unknown): obj is StreamEvent {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    o.type === "message_start" ||
    o.type === "message_delta" ||
    o.type === "content_block_start" ||
    o.type === "content_block_delta" ||
    o.type === "content_block_stop" ||
    o.type === "message_stop"
  );
}
