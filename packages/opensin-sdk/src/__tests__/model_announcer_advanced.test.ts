import { describe, it, expect, beforeEach } from 'vitest';
import { createModelAnnouncer, getModelAwarenessPrompt } from '../plugins/model_announcer.js';

describe('Model Announcer - Advanced', () => {
  let ma: ReturnType<typeof createModelAnnouncer>;

  beforeEach(() => {
    ma = createModelAnnouncer();
  });

  it('should return empty announcement when disabled', async () => {
    await ma.init();
    ma.setModel('gpt-4o');
    const announcement = ma.getAnnouncement();
    expect(announcement).toContain('gpt-4o');
  });

  it('should not inject when no model set', async () => {
    await ma.init();
    const enhanced = ma.injectIntoSystemPrompt('Base prompt');
    expect(enhanced).toBe('Base prompt');
  });

  it('should inject when model is set', async () => {
    await ma.init();
    ma.setModel('gpt-4o');
    const enhanced = ma.injectIntoSystemPrompt('Base prompt');
    expect(enhanced).toContain('Base prompt');
    expect(enhanced).toContain('gpt-4o');
  });

  it('should handle unknown models gracefully', async () => {
    await ma.init();
    ma.setModel('unknown-model-xyz');
    const info = ma.getModelInfo('unknown-model-xyz');
    expect(info).toBeNull();
  });

  it('should return correct context window for known models', async () => {
    await ma.init();
    expect(ma.getContextWindow('gpt-4o')).toBe(128000);
    expect(ma.getContextWindow('claude-3-5-sonnet-20241022')).toBe(200000);
    expect(ma.getContextWindow('gemini-1.5-pro')).toBe(2097152);
    expect(ma.getContextWindow('gemini-1.5-flash')).toBe(1048576);
    expect(ma.getContextWindow('deepseek-chat')).toBe(64000);
  });

  it('should list all known models', async () => {
    await ma.init();
    const models = ma.listKnownModels();
    expect(models.length).toBeGreaterThan(8);
    expect(models).toContain('gpt-4o');
    expect(models).toContain('claude-3-opus-20240229');
    expect(models).toContain('gemini-2.0-flash');
  });
});
