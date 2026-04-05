import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseSkillFile, loadSkillFile } from '../skill_system/loader';
import { discoverSkillsInDirectory } from '../skill_system/discovery';
import { SkillRegistry } from '../skill_system/registry';
import { SkillActivator } from '../skill_system/activator';

const MOCK_SKILL = `---
name: mock-skill
description: A mock skill for testing
tags: [test, mock]
triggers: [test-trigger]
---
Mock instructions are here.
Line 2 of instructions.`;

const TEST_DIR = '/tmp/opensin-test-skills';

describe('skill_system/loader', () => {
  it('parses valid skill file', () => {
    const skill = parseSkillFile('mock.md', MOCK_SKILL, 'project');
    expect(skill).toBeDefined();
    expect(skill?.id).toBe('mock-skill');
    expect(skill?.metadata.description).toBe('A mock skill for testing');
    expect(skill?.instructions).toContain('Mock instructions are here.');
    expect(skill?.source).toBe('project');
  });

  it('returns null for invalid frontmatter', () => {
    const invalid = `---
invalid_yaml: [
---
Instructions`;
    expect(parseSkillFile('mock.md', invalid, 'project')).toBeNull();
  });

  it('returns null for missing name/description', () => {
    const invalid = `---
tags: [test]
---
Instructions`;
    expect(parseSkillFile('mock.md', invalid, 'project')).toBeNull();
  });
});

describe('skill_system/registry', () => {
  let registry: SkillRegistry;
  
  beforeEach(() => {
    registry = new SkillRegistry();
  });

  it('registers and retrieves skills', () => {
    const skill = parseSkillFile('mock.md', MOCK_SKILL, 'project')!;
    registry.register(skill);
    expect(registry.get('mock-skill')).toBeDefined();
    expect(registry.getAll()).toHaveLength(1);
  });

  it('searches by name or tag', () => {
    const skill = parseSkillFile('mock.md', MOCK_SKILL, 'project')!;
    registry.register(skill);
    expect(registry.search('mock-skill')).toHaveLength(1);
    expect(registry.search('test')).toHaveLength(1);
    expect(registry.search('unknown')).toHaveLength(0);
  });

  it('matches triggers', () => {
    const skill = parseSkillFile('mock.md', MOCK_SKILL, 'project')!;
    registry.register(skill);
    expect(registry.matchTriggers('run the test-trigger now')).toHaveLength(1);
    expect(registry.matchTriggers('nothing here')).toHaveLength(0);
  });
});

describe('skill_system/activator', () => {
  let activator: SkillActivator;

  beforeEach(() => {
    activator = new SkillActivator();
  });

  it('activates and deactivates skills', () => {
    const skill = parseSkillFile('mock.md', MOCK_SKILL, 'project')!;
    activator.activate(skill);
    expect(activator.isActive('mock-skill')).toBe(true);
    expect(activator.getActiveSkills()).toHaveLength(1);
    
    activator.deactivate('mock-skill');
    expect(activator.isActive('mock-skill')).toBe(false);
    expect(activator.getActiveSkills()).toHaveLength(0);
  });

  it('generates injected prompt', () => {
    const skill = parseSkillFile('mock.md', MOCK_SKILL, 'project')!;
    activator.activate(skill);
    const prompt = activator.getInjectedPrompt();
    expect(prompt).toContain('Active Skills');
    expect(prompt).toContain('mock-skill');
    expect(prompt).toContain('Mock instructions are here.');
  });
});

describe('skill_system exports', () => {
  it('exports all public API from index', async () => {
    const sys = await import('../skill_system/index');
    expect(sys.SkillRegistry).toBeDefined();
    expect(sys.SkillActivator).toBeDefined();
    expect(sys.parseSkillFile).toBeDefined();
    expect(sys.discoverGlobalSkills).toBeDefined();
  });
});
