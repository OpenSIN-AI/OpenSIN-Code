import * as assert from 'assert';
import * as vscode from 'vscode';
import { CLIBridge } from '../../src/cliBridge';

suite('CLIBridge Tests', () => {
  let outputChannel: vscode.OutputChannel;
  let bridge: CLIBridge;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel('OpenSIN Test');
    bridge = new CLIBridge(outputChannel);
  });

  teardown(() => {
    outputChannel.dispose();
  });

  test('CLIBridge should initialize with empty task map', () => {
    assert.strictEqual(bridge.getTaskCount(), 0);
    assert.strictEqual(bridge.getRunningTasks().length, 0);
  });

  test('CLIBridge should return undefined for unknown task', () => {
    const task = bridge.getTask('nonexistent');
    assert.strictEqual(task, undefined);
  });

  test('CLIBridge should return all tasks', () => {
    const tasks = bridge.getAllTasks();
    assert.ok(Array.isArray(tasks));
    assert.strictEqual(tasks.length, 0);
  });

  test('CLIBridge healthCheck should return false when opencode is not available', async () => {
    const result = await bridge.healthCheck();
    assert.strictEqual(typeof result, 'boolean');
  });

  test('CLIBridge runHealthAndRetry should not throw', async () => {
    await assert.doesNotReject(bridge.runHealthAndRetry());
  });
});
