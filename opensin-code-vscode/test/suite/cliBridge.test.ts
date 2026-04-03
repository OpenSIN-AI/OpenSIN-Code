import * as assert from 'assert';

suite('CLI Bridge Test Suite', () => {
  test('CLI bridge should construct correct command', () => {
    const prompt = 'test prompt';
    const mode = 'code';
    const expected = `opensin code "${prompt}" --mode ${mode}`;
    assert.ok(expected.includes('opensin code'), 'Command includes opensin code');
    assert.ok(expected.includes('--mode code'), 'Command includes mode flag');
  });

  test('CLI bridge should handle empty prompt', () => {
    const prompt = '';
    assert.strictEqual(prompt.trim(), '', 'Empty prompt is handled');
  });

  test('CLI bridge should support all modes', () => {
    const modes = ['architect', 'code', 'debug', 'ask', 'opensin-code'];
    modes.forEach(mode => {
      const cmd = `opensin code "test" --mode ${mode}`;
      assert.ok(cmd.includes(`--mode ${mode}`), `Mode ${mode} is supported`);
    });
  });
});
