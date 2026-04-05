import { describe, it, expect, beforeEach } from 'vitest';
import { MorphFastApply, createMorphFastApply, MorphFastApplyTool } from '../tools_v2/MorphFastApplyTool/index.js';

describe('MorphFastApply', () => {
  let morph: MorphFastApply;

  beforeEach(() => {
    morph = createMorphFastApply('/tmp/test-morph');
  });

  it('should initialize without errors', async () => {
    await expect(morph.init()).resolves.not.toThrow();
  });

  it('should return false when no API key configured', async () => {
    const available = await morph.init();
    expect(available).toBe(false);
  });

  it('should return error when applying without API key', async () => {
    await morph.init();
    const result = await morph.applyEdits({
      file_path: '/tmp/test.ts',
      edits: [{ oldText: 'foo', newText: 'bar' }],
    });
    expect(result.success).toBe(false);
    expect(result.output).toContain('not configured');
  });

  it('should return error when applying diff without API key', async () => {
    await morph.init();
    const result = await morph.applyDiff('/tmp/test.ts', '--- a\n+++ b\n@@ -1 +1 @@\n-foo\n+bar');
    expect(result.success).toBe(false);
    expect(result.output).toContain('not configured');
  });
});

describe('MorphFastApplyTool', () => {
  it('should be defined', () => {
    expect(MorphFastApplyTool).toBeDefined();
    expect(MorphFastApplyTool.name).toBe('morph_apply');
  });

  it('should have correct schema', () => {
    expect(MorphFastApplyTool.inputSchema.type).toBe('object');
    expect(MorphFastApplyTool.inputSchema.required).toContain('file_path');
    expect(MorphFastApplyTool.inputSchema.required).toContain('edits');
  });

  it('should execute and return error when not configured', async () => {
    const result = await MorphFastApplyTool.execute({
      file_path: '/tmp/test.ts',
      edits: [{ oldText: 'foo', newText: 'bar' }],
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('not configured');
  });
});

describe('MorphFastApply with env vars', () => {
  it('should detect MORPH_API_KEY from environment', async () => {
    const originalKey = process.env.MORPH_API_KEY;
    process.env.MORPH_API_KEY = 'test-morph-key';
    process.env.MORPH_API_URL = 'https://api.morph.io/v1';

    const morph = createMorphFastApply('/tmp/test-morph-env');
    const available = await morph.init();
    expect(available).toBe(true);

    process.env.MORPH_API_KEY = originalKey;
    delete process.env.MORPH_API_URL;
  });
});
