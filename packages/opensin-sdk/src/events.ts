/**
 * SSE Event Streaming Parser
 * 
 * Parses Server-Sent Events (SSE) streams from the OpenSIN API.
 */

import { SSEEvent, StreamChunk } from './types.js';

/**
 * Parse a single SSE line into an event component.
 */
export function parseSSELine(line: string): { field?: string; value: string } {
  if (line === '') {
    return { field: undefined, value: '' };
  }
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return { field: line, value: '' };
  }
  const field = line.slice(0, colonIndex);
  const value = line.slice(colonIndex + 1).replace(/^ /, '');
  return { field, value };
}

/**
 * Parse a full SSE stream into individual events.
 */
export function parseSSEStream(text: string): SSEEvent[] {
  const events: SSEEvent[] = [];
  let currentEvent: Partial<SSEEvent> = {};
  
  for (const line of text.split('\n')) {
    const { field, value } = parseSSELine(line);
    
    if (field === undefined) {
      // Empty line = end of event
      if (currentEvent.data !== undefined) {
        events.push(currentEvent as SSEEvent);
        currentEvent = {};
      }
    } else if (field === 'event') {
      currentEvent.event = value;
    } else if (field === 'data') {
      currentEvent.data = currentEvent.data
        ? currentEvent.data + '\n' + value
        : value;
    } else if (field === 'id') {
      currentEvent.id = value;
    } else if (field === 'retry') {
      currentEvent.retry = parseInt(value, 10);
    }
  }
  
  // Flush last event
  if (currentEvent.data !== undefined) {
    events.push(currentEvent as SSEEvent);
  }
  
  return events;
}

/**
 * Parse SSE event data into stream chunks.
 */
export function parseEventData(data: string): StreamChunk {
  try {
    const parsed = JSON.parse(data);
    
    if (parsed.error) {
      return { type: 'error', error: parsed.error };
    }
    
    if (parsed.done) {
      return { type: 'done', usage: parsed.usage };
    }
    
    if (parsed.tool_call) {
      return { type: 'tool_use', tool_call: parsed.tool_call };
    }
    
    if (parsed.tool_result) {
      return { type: 'tool_result', tool_result: parsed.tool_result };
    }
    
    if (parsed.content) {
      return { type: 'text', content: parsed.content };
    }
    
    return { type: 'text', content: data };
  } catch {
    return { type: 'text', content: data };
  }
}

/**
 * Stream SSE from a fetch response, yielding parsed events.
 */
export async function* streamSSE(
  response: Response,
): AsyncGenerator<StreamChunk, void, unknown> {
  if (!response.body) {
    throw new Error('Response body is null');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      let currentData = '';
      
      for (const line of lines) {
        if (line === '') {
          // End of event
          if (currentData) {
            yield parseEventData(currentData);
            currentData = '';
          }
        } else if (line.startsWith('data: ')) {
          currentData += line.slice(6);
        } else if (line.startsWith('data:')) {
          currentData += line.slice(5);
        }
      }
    }
    
    // Process remaining buffer
    if (buffer.trim()) {
      const events = parseSSEStream(buffer);
      for (const event of events) {
        if (event.data) {
          yield parseEventData(event.data);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
