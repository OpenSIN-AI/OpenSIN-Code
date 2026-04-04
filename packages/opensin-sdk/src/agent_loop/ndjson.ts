/**
 * OpenSIN Agent Loop — NDJSON Streaming
 *
 * Handles Newline-Delimited JSON output for the agent loop.
 * Each line is a valid JSON object representing an agent event.
 */

import type { AgentEvent, AgentEventType, NDJSONLine } from './types.js';

/**
 * Convert an AgentEvent to an NDJSON-compatible line.
 */
export function toNDJSONLine(event: AgentEvent): string {
  const line: NDJSONLine = {
    type: event.type,
    ts: event.timestamp,
    ...event.data,
  };
  if (event.turnId) {
    line.turn = event.turnId;
  }
  return JSON.stringify(line);
}

/**
 * Emit an NDJSON line to stdout.
 */
export function emitNDJSON(event: AgentEvent): void {
  const line = toNDJSONLine(event);
  process.stdout.write(line + '\n');
}

/**
 * Create a typed AgentEvent with timestamp.
 */
export function makeEvent(
  type: AgentEventType,
  data: Record<string, unknown>,
  turnId?: string,
): AgentEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    turnId,
    data,
  };
}

/**
 * Parse a single NDJSON line into an AgentEvent.
 * Returns null if the line is not valid JSON.
 */
export function parseNDJSONLine(line: string): AgentEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as NDJSONLine;
    const { type, ts, turn, ...data } = parsed;
    return {
      type: type as AgentEventType,
      timestamp: ts || new Date().toISOString(),
      turnId: turn,
      data,
    };
  } catch {
    return null;
  }
}

/**
 * Parse a stream of NDJSON lines from a string.
 */
export function parseNDJSONStream(text: string): AgentEvent[] {
  const events: AgentEvent[] = [];
  for (const line of text.split('\n')) {
    const event = parseNDJSONLine(line);
    if (event) {
      events.push(event);
    }
  }
  return events;
}

/**
 * Create an async generator that yields parsed NDJSON events from a ReadableStream.
 */
export async function* streamNDJSON(
  stream: AsyncIterable<string>,
): AsyncGenerator<AgentEvent, void, unknown> {
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk;
    const lines = buffer.split('\n');
    // Keep the last (potentially incomplete) line in the buffer
    buffer = lines.pop() || '';

    for (const line of lines) {
      const event = parseNDJSONLine(line);
      if (event) {
        yield event;
      }
    }
  }

  // Flush remaining buffer
  if (buffer.trim()) {
    const event = parseNDJSONLine(buffer);
    if (event) {
      yield event;
    }
  }
}
