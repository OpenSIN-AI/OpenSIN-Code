import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EnvsitterPlugin, protectEnvFiles, listEnvKeys, isEnvFile } from '../index.js';

const testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envsitter-test-'));
beforeAll(() => {
  fs.writeFileSync(path.join(testDir, '.env'), 'API_KEY=secret123\nDB_URL=postgres://localhost\n# comment\nEMPTY_VAR=\n');
  fs.writeFileSync(path.join(testDir, '.env.local'), 'LOCAL_KEY=local_value\n');
  fs.writeFileSync(path.join(testDir, 'config.json'), '{"key": "value"}\n');
});
afterAll(() => { fs.rmSync(testDir, { recursive: true, force: true }); });

describe('isEnvFile', () => {
  it('detects .env', () => { expect(isEnvFile('.env')).toBe(true); });
  it('detects .env.local', () => { expect(isEnvFile('.env.local')).toBe(true); });
  it('detects .env.production', () => { expect(isEnvFile('.env.production')).toBe(true); });
  it('rejects config.json', () => { expect(isEnvFile('config.json')).toBe(false); });
  it('rejects envfile.txt', () => { expect(isEnvFile('envfile.txt')).toBe(false); });
});

describe('protectEnvFiles', () => {
  it('blocks .env access', () => {
    const result = protectEnvFiles(path.join(testDir, '.env'));
    expect(result.blocked).toBe(true);
  });
  it('blocks .env.local access', () => {
    const result = protectEnvFiles(path.join(testDir, '.env.local'));
    expect(result.blocked).toBe(true);
  });
  it('allows non-env files', () => {
    const result = protectEnvFiles(path.join(testDir, 'config.json'));
    expect(result.blocked).toBe(false);
  });
  it('blocks custom paths', () => {
    const result = protectEnvFiles('/secrets/api.key', { customBlockedPaths: ['/secrets'] });
    expect(result.blocked).toBe(true);
  });
});

describe('listEnvKeys', () => {
  it('lists keys without values', () => {
    const keys = listEnvKeys(path.join(testDir, '.env'));
    expect(keys).toHaveLength(3);
    expect(keys[0].key).toBe('API_KEY');
    expect(keys[0].hasValue).toBe(true);
    expect(keys[0].fingerprint.length).toBe(8);
  });
  it('handles empty values', () => {
    const keys = listEnvKeys(path.join(testDir, '.env'));
    const emptyKey = keys.find(k => k.key === 'EMPTY_VAR');
    expect(emptyKey).toBeDefined();
    expect(emptyKey?.hasValue).toBe(false);
  });
  it('returns empty for non-env files', () => {
    expect(listEnvKeys(path.join(testDir, 'config.json'))).toHaveLength(0);
  });
});

describe('EnvsitterPlugin', () => {
  it('has correct manifest', () => {
    const plugin = new EnvsitterPlugin();
    expect(plugin.getManifest().id).toBe('envsitter');
  });
  it('checks files', () => {
    const plugin = new EnvsitterPlugin();
    expect(plugin.check(path.join(testDir, '.env')).blocked).toBe(true);
  });
  it('lists keys', () => {
    const plugin = new EnvsitterPlugin();
    const keys = plugin.listKeys(path.join(testDir, '.env'));
    expect(keys.length).toBeGreaterThan(0);
  });
  it('allows config update', () => {
    const plugin = new EnvsitterPlugin();
    plugin.setConfig({ allowKeyListing: false });
    expect(plugin.getConfig().allowKeyListing).toBe(false);
  });
});
