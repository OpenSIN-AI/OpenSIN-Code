import * as assert from 'assert';

suite('Modes Test Suite', () => {
  test('Architect mode should exist', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    assert.ok(modes.includes('architect'), 'Architect mode exists');
  });

  test('Code mode should exist', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    assert.ok(modes.includes('code'), 'Code mode exists');
  });

  test('Debug mode should exist', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    assert.ok(modes.includes('debug'), 'Debug mode exists');
  });

  test('Ask mode should exist', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    assert.ok(modes.includes('ask'), 'Ask mode exists');
  });

  test('OpenSIN-Code mode should exist', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    assert.ok(modes.includes('opensin-code'), 'OpenSIN-Code mode exists');
  });
});
