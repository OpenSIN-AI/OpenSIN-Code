import { describe, it, expect, beforeEach } from 'vitest';
import { createModelAnnouncer, getModelAwarenessPrompt } from '../plugins/model_announcer.js';

describe('ModelAnnouncer', () => {
  let ma: ReturnType<typeof createModelAnnouncer>;

  beforeEach(() => {
    ma = createModelAnnouncer('/tmp/test-announcer');
  });

  it('should initialize without errors', async () => {
    await expect(ma.init()).resolves.not.toThrow();
  });

  it('should return empty announcement when no model set', async () => {
    await ma.init();
    expect(ma.getAnnouncement()).toBe('');
  });

  it('should return announcement when model is set', async () => {
    await ma.init();
    ma.setModel('gpt-4o');
    const announcement = ma.getAnnouncement();
    expect(announcement).toContain('gpt-4o');
    expect(announcement).toContain('OpenAI');
  });

  it('should inject into system prompt', async () => {
    await ma.init();
    ma.setModel('gpt-4o');
    const enhanced = ma.injectIntoSystemPrompt('You are a helpful assistant.');
    expect(enhanced).toContain('You are a helpful assistant.');
    expect(enhanced).toContain('gpt-4o');
  });

  it('should get model info', async () => {
    await ma.init();
    const info = ma.getModelInfo('gpt-4o');
    expect(info).not.toBeNull();
    expect(info!.provider).toBe('OpenAI');
    expect(info!.capabilities).toContain('vision');
    expect(info!.contextWindow).toBe(128000);
  });

  it('should check vision capability', async () => {
    await ma.init();
    expect(ma.isVisionCapable('gpt-4o')).toBe(true);
    expect(ma.isVisionCapable('gemini-2.0-flash')).toBe(true);
    expect(ma.isVisionCapable('deepseek-chat')).toBe(false);
  });

  it('should check tool use capability', async () => {
    await ma.init();
    expect(ma.isToolUseCapable('gpt-4o')).toBe(true);
    expect(ma.isToolUseCapable('claude-3-5-sonnet-20241022')).toBe(true);
  });

  it('should get context window', async () => {
    await ma.init();
    expect(ma.getContextWindow('gpt-4o')).toBe(128000);
    expect(ma.getContextWindow('gemini-1.5-pro')).toBe(2097152);
    expect(ma.getContextWindow('unknown-model')).toBe(8192);
  });

  it('should list known models', async () => {
    await ma.init();
    const models = ma.listKnownModels();
    expect(models.length).toBeGreaterThan(5);
    expect(models).toContain('gpt-4o');
    expect(models).toContain('claude-3-5-sonnet-20241022');
  });
});

describe('getModelAwarenessPrompt', () => {
  it('should return a formatted prompt', () => {
    const prompt = getModelAwarenessPrompt('gpt-4o');
    expect(prompt).toContain('gpt-4o');
    expect(prompt).toContain('<model-identity>');
    expect(prompt).toContain('</model-identity>');
  });
});
