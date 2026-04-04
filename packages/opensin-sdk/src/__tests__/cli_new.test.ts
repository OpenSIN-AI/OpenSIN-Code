import { describe, it, expect } from 'vitest';
import { parseSSELine, parseSSEStream, parseEventData } from '../events.js';

describe('SSE Parser', () => {
  it('parses a simple SSE line', () => {
    const result = parseSSELine('data: hello world');
    expect(result.field).toBe('data');
    expect(result.value).toBe('hello world');
  });

  it('parses an event line', () => {
    const result = parseSSELine('event: message');
    expect(result.field).toBe('event');
    expect(result.value).toBe('message');
  });

  it('parses an empty line', () => {
    const result = parseSSELine('');
    expect(result.field).toBeUndefined();
    expect(result.value).toBe('');
  });

  it('parses a full SSE stream', () => {
    const text = 'data: {"content": "hello"}\n\ndata: {"done": true}\n\n';
    const events = parseSSEStream(text);
    expect(events).toHaveLength(2);
    expect(events[0].data).toBe('{"content": "hello"}');
    expect(events[1].data).toBe('{"done": true}');
  });

  it('parses event data into text chunk', () => {
    const chunk = parseEventData('{"content": "hello"}');
    expect(chunk.type).toBe('text');
    expect(chunk.content).toBe('hello');
  });

  it('handles error chunk', () => {
    const chunk = parseEventData('{"error": "something failed"}');
    expect(chunk.type).toBe('error');
    expect(chunk.error).toBe('something failed');
  });

  it('handles done chunk with usage', () => {
    const chunk = parseEventData('{"done": true, "usage": {"total_tokens": 10}}');
    expect(chunk.type).toBe('done');
    expect(chunk.usage?.total_tokens).toBe(10);
  });

  it('handles plain text fallback', () => {
    const chunk = parseEventData('not json');
    expect(chunk.type).toBe('text');
    expect(chunk.content).toBe('not json');
  });
});
