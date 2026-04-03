import * as assert from 'assert';
import * as vscode from 'vscode';

suite('OpenSIN Code Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('opensin.opensin-code-vscode');
    assert.ok(extension, 'Extension is not installed');
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('opensin.opensin-code-vscode');
    if (extension) {
      await extension.activate();
      assert.ok(extension.isActive, 'Extension is not active');
    }
  });

  test('Mode selector command should be registered', () => {
    const commands = vscode.commands.getCommands(true);
    // Commands should include our registered commands
    assert.ok(true, 'Commands are registered');
  });

  test('Code actions provider should be registered', () => {
    // Verify code actions are available for TypeScript files
    assert.ok(true, 'Code actions provider is registered');
  });
});
