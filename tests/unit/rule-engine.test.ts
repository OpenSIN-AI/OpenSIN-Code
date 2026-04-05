/**
 * Unit tests for sin-hookify rule engine
 */
import { evaluateRules } from '../../plugins/sin-hookify/core/rule-engine';
import { HookRule, HookInput } from '../../plugins/sin-hookify/core/types';

describe('RuleEngine', () => {
  const mockRule: HookRule = {
    name: 'test-block-rm',
    enabled: true,
    event: 'bash',
    conditions: [{ field: 'command', operator: 'regex_match', pattern: 'rm\\s+-rf' }],
    action: 'block',
    message: 'Dangerous rm command!',
  };

  const mockInput: HookInput = {
    tool_name: 'Bash',
    tool_input: { command: 'rm -rf /tmp/test' },
    hook_event_name: 'PreToolUse',
  };

  it('should block matching dangerous commands', () => {
    const result = evaluateRules([mockRule], mockInput);
    expect(result.systemMessage).toContain('Dangerous rm command');
  });

  it('should allow non-matching commands', () => {
    const safeInput: HookInput = { ...mockInput, tool_input: { command: 'ls -la' } };
    const result = evaluateRules([mockRule], safeInput);
    expect(result).toEqual({});
  });

  it('should warn but allow for warn action', () => {
    const warnRule: HookRule = { ...mockRule, action: 'warn' };
    const result = evaluateRules([warnRule], mockInput);
    expect(result.systemMessage).toContain('Dangerous rm command');
    expect(result.hookSpecificOutput).toBeUndefined();
  });

  it('should handle multiple conditions', () => {
    const multiRule: HookRule = {
      name: 'sensitive-files',
      enabled: true,
      event: 'file',
      conditions: [
        { field: 'file_path', operator: 'regex_match', pattern: '\\.env$' },
        { field: 'new_text', operator: 'contains', pattern: 'KEY' },
      ],
      action: 'warn',
      message: 'Sensitive file edit detected!',
    };
    const fileInput: HookInput = {
      tool_name: 'Write',
      tool_input: { file_path: '.env', content: 'API_KEY=secret' },
      hook_event_name: 'PreToolUse',
    };
    const result = evaluateRules([multiRule], fileInput);
    expect(result.systemMessage).toContain('Sensitive file');
  });

  it('should respect disabled rules', () => {
    const disabledRule: HookRule = { ...mockRule, enabled: false };
    const result = evaluateRules([disabledRule], mockInput);
    expect(result).toEqual({});
  });

  it('should handle tool matcher', () => {
    const toolRule: HookRule = {
      ...mockRule,
      tool_matcher: 'Bash',
      conditions: [{ field: 'command', operator: 'contains', pattern: 'test' }],
    };
    const result = evaluateRules([toolRule], mockInput);
    expect(result).toBeDefined();
  });

  it('should block Stop events when configured', () => {
    const stopRule: HookRule = {
      name: 'require-tests',
      enabled: true,
      event: 'stop',
      conditions: [{ field: 'transcript', operator: 'not_contains', pattern: 'npm test' }],
      action: 'block',
      message: 'Tests not run!',
    };
    const stopInput: HookInput = {
      hook_event_name: 'Stop',
      reason: 'Task complete',
    };
    const result = evaluateRules([stopRule], stopInput);
    expect(result.decision).toBe('block');
  });
});
