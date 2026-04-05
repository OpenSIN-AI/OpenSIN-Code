import { describe, it, expect, beforeEach } from 'vitest';
import { BUILTIN_PROFILES, BUILTIN_PROFILE_NAMES, getBuiltinProfile, listBuiltinProfiles } from '../agent_profiles/builtin_profiles.js';
import { ProfileManager, createProfileManager } from '../agent_profiles/manager.js';

describe('BUILTIN_PROFILES', () => {
  it('should define all expected built-in profiles', () => {
    const expected = ['code', 'plan', 'debug', 'ask', 'orchestrator', 'reviewer', 'docs-writer', 'test-engineer'];
    expect(BUILTIN_PROFILE_NAMES.sort()).toEqual(expected.sort());
  });

  it('should have valid structure for each profile', () => {
    for (const [name, profile] of Object.entries(BUILTIN_PROFILES)) {
      expect(profile.name).toBe(name);
      expect(profile.description.length).toBeGreaterThan(0);
      expect(profile.prompt.length).toBeGreaterThan(0);
      expect(['primary', 'subagent', 'all']).toContain(profile.mode);
      expect(profile.source).toBe('builtin');
      expect(profile.permission).toBeDefined();
    }
  });

  it('code profile should have full access', () => {
    const code = BUILTIN_PROFILES.code;
    expect(code.permission?.read).toBe('allow');
    expect(code.permission?.edit).toBe('allow');
    expect(code.permission?.bash).toBe('allow');
  });

  it('ask profile should deny edit and bash', () => {
    const ask = BUILTIN_PROFILES.ask;
    expect(ask.permission?.edit).toBe('deny');
    expect(ask.permission?.bash).toBe('deny');
  });

  it('plan profile should restrict edits to plan files', () => {
    const plan = BUILTIN_PROFILES.plan;
    expect(plan.permission?.edit).toHaveProperty('**/.opensin/plans/**');
    expect(plan.permission?.edit).toHaveProperty('*');
  });

  it('getBuiltinProfile should return correct profile', () => {
    expect(getBuiltinProfile('code')).toBe(BUILTIN_PROFILES.code);
    expect(getBuiltinProfile('nonexistent')).toBeUndefined();
  });

  it('listBuiltinProfiles should return all profiles', () => {
    const list = listBuiltinProfiles();
    expect(list.length).toBe(8);
    expect(list.map(p => p.name)).toContain('code');
  });
});

describe('ProfileManager', () => {
  let pm: ProfileManager;

  beforeEach(() => {
    pm = new ProfileManager('/tmp/test-opensin-project');
  });

  it('should initialize with built-in profiles', async () => {
    await pm.init();
    const profiles = pm.listProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(8);
    expect(profiles.map(p => p.name)).toContain('code');
    expect(profiles.map(p => p.name)).toContain('debug');
  });

  it('should start with code as active profile', async () => {
    await pm.init();
    expect(pm.getActiveProfile()).toBe('code');
  });

  it('should switch profiles', async () => {
    await pm.init();
    expect(pm.setActiveProfile('plan')).toBe(true);
    expect(pm.getActiveProfile()).toBe('plan');
  });

  it('should reject switching to non-existent profile', async () => {
    await pm.init();
    expect(pm.setActiveProfile('nonexistent')).toBe(false);
  });

  it('should resolve profile correctly', async () => {
    await pm.init();
    const resolution = pm.resolveProfile('code');
    expect(resolution).not.toBeNull();
    expect(resolution!.profile.name).toBe('code');
  });

  it('should check tool permissions correctly', async () => {
    await pm.init();
    expect(pm.isToolAllowed('code', 'read')).toBe(true);
    expect(pm.isToolAllowed('code', 'edit')).toBe(true);
    expect(pm.isToolAllowed('ask', 'edit')).toBe(false);
    expect(pm.isToolAllowed('ask', 'bash')).toBe(false);
  });

  it('should list profiles sorted with builtins first', async () => {
    await pm.init();
    const profiles = pm.listProfiles();
    const builtinNames = ['code', 'plan', 'debug', 'ask', 'orchestrator', 'reviewer', 'docs-writer', 'test-engineer'];
    const firstNonBuiltin = profiles.findIndex(p => p.source !== 'builtin');
    const lastBuiltin = profiles.reduce((last, p, i) => p.source === 'builtin' ? i : last, -1);
    if (firstNonBuiltin >= 0 && lastBuiltin >= 0) {
      expect(firstNonBuiltin).toBeGreaterThan(lastBuiltin);
    }
  });

  it('should get profile by name', async () => {
    await pm.init();
    const profile = pm.getProfile('debug');
    expect(profile).toBeDefined();
    expect(profile!.name).toBe('debug');
  });

  it('should create and list custom profiles', async () => {
    await pm.init();
    await pm.createProfile({
      name: 'custom-agent',
      description: 'A custom test agent',
      prompt: 'You are a custom agent',
      mode: 'primary',
    });
    const profiles = pm.listProfiles();
    expect(profiles.map(p => p.name)).toContain('custom-agent');
  });

  it('should delete custom profiles', async () => {
    await pm.init();
    await pm.createProfile({
      name: 'to-delete',
      description: 'Will be deleted',
      prompt: 'Test',
      mode: 'primary',
    });
    const result = await pm.deleteProfile('to-delete');
    expect(result).toBe(true);
    expect(pm.getProfile('to-delete')).toBeUndefined();
  });

  it('should not delete built-in profiles', async () => {
    await pm.init();
    const result = await pm.deleteProfile('code');
    expect(result).toBe(false);
    expect(pm.getProfile('code')).toBeDefined();
  });

  it('should get active profile prompt', async () => {
    await pm.init();
    const prompt = pm.getActiveProfilePrompt();
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('should get available profile names', async () => {
    await pm.init();
    const names = pm.getAvailableProfileNames();
    expect(names).toContain('code');
    expect(names).toContain('plan');
  });
});

describe('ProfileManager - Permission Matching', () => {
  let pm: ProfileManager;

  beforeEach(async () => {
    pm = new ProfileManager('/tmp/test-perm-project');
    await pm.init();
  });

  it('should allow all tools for code profile', () => {
    expect(pm.isToolAllowed('code', 'read')).toBe(true);
    expect(pm.isToolAllowed('code', 'edit')).toBe(true);
    expect(pm.isToolAllowed('code', 'bash')).toBe(true);
    expect(pm.isToolAllowed('code', 'webfetch')).toBe(true);
  });

  it('should deny edit and bash for ask profile', () => {
    expect(pm.isToolAllowed('ask', 'read')).toBe(true);
    expect(pm.isToolAllowed('ask', 'edit')).toBe(false);
    expect(pm.isToolAllowed('ask', 'bash')).toBe(false);
  });

  it('should deny edit and bash for reviewer profile', () => {
    expect(pm.isToolAllowed('reviewer', 'read')).toBe(true);
    expect(pm.isToolAllowed('reviewer', 'edit')).toBe(false);
    expect(pm.isToolAllowed('reviewer', 'bash')).toBe(false);
  });

  it('should allow glob and grep for all read profiles', () => {
    expect(pm.isToolAllowed('ask', 'glob')).toBe(true);
    expect(pm.isToolAllowed('ask', 'grep')).toBe(true);
    expect(pm.isToolAllowed('reviewer', 'glob')).toBe(true);
    expect(pm.isToolAllowed('reviewer', 'grep')).toBe(true);
  });
});

describe('createProfileManager factory', () => {
  it('should create a ProfileManager instance', () => {
    const pm = createProfileManager('/tmp/test');
    expect(pm).toBeInstanceOf(ProfileManager);
  });

  it('should default to cwd when no dir provided', () => {
    const pm = createProfileManager();
    expect(pm).toBeInstanceOf(ProfileManager);
  });
});
