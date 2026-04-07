import * as assert from 'assert';
import { Modes, AgentMode } from '../../src/modes';

class MockOutputChannel {
  private lines: string[] = [];

  appendLine(value: string): void {
    this.lines.push(value);
  }

  getLines(): string[] {
    return this.lines;
  }

  append(value: string): void {}
  clear(): void {}
  show(): void {}
  hide(): void {}
  dispose(): void {}
  replace(value: string): void {}
}

class MockExtensionContext {
  private state: Map<string, unknown> = new Map();

  get workspaceState() {
    return {
      get: <T>(key: string): T | undefined => this.state.get(key) as T,
      update: (key: string, value: unknown) => {
        this.state.set(key, value);
        return Promise.resolve();
      }
    };
  }

  get globalState() {
    return {
      get: <T>(key: string): T | undefined => this.state.get(key) as T,
      update: (key: string, value: unknown) => {
        this.state.set(key, value);
        return Promise.resolve();
      }
    };
  }

  subscriptions: { dispose(): void }[] = [];

  extensionPath = '/test/path';
  storagePath = '/test/storage';
  globalStoragePath = '/test/global-storage';
  logPath = '/test/log';
  extensionUri = {} as any;
  environmentVariableCollection = {} as any;
  extensionMode = 1;
  logUri = {} as any;
  storageUri = {} as any;
  globalStorageUri = {} as any;
  asAbsolutePath(relativePath: string): string { return relativePath; }
}

suite('Modes Tests', () => {
  let modes: Modes;
  let mockContext: MockExtensionContext;
  let mockOutput: MockOutputChannel;

  setup(() => {
    mockContext = new MockExtensionContext();
    mockOutput = new MockOutputChannel();
    modes = new Modes(mockContext as any, mockOutput as any);
  });

  test('Initial mode should be explore', () => {
    assert.strictEqual(modes.getCurrentMode(), 'explore');
  });

  test('Should have 5 available modes', () => {
    const allModes = modes.getAllModes();
    assert.strictEqual(allModes.length, 5);
    assert.deepStrictEqual(allModes, ['explore', 'implement', 'review', 'architect', 'debug']);
  });

  test('Should return mode config for explore', () => {
    const config = modes.getModeConfig('explore');
    assert.strictEqual(config.name, 'explore');
    assert.strictEqual(config.temperature, 0.7);
    assert.strictEqual(config.maxTokens, 4096);
  });

  test('Should return mode config for implement', () => {
    const config = modes.getModeConfig('implement');
    assert.strictEqual(config.name, 'implement');
    assert.strictEqual(config.temperature, 0.3);
    assert.strictEqual(config.maxTokens, 8192);
  });

  test('Should return mode config for review', () => {
    const config = modes.getModeConfig('review');
    assert.strictEqual(config.name, 'review');
    assert.strictEqual(config.temperature, 0.2);
  });

  test('Should return mode config for architect', () => {
    const config = modes.getModeConfig('architect');
    assert.strictEqual(config.name, 'architect');
    assert.strictEqual(config.temperature, 0.5);
  });

  test('Should return mode config for debug', () => {
    const config = modes.getModeConfig('debug');
    assert.strictEqual(config.name, 'debug');
    assert.strictEqual(config.temperature, 0.1);
  });

  test('Should return available modes with labels', () => {
    const available = modes.getAvailableModes();
    assert.strictEqual(available.length, 5);
    assert.ok(available[0].label.includes('explore'));
    assert.ok(available[0].description.length > 0);
  });

  test('Should throw for unknown mode', () => {
    assert.throws(
      () => modes.getModeConfig('unknown' as AgentMode),
      /Unknown OpenSIN mode/
    );
  });
});
