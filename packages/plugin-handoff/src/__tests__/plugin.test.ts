import { describe, it, expect } from 'vitest';
import { HandoffPlugin, generateHandoffPrompt, captureSessionState } from '../index.js';

describe('captureSessionState', () => {
  it('captures with defaults', () => {
    const state = captureSessionState();
    expect(state.currentTask).toBe('No active task');
    expect(state.openFiles).toEqual([]);
    expect(state.timestamp).toBeDefined();
  });
  it('captures with options', () => {
    const state = captureSessionState({
      currentTask: 'Build feature X',
      openFiles: ['src/main.ts', 'src/utils.ts'],
      recentActions: ['Read file', 'Edit file'],
      pendingItems: ['Write tests'],
    });
    expect(state.currentTask).toBe('Build feature X');
    expect(state.openFiles).toHaveLength(2);
    expect(state.recentActions).toHaveLength(2);
    expect(state.pendingItems).toHaveLength(1);
  });
});

describe('generateHandoffPrompt', () => {
  it('generates a prompt', () => {
    const state = captureSessionState({ currentTask: 'Test task', contextSummary: 'Summary here' });
    const result = generateHandoffPrompt(state);
    expect(result.prompt).toContain('# Session Handoff');
    expect(result.prompt).toContain('Test task');
    expect(result.prompt).toContain('Summary here');
    expect(result.metadata.version).toBe('0.1.0');
  });
  it('includes open files when configured', () => {
    const state = captureSessionState({ openFiles: ['a.ts', 'b.ts'] });
    const result = generateHandoffPrompt(state, { includeOpenFiles: true });
    expect(result.prompt).toContain('## Open Files');
    expect(result.prompt).toContain('a.ts');
  });
  it('excludes open files when disabled', () => {
    const state = captureSessionState({ openFiles: ['a.ts'] });
    const result = generateHandoffPrompt(state, { includeOpenFiles: false });
    expect(result.prompt).not.toContain('## Open Files');
  });
  it('limits recent actions', () => {
    const actions = Array.from({ length: 20 }, (_, i) => 'Action ' + i);
    const state = captureSessionState({ recentActions: actions });
    const result = generateHandoffPrompt(state, { maxRecentActions: 3 });
    const actionLines = result.prompt.split('\n').filter(l => l.startsWith('- Action'));
    expect(actionLines.length).toBeLessThanOrEqual(3);
  });
});

describe('HandoffPlugin', () => {
  it('has correct manifest', () => {
    const plugin = new HandoffPlugin();
    expect(plugin.getManifest().id).toBe('handoff');
  });
  it('captures and generates', () => {
    const plugin = new HandoffPlugin();
    plugin.capture({ currentTask: 'My task', openFiles: ['x.ts'] });
    const result = plugin.generate();
    expect(result.prompt).toContain('My task');
    expect(result.prompt).toContain('x.ts');
  });
  it('stores state', () => {
    const plugin = new HandoffPlugin();
    plugin.capture({ currentTask: 'Task A' });
    expect(plugin.getState()?.currentTask).toBe('Task A');
  });
  it('allows config update', () => {
    const plugin = new HandoffPlugin();
    plugin.setConfig({ includePendingItems: false });
    expect(plugin.getConfig().includePendingItems).toBe(false);
  });
});
