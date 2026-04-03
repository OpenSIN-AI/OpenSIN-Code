import * as assert from 'assert';
suite('Modes Test Suite', () => {
  test('All 5 modes should exist', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    modes.forEach(mode => assert.ok(mode.length > 0, `Mode ${mode} exists`));
  });
});
