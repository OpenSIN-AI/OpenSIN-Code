import { describe, it, expect } from 'vitest';
import { SafetyNetPlugin, checkCommandSafety, DANGEROUS_PATTERNS } from '../index.js';

describe('DANGEROUS_PATTERNS', () => {
  it('has patterns defined', () => { expect(DANGEROUS_PATTERNS.length).toBeGreaterThan(0); });
});

describe('checkCommandSafety', () => {
  it('marks safe commands as safe', () => {
    const result = checkCommandSafety('ls -la');
    expect(result.safe).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });
  it('detects force push', () => {
    const result = checkCommandSafety('git push --force origin main');
    expect(result.safe).toBe(false);
    expect(result.severity === 'high' || result.severity === 'critical').toBe(true);
  });
  it('detects force push short form', () => {
    const result = checkCommandSafety('git push -f origin main');
    expect(result.safe).toBe(false);
  });
  it('detects hard reset', () => {
    const result = checkCommandSafety('git reset --hard HEAD');
    expect(result.safe).toBe(false);
    expect(result.severity === 'high' || result.severity === 'critical').toBe(true);
  });
  it('detects rm -rf', () => {
    const result = checkCommandSafety('rm -rf /some/path');
    expect(result.safe).toBe(false);
    expect(result.severity).toBe('critical');
  });
  it('detects git clean -fdx', () => {
    const result = checkCommandSafety('git clean -fdx');
    expect(result.safe).toBe(false);
  });
  it('detects fork bomb', () => {
    const result = checkCommandSafety(':(){:|:&};');
    expect(result.safe).toBe(false);
    expect(result.severity).toBe('critical');
  });
  it('allows custom patterns', () => {
    const result = checkCommandSafety('drop table users', { blockDangerousPatterns: ['drop table'] });
    expect(result.safe).toBe(false);
  });
  it('requires confirmation when configured', () => {
    const result = checkCommandSafety('git push --force', { requireConfirmation: true });
    expect(result.requiresConfirmation).toBe(true);
  });
  it('returns command in result', () => {
    const result = checkCommandSafety('  ls -la  ');
    expect(result.command).toBe('ls -la');
  });
});

describe('SafetyNetPlugin', () => {
  it('has correct manifest', () => {
    const plugin = new SafetyNetPlugin();
    expect(plugin.getManifest().id).toBe('safety-net');
  });
  it('checks safety', () => {
    const plugin = new SafetyNetPlugin();
    expect(plugin.isSafe('ls -la')).toBe(true);
    expect(plugin.isSafe('rm -rf /')).toBe(false);
  });
  it('allows config update', () => {
    const plugin = new SafetyNetPlugin();
    plugin.setConfig({ blockForcePush: false });
    expect(plugin.getConfig().blockForcePush).toBe(false);
  });
});
