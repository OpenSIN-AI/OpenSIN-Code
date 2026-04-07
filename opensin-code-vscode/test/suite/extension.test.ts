import * as assert from 'assert';
import * as vscode from 'vscode';

suite('OpenSIN Extension Tests', () => {
  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('opensin-ai.opensin-code-vscode');
    assert.ok(extension, 'OpenSIN extension not found');
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('opensin-ai.opensin-code-vscode');
    assert.ok(extension, 'OpenSIN extension not found');
    await extension?.activate();
    assert.ok(extension.isActive, 'Extension should be active');
  });

  test('Dispatch command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.dispatch'), 'opensin.dispatch command not registered');
  });

  test('Status command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.status'), 'opensin.status command not registered');
  });

  test('Health command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.health'), 'opensin.health command not registered');
  });

  test('Swarm create command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.swarm.create'), 'opensin.swarm.create command not registered');
  });

  test('Swarm status command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.swarm.status'), 'opensin.swarm.status command not registered');
  });

  test('Memory consolidate command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.memory.consolidate'), 'opensin.memory.consolidate command not registered');
  });

  test('Mode toggle command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.mode.toggle'), 'opensin.mode.toggle command not registered');
  });

  test('Buddy toggle command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.buddy.toggle'), 'opensin.buddy.toggle command not registered');
  });

  test('CLI start command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.cli.start'), 'opensin.cli.start command not registered');
  });

  test('LSP restart command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('opensin.lsp.restart'), 'opensin.lsp.restart command not registered');
  });

  test('OpenSIN configuration should exist', () => {
    const config = vscode.workspace.getConfiguration('opensin');
    assert.ok(config.has('maxParallel'), 'maxParallel config missing');
    assert.ok(config.has('maxRetries'), 'maxRetries config missing');
    assert.ok(config.has('healthInterval'), 'healthInterval config missing');
    assert.ok(config.has('timeout'), 'timeout config missing');
    assert.ok(config.has('apiEndpoint'), 'apiEndpoint config missing');
    assert.ok(config.has('defaultAgent'), 'defaultAgent config missing');
    assert.ok(config.has('buddyEnabled'), 'buddyEnabled config missing');
    assert.ok(config.has('memoryAutoConsolidate'), 'memoryAutoConsolidate config missing');
  });
});
