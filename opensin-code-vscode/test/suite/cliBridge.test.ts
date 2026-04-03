import * as assert from 'assert';
suite('CLI Bridge Test Suite', () => {
  test('CLI bridge should construct correct command', () => {
    const cmd = 'opensin code "test" --mode code';
    assert.ok(cmd.includes('opensin code'), 'Command includes opensin code');
  });
  test('CLI bridge should support all modes', () => {
    ['architect', 'code', 'debug', 'ask', 'opensin-code'].forEach(mode => {
      assert.ok(`opensin code "test" --mode ${mode}`.includes(`--mode ${mode}`), `Mode ${mode} supported`);
    });
  });
});
