import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ProfileManager, createProfileManager } from '../agent_profiles/manager.js';

describe('ProfileManager - Advanced', () => {
  let pm: ProfileManager;
  let testDir: string;
  let counter = 0;

  beforeEach(() => {
    counter++;
    testDir = `/tmp/test-profiles-adv-${counter}`;
    pm = createProfileManager(testDir);
  });

  afterEach(async () => {
    try {
      const fs = await import('node:fs/promises');
      await fs.rm(testDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  });

  it('should create profile in all three directories', async () => {
    await pm.init();
    await pm.createProfile({
      name: 'sync-test',
      description: 'Sync test agent',
      prompt: 'You are a sync test agent',
      mode: 'primary',
    });
    const fs = await import('node:fs/promises');
    const opensin = await fs.readFile(`${testDir}/.opensin/agents/sync-test.md`, 'utf-8');
    const opencode = await fs.readFile(`${testDir}/.opencode/agents/sync-test.md`, 'utf-8');
    const kilo = await fs.readFile(`${testDir}/.kilo/agents/sync-test.md`, 'utf-8');
    expect(opensin).toContain('Sync test agent');
    expect(opencode).toContain('Sync test agent');
    expect(kilo).toContain('Sync test agent');
    expect(opensin).toBe(opencode);
    expect(opencode).toBe(kilo);
  });

  it('should delete profile from all three directories', async () => {
    await pm.init();
    await pm.createProfile({
      name: 'delete-test',
      description: 'Delete test',
      prompt: 'Test',
      mode: 'primary',
    });
    const result = await pm.deleteProfile('delete-test');
    expect(result).toBe(true);
    expect(pm.getProfile('delete-test')).toBeUndefined();
  });

  it('should parse agent markdown with frontmatter', async () => {
    const fs = await import('node:fs/promises');
    const agentsDir = `${testDir}/.opensin/agents`;
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(`${agentsDir}/custom-agent.md`, `---
description: Custom agent from file
mode: primary
model: openai/gpt-4o
temperature: 0.3
color: "#FF5733"
---

You are a custom agent loaded from markdown file.
`);
    await pm.init();
    const profile = pm.getProfile('custom-agent');
    expect(profile).toBeDefined();
    expect(profile!.description).toBe('Custom agent from file');
    expect(profile!.mode).toBe('primary');
    expect(profile!.model).toBe('openai/gpt-4o');
    expect(String(profile!.temperature)).toBe('0.3');
    expect(profile!.prompt).toContain('custom agent loaded from markdown');
  });

  it('should handle disabled profiles', async () => {
    const fs = await import('node:fs/promises');
    const agentsDir = `${testDir}/.opensin/agents`;
    await fs.mkdir(agentsDir, { recursive: true });
    await fs.writeFile(`${agentsDir}/disabled-agent.md`, `---
description: Disabled agent
mode: primary
disable: true
---

This agent is disabled.
`);
    await pm.init();
    const profile = pm.getProfile('disabled-agent');
    expect(profile).toBeUndefined();
  });

  it('should sort profiles with builtins first', async () => {
    await pm.init();
    await pm.createProfile({
      name: 'alpha-custom',
      description: 'Custom alpha',
      prompt: 'Alpha',
      mode: 'primary',
    });
    await pm.createProfile({
      name: 'beta-custom',
      description: 'Custom beta',
      prompt: 'Beta',
      mode: 'primary',
    });
    const profiles = pm.listProfiles();
    const builtinNames = ['code', 'plan', 'debug', 'ask', 'orchestrator', 'reviewer', 'docs-writer', 'test-engineer'];
    const builtinIndices = profiles.map((p, i) => builtinNames.includes(p.name) ? i : -1).filter(i => i >= 0);
    const customIndices = profiles.map((p, i) => !builtinNames.includes(p.name) ? i : -1).filter(i => i >= 0);
    if (builtinIndices.length > 0 && customIndices.length > 0) {
      expect(Math.max(...builtinIndices)).toBeLessThan(Math.min(...customIndices));
    }
  });

  it('should return null for non-existent profile resolution', async () => {
    await pm.init();
    const resolution = pm.resolveProfile('nonexistent');
    expect(resolution).toBeNull();
  });

  it('should handle empty permission rules gracefully', async () => {
    await pm.init();
    await pm.createProfile({
      name: 'no-perms',
      description: 'No permissions',
      prompt: 'Test',
      mode: 'primary',
    });
    const resolution = pm.resolveProfile('no-perms');
    expect(resolution).not.toBeNull();
    expect(resolution!.effectivePermissions).toEqual({});
  });

  it('should list all built-in profiles', async () => {
    await pm.init();
    const profiles = pm.listProfiles();
    const builtinNames = ['code', 'plan', 'debug', 'ask', 'orchestrator', 'reviewer', 'docs-writer', 'test-engineer'];
    for (const name of builtinNames) {
      expect(profiles.map(p => p.name)).toContain(name);
    }
  });
});
