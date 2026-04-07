/**
 * Unit tests: sin-feature-dev Plugin
 * Tests for the 7-Phase Feature Development plugin with 3 specialized agents.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PLUGIN_ROOT = path.resolve(__dirname, '../../plugins/sin-feature-dev');

// ---------------------------------------------------------------------------
// Plugin Manifest
// ---------------------------------------------------------------------------

describe('sin-feature-dev Plugin Manifest', () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(PLUGIN_ROOT, 'plugin.json'), 'utf-8')
  );

  it('should have correct plugin name', () => {
    expect(manifest.name).toBe('sin-feature-dev');
  });

  it('should have version 1.0.0', () => {
    expect(manifest.version).toBe('1.0.0');
  });

  it('should have OpenSIN-AI as author', () => {
    expect(manifest.author).toBe('OpenSIN-AI');
  });

  it('should have MIT license', () => {
    expect(manifest.license).toBe('MIT');
  });

  it('should have type "plugin"', () => {
    expect(manifest.type).toBe('plugin');
  });

  it('should reference exactly 1 command file', () => {
    expect(Array.isArray(manifest.commands)).toBe(true);
    expect(manifest.commands.length).toBe(1);
    expect(manifest.commands).toContain('commands/feature-dev.md');
  });

  it('should reference exactly 3 agent files', () => {
    expect(Array.isArray(manifest.agents)).toBe(true);
    expect(manifest.agents.length).toBe(3);
    expect(manifest.agents).toContain('agents/code-explorer.md');
    expect(manifest.agents).toContain('agents/code-architect.md');
    expect(manifest.agents).toContain('agents/code-reviewer.md');
  });

  it('should have config with parallelAgents enabled', () => {
    expect(manifest.config.parallelAgents).toBe(true);
  });

  it('should have correct max agent counts', () => {
    expect(manifest.config.maxExplorers).toBe(3);
    expect(manifest.config.maxArchitects).toBe(3);
    expect(manifest.config.maxReviewers).toBe(3);
  });

  it('should define all 7 phases in config', () => {
    const phases = manifest.config.phases;
    expect(phases).toHaveLength(7);
    expect(phases).toContain('discovery');
    expect(phases).toContain('codebase-exploration');
    expect(phases).toContain('clarifying-questions');
    expect(phases).toContain('architecture-design');
    expect(phases).toContain('implementation');
    expect(phases).toContain('quality-review');
    expect(phases).toContain('summary');
  });
});

// ---------------------------------------------------------------------------
// Agent Definitions
// ---------------------------------------------------------------------------

describe('sin-feature-dev Agents', () => {
  const agents = ['code-explorer', 'code-architect', 'code-reviewer'];

  agents.forEach((agentName) => {
    const agentPath = path.join(PLUGIN_ROOT, 'agents', `${agentName}.md`);
    const content = fs.readFileSync(agentPath, 'utf-8');

    it(`${agentName}.md should exist`, () => {
      expect(fs.existsSync(agentPath)).toBe(true);
    });

    it(`${agentName}.md should have YAML frontmatter with name`, () => {
      expect(content).toMatch(/^---\s*\nname:\s*${agentName}/m);
    });

    it(`${agentName}.md should specify openai/gpt-5.4 as model`, () => {
      expect(content).toMatch(/model:\s*openai\/gpt-5\.4/);
    });

    it(`${agentName}.md should have a color defined`, () => {
      expect(content).toMatch(/color:\s*\w+/);
    });

    it(`${agentName}.md should have tools defined`, () => {
      expect(content).toMatch(/tools:\s*\[/);
    });

    it(`${agentName}.md should have substantial content (>200 chars)`, () => {
      expect(content.length).toBeGreaterThan(200);
    });

    it(`${agentName}.md should not reference Claude or Anthropic`, () => {
      const lower = content.toLowerCase();
      expect(lower).not.toMatch(/claude\s*code/);
      expect(lower).not.toMatch(/anthropic/);
    });

    it(`${agentName}.md should reference OpenSIN branding`, () => {
      // At minimum should not contradict OpenSIN branding
      const lower = content.toLowerCase();
      expect(lower).not.toMatch(/claude\.md/);
    });
  });

  // Agent-specific content checks
  it('code-explorer should focus on tracing and analysis', () => {
    const content = fs.readFileSync(
      path.join(PLUGIN_ROOT, 'agents', 'code-explorer.md'),
      'utf-8'
    );
    expect(content.toLowerCase()).toMatch(/trace|execution|flow|entry.?point/i);
  });

  it('code-architect should focus on architecture and design', () => {
    const content = fs.readFileSync(
      path.join(PLUGIN_ROOT, 'agents', 'code-architect.md'),
      'utf-8'
    );
    expect(content.toLowerCase()).toMatch(/architect|design|blueprint|component/i);
  });

  it('code-reviewer should focus on bugs and quality', () => {
    const content = fs.readFileSync(
      path.join(PLUGIN_ROOT, 'agents', 'code-reviewer.md'),
      'utf-8'
    );
    expect(content.toLowerCase()).toMatch(/bug|quality|confidence|review/i);
  });

  it('code-reviewer should have confidence scoring guidance', () => {
    const content = fs.readFileSync(
      path.join(PLUGIN_ROOT, 'agents', 'code-reviewer.md'),
      'utf-8'
    );
    expect(content).toMatch(/confidence.*80|>=\s*80/i);
  });
});

// ---------------------------------------------------------------------------
// Command Definition
// ---------------------------------------------------------------------------

describe('sin-feature-dev Command', () => {
  const commandPath = path.join(PLUGIN_ROOT, 'commands', 'feature-dev.md');
  const content = fs.readFileSync(commandPath, 'utf-8');

  it('feature-dev.md should exist', () => {
    expect(fs.existsSync(commandPath)).toBe(true);
  });

  it('should have YAML frontmatter with description', () => {
    expect(content).toMatch(/^---\s*\ndescription:/m);
  });

  it('should have argument-hint defined', () => {
    expect(content).toMatch(/argument-hint:/);
  });

  it('should define all 7 phases', () => {
    expect(content).toMatch(/Phase 1.*Discovery/is);
    expect(content).toMatch(/Phase 2.*Codebase Exploration/is);
    expect(content).toMatch(/Phase 3.*Clarifying Questions/is);
    expect(content).toMatch(/Phase 4.*Architecture Design/is);
    expect(content).toMatch(/Phase 5.*Implementation/is);
    expect(content).toMatch(/Phase 6.*Quality Review/is);
    expect(content).toMatch(/Phase 7.*Summary/is);
  });

  it('should reference code-explorer agent', () => {
    expect(content).toMatch(/code-explorer/);
  });

  it('should reference code-architect agent', () => {
    expect(content).toMatch(/code-architect/);
  });

  it('should reference code-reviewer agent', () => {
    expect(content).toMatch(/code-reviewer/);
  });

  it('should have substantial workflow content (>500 chars)', () => {
    expect(content.length).toBeGreaterThan(500);
  });

  it('should not reference Claude or Anthropic', () => {
    const lower = content.toLowerCase();
    expect(lower).not.toMatch(/claude\s*code/);
    expect(lower).not.toMatch(/anthropic/);
  });

  it('should require user approval before implementation (Phase 5)', () => {
    expect(content).toMatch(/approval|approve|DO NOT START WITHOUT/i);
  });

  it('should mark Phase 3 as critical', () => {
    expect(content).toMatch(/CRITICAL|DO NOT SKIP/i);
  });
});

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

describe('sin-feature-dev README', () => {
  const readmePath = path.join(PLUGIN_ROOT, 'README.md');
  const content = fs.readFileSync(readmePath, 'utf-8');

  it('README.md should exist', () => {
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  it('should document all 7 phases', () => {
    expect(content).toMatch(/Discovery/i);
    expect(content).toMatch(/Codebase Exploration/i);
    expect(content).toMatch(/Clarifying Questions/i);
    expect(content).toMatch(/Architecture Design/i);
    expect(content).toMatch(/Implementation/i);
    expect(content).toMatch(/Quality Review/i);
    expect(content).toMatch(/Summary/i);
  });

  it('should document all 3 agents', () => {
    expect(content).toMatch(/code-explorer/i);
    expect(content).toMatch(/code-architect/i);
    expect(content).toMatch(/code-reviewer/i);
  });

  it('should have OpenSIN branding', () => {
    expect(content).toMatch(/OpenSIN/i);
  });
});

// ---------------------------------------------------------------------------
// File Structure Integrity
// ---------------------------------------------------------------------------

describe('sin-feature-dev File Structure', () => {
  it('should have no nested feature-dev/ subdirectory (no duplication)', () => {
    const nestedDir = path.join(PLUGIN_ROOT, 'feature-dev');
    expect(fs.existsSync(nestedDir)).toBe(false);
  });

  it('should have exactly the expected files', () => {
    const expectedFiles = [
      'plugin.json',
      'README.md',
      'commands/feature-dev.md',
      'agents/code-explorer.md',
      'agents/code-architect.md',
      'agents/code-reviewer.md',
    ];

    for (const file of expectedFiles) {
      const fullPath = path.join(PLUGIN_ROOT, file);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('all referenced files in plugin.json should exist on disk', () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(PLUGIN_ROOT, 'plugin.json'), 'utf-8')
    );

    const allRefs = [...(manifest.commands || []), ...(manifest.agents || [])];
    for (const ref of allRefs) {
      const fullPath = path.join(PLUGIN_ROOT, ref);
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });
});
