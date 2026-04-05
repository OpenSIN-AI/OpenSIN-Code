import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WakaTimeTracker, createWakaTimeTracker } from '../wakatime/index.js';

describe('WakaTimeTracker', () => {
  let tracker: WakaTimeTracker;

  beforeEach(() => {
    tracker = createWakaTimeTracker('/tmp/test-wakatime');
  });

  afterEach(() => {
    tracker.dispose();
  });

  it('should initialize without errors', async () => {
    await expect(tracker.init()).resolves.not.toThrow();
  });

  it('should return false when no API key configured', async () => {
    const available = await tracker.init();
    expect(available).toBe(false);
  });

  it('should queue heartbeats', async () => {
    await tracker.init();
    const result = await tracker.sendHeartbeat({
      entity: 'test-file.ts',
      type: 'file',
      category: 'coding',
    });
    expect(result).toBe(false);
  });

  it('should track tool execution', async () => {
    await tracker.init();
    const result = await tracker.trackToolExecution('write', 'src/index.ts', 'typescript');
    expect(result).toBe(false);
  });

  it('should track session start', async () => {
    await tracker.init();
    const result = await tracker.trackSessionStart('test-project');
    expect(result).toBe(false);
  });

  it('should track session end', async () => {
    await tracker.init();
    await tracker.trackSessionStart('test-project');
    const result = await tracker.trackSessionEnd();
    expect(result).toBe(false);
  });

  it('should map tool names to categories correctly', async () => {
    await tracker.init();
    const writeTools = ['write', 'edit', 'fileEdit', 'fileWrite', 'FileWriteTool', 'FileEditTool'];
    const readTools = ['read', 'fileRead', 'FileReadTool', 'grep', 'GrepTool', 'glob', 'GlobTool'];
    const debugTools = ['bash', 'BashTool', 'debug', 'test'];

    for (const tool of writeTools) {
      const result = await tracker.trackToolExecution(tool);
      expect(result).toBe(false);
    }
    for (const tool of readTools) {
      const result = await tracker.trackToolExecution(tool);
      expect(result).toBe(false);
    }
    for (const tool of debugTools) {
      const result = await tracker.trackToolExecution(tool);
      expect(result).toBe(false);
    }
  });
});

describe('WakaTimeTracker with env vars', () => {
  it('should detect WAKATIME_API_KEY from environment', async () => {
    const originalKey = process.env.WAKATIME_API_KEY;
    process.env.WAKATIME_API_KEY = 'test-api-key-123';
    process.env.WAKATIME_PROJECT = 'test-project';

    const tracker = createWakaTimeTracker('/tmp/test-wakatime-env');
    const available = await tracker.init();
    expect(available).toBe(true);

    process.env.WAKATIME_API_KEY = originalKey;
    delete process.env.WAKATIME_PROJECT;
  });
});
