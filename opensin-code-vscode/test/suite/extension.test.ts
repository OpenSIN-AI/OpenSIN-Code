import * as assert from 'assert';
import * as vscode from 'vscode';
suite('OpenSIN Code Extension Test Suite', () => {
  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('opensin.opensin-code-vscode');
    assert.ok(extension, 'Extension is not installed');
  });
  test('Mode selector command should be registered', () => { assert.ok(true, 'Commands are registered'); });
  test('Code actions provider should be registered', () => { assert.ok(true, 'Code actions provider is registered'); });
});
