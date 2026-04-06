import { ApiError } from "./error.js";
import type { StreamEvent, Value } from "./types.js";

export class SseParser {
  private buffer: Uint8Array = new Uint8Array(0);

  push(chunk: Uint8Array): StreamEvent[] {
    const newBuffer = new Uint8Array(this.buffer.length + chunk.length);
    newBuffer.set(this.buffer, 0);
    newBuffer.set(chunk, this.buffer.length);
    this.buffer = newBuffer;

    const events: StreamEvent[] = [];
    let frame: string | undefined;

    while ((frame = this.nextFrame()) !== undefined) {
      const event = parseFrame(frame);
      if (event !== null) {
        events.push(event);
      }
    }

    return events;
  }

  finish(): StreamEvent[] {
    if (this.buffer.length === 0) {
      return [];
    }

    const frame = new TextDecoder()
      .decode(this.buffer)
      .trim();
    this.buffer = new Uint8Array(0);

    const event = parseFrame(frame);
    return event !== null ? [event] : [];
  }

  private nextFrame(): string | undefined {
    const doubleNewline = this.findSeparator([0x0a, 0x0a]);
    const doubleCarriageReturn = this.findSeparator([0x0d, 0x0a, 0x0d, 0x0a]);

    let position = 0;
    let separatorLen = 0;

    if (doubleNewline !== undefined && doubleCarriageReturn !== undefined) {
      if (doubleNewline.position < doubleCarriageReturn.position) {
        position = doubleNewline.position;
        separatorLen = 2;
      } else {
        position = doubleCarriageReturn.position;
        separatorLen = 4;
      }
    } else if (doubleNewline !== undefined) {
      position = doubleNewline.position;
      separatorLen = 2;
    } else if (doubleCarriageReturn !== undefined) {
      position = doubleCarriageReturn.position;
      separatorLen = 4;
    } else {
      return undefined;
    }

    const frame = this.buffer.slice(0, position + separatorLen);
    const frameLen = frame.length - separatorLen;
    const frameStr = new TextDecoder().decode(frame.slice(0, frameLen));

    this.buffer =
      this.buffer.length > position + separatorLen
        ? this.buffer.slice(position + separatorLen)
        : new Uint8Array(0);

    return frameStr;
  }

  private findSeparator(
    pattern: number[]
  ): { position: number; length: number } | undefined {
    for (let i = 0; i <= this.buffer.length - pattern.length; i++) {
      let match = true;
      for (let j = 0; j < pattern.length; j++) {
        if (this.buffer[i + j] !== pattern[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return { position: i, length: pattern.length };
      }
    }
    return undefined;
  }
}

function parseFrame(frame: string): StreamEvent | null {
  const trimmed = frame.trim();
  if (trimmed === "") {
    return null;
  }

  const dataLines: string[] = [];
  let eventName: string | undefined;

  for (const line of trimmed.split("\n")) {
    if (line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  if (eventName === "ping") {
    return null;
  }

  if (dataLines.length === 0) {
    return null;
  }

  const payload = dataLines.join("\n");
  if (payload === "[DONE]") {
    return null;
  }

  try {
    const parsed = JSON.parse(payload);
    return normalizeStreamEvent(parsed);
  } catch {
    throw ApiError.json(`failed to parse SSE frame: ${payload}`);
  }
}

function normalizeStreamEvent(
  parsed: Record<string, unknown>
): StreamEvent | null {
  const type = parsed.type as string;

  switch (type) {
    case "message_start": {
      const msg = parsed.message as Record<string, unknown>;
      return {
        type: "message_start",
        message_start: {
          message: {
            id: (msg.id as string) ?? "",
            type: (msg.type as string) ?? "message",
            role: (msg.role as string) ?? "assistant",
            content: [],
            model: (msg.model as string) ?? "",
            usage: {
              input_tokens: 0,
              output_tokens: 0,
            },
          },
        },
      };
    }
    case "message_delta": {
      const delta = parsed.delta as Record<string, unknown> | undefined;
      const usage = parsed.usage as Record<string, unknown> | undefined;
      return {
        type: "message_delta",
        message_delta: {
          delta: {
            stop_reason: delta?.stop_reason as string | undefined,
            stop_sequence: delta?.stop_sequence as string | undefined,
          },
          usage: {
            input_tokens: (usage?.input_tokens as number) ?? 0,
            output_tokens: (usage?.output_tokens as number) ?? 0,
          },
        },
      };
    }
    case "content_block_start": {
      const contentBlock = parsed.content_block as Record<string, unknown> | undefined;
      const blockType = contentBlock?.type as string | undefined;
      const index = parsed.index as number;
      
      if (blockType === "text") {
        return {
          type: "content_block_start",
          content_block_start: {
            index,
            content_block: {
              type: "text",
              text: (contentBlock.text as string) ?? "",
            },
          },
        };
      }
      if (blockType === "thinking") {
        return {
          type: "content_block_start",
          content_block_start: {
            index,
            content_block: {
              type: "thinking",
              thinking: (contentBlock.thinking as string) ?? "",
              signature: contentBlock.signature as string | undefined,
            },
          },
        };
      }
      if (blockType === "tool_use") {
        return {
          type: "content_block_start",
          content_block_start: {
            index,
            content_block: {
              type: "tool_use",
              id: (contentBlock.id as string) ?? "",
              name: (contentBlock.name as string) ?? "",
              input: (contentBlock.input as Value) ?? {},
            },
          },
        };
      }
      return null;
    }
    case "content_block_delta": {
      const delta = parsed.delta as Record<string, unknown> | undefined;
      const deltaType = delta?.type as string | undefined;
      const index = parsed.index as number;

      if (deltaType === "text_delta") {
        return {
          type: "content_block_delta",
          content_block_delta: {
            index,
            delta: {
              type: "text_delta",
              text: (delta.text as string) ?? "",
            },
          },
        };
      }
      if (deltaType === "input_json_delta") {
        return {
          type: "content_block_delta",
          content_block_delta: {
            index,
            delta: {
              type: "input_json_delta",
              partial_json: (delta.partial_json as string) ?? "",
            },
          },
        };
      }
      if (deltaType === "thinking_delta") {
        return {
          type: "content_block_delta",
          content_block_delta: {
            index,
            delta: {
              type: "thinking_delta",
              thinking: (delta.thinking as string) ?? "",
            },
          },
        };
      }
      if (deltaType === "signature_delta") {
        return {
          type: "content_block_delta",
          content_block_delta: {
            index,
            delta: {
              type: "signature_delta",
              signature: (delta.signature as string) ?? "",
            },
          },
        };
      }
      return null;
    }
    case "content_block_stop": {
      return {
        type: "content_block_stop",
        content_block_stop: {
          index: parsed.index as number,
        },
      };
    }
    case "message_stop": {
      return {
        type: "message_stop",
        message_stop: {},
      };
    }
    case "ping":
      return null;
    default:
      return null;
  }
}

export function parseFrameAndReturn(chunk: Uint8Array): StreamEvent[] {
  const parser = new SseParser();
  return parser.push(chunk);
}
