import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const COMMANDS_DIR = path.resolve(__dirname, '../commands_v2');
const INDEX_PATH = path.join(COMMANDS_DIR, 'index');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

function getCommandNames(content: string): string[] {
  const names: string[] = [];
  const defaultExports = content.match(/export\s+\{\s+default\s+as\s+(\w+)/g) || [];
  defaultExports.forEach(m => {
    const name = m.match(/default\s+as\s+(\w+)/)?.[1];
    if (name) names.push(name);
  });
  const namedExports = content.match(/export\s+\{\s+([^}]+)\s+\}/g) || [];
  namedExports.forEach(block => {
    const items = block.replace(/export\s+\{\s+/, '').replace(/\s+\}/, '').split(',');
    items.forEach(item => {
      const trimmed = item.trim().split(/\s+as\s+/).pop()?.trim();
      if (trimmed && !trimmed.startsWith('default')) names.push(trimmed);
    });
  });
  return [...new Set(names)];
}

function getAllCommandsArray(content: string): string[] {
  const arrayMatch = content.match(/export\s+const\s+allCommands\s*=\s*\[([\s\S]*?)\]/);
  if (!arrayMatch) return [];
  const items = arrayMatch[1].split(',').map(s => s.trim()).filter(Boolean);
  return items;
}

function readCommandIndex(commandName: string): string {
  const tsPath = path.join(COMMANDS_DIR, commandName, 'index');
  if (fs.existsSync(tsPath)) return fs.readFileSync(tsPath, 'utf-8');
  const tsxPath = path.join(COMMANDS_DIR, commandName, 'index.tsx');
  if (fs.existsSync(tsxPath)) return fs.readFileSync(tsxPath, 'utf-8');
  return '';
}

describe('Commands v2 Module', () => {
  describe('Module exports', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should export allCommands array', () => {
      const content = readIndexContent();
      expect(content).toContain('allCommands');
    });

    it('should export copy command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('copy');
    });

    it('should export help command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('help');
    });

    it('should export exit command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('exit');
    });

    it('should export status command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('status');
    });

    it('should export model command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('model');
    });

    it('should export effort command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('effort');
    });

    it('should export context command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('context');
    });

    it('should export compact command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('compact');
    });

    it('should export memory command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('memory');
    });

    it('should export skills command', () => {
      const names = getCommandNames(readIndexContent());
      expect(names).toContain('skills');
    });
  });

  describe('Command metadata', () => {
    it('all command directories should have an index file', () => {
      const entries = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      dirs.forEach(dir => {
        const hasIndex = fs.existsSync(path.join(COMMANDS_DIR, dir, 'index')) ||
                         fs.existsSync(path.join(COMMANDS_DIR, dir, 'index.tsx'));
        expect(hasIndex, `${dir} should have index.ts or index.tsx`).toBe(true);
      });
    });

    it('all command index files should define a Command or use a command factory', () => {
      const entries = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      dirs.forEach(dir => {
        const content = readCommandIndex(dir);
        const hasCommandDef = content.includes('satisfies Command') ||
                              content.includes(': Command') ||
                              content.includes('Command =') ||
                              content.includes('createMovedToPluginCommand') ||
                              content.includes('createPluginCommand');
        expect(hasCommandDef, `${dir} should define a Command or use a factory`).toBe(true);
      });
    });

    it('all commands should have a name property', () => {
      const entries = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      dirs.forEach(dir => {
        const content = readCommandIndex(dir);
        expect(content).toMatch(/name:\s*['"]/);
      });
    });

    it('all commands should have a description property', () => {
      const entries = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      dirs.forEach(dir => {
        const content = readCommandIndex(dir);
        const hasDesc = content.includes('description') || content.includes('description:');
        expect(hasDesc, `${dir} should have description`).toBe(true);
      });
    });

    it('commands should have a load function or use a factory pattern', () => {
      const entries = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      dirs.forEach(dir => {
        const content = readCommandIndex(dir);
        const hasLoad = content.includes('load:') ||
                        content.includes('createMovedToPluginCommand') ||
                        content.includes('createPluginCommand');
        expect(hasLoad, `${dir} should have load or use factory`).toBe(true);
      });
    });
  });

  describe('Specific command properties', () => {
    it('exit command should have aliases including quit', () => {
      const content = readCommandIndex('exit');
      expect(content).toContain('aliases');
      expect(content).toContain('quit');
    });

    it('exit command should be immediate', () => {
      const content = readCommandIndex('exit');
      expect(content).toContain('immediate');
    });

    it('compact command should support non-interactive mode', () => {
      const content = readCommandIndex('compact');
      expect(content).toContain('supportsNonInteractive');
    });

    it('copy command description should mention clipboard', () => {
      const content = readCommandIndex('copy');
      expect(content.toLowerCase()).toContain('clipboard');
    });

    it('help command description should mention help', () => {
      const content = readCommandIndex('help');
      expect(content.toLowerCase()).toContain('help');
    });

    it('effort command should have argument hint', () => {
      const content = readCommandIndex('effort');
      expect(content).toContain('argumentHint');
    });

    it('memory command should reference memory files', () => {
      const content = readCommandIndex('memory');
      expect(content.toLowerCase()).toContain('memory');
    });

    it('skills command should mention skills', () => {
      const content = readCommandIndex('skills');
      expect(content.toLowerCase()).toContain('skills');
    });

    it('status command should be immediate', () => {
      const content = readCommandIndex('status');
      expect(content).toContain('immediate');
    });

    it('model command should have dynamic description', () => {
      const content = readCommandIndex('model');
      expect(content).toContain('get description');
    });
  });

  describe('Command registration', () => {
    it('allCommands array should include copy', () => {
      const cmds = getAllCommandsArray(readIndexContent());
      expect(cmds.some(c => c.includes('copy'))).toBe(true);
    });

    it('allCommands array should include help', () => {
      const cmds = getAllCommandsArray(readIndexContent());
      expect(cmds.some(c => c.includes('help'))).toBe(true);
    });

    it('allCommands array should include exit', () => {
      const cmds = getAllCommandsArray(readIndexContent());
      expect(cmds.some(c => c.includes('exit'))).toBe(true);
    });

    it('allCommands array should include model', () => {
      const cmds = getAllCommandsArray(readIndexContent());
      expect(cmds.some(c => c.includes('model'))).toBe(true);
    });

    it('allCommands array should include theme', () => {
      const cmds = getAllCommandsArray(readIndexContent());
      expect(cmds.some(c => c.includes('theme'))).toBe(true);
    });

    it('allCommands should have at least 50 entries', () => {
      const cmds = getAllCommandsArray(readIndexContent());
      expect(cmds.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Command types', () => {
    it('standard commands should use local-jsx or local type', () => {
      const entries = fs.readdirSync(COMMANDS_DIR, { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
      const skipped = ['pr_comments'];
      dirs.filter(d => !skipped.includes(d)).forEach(dir => {
        const content = readCommandIndex(dir);
        expect(content).toMatch(/type:\s*['"](local-jsx|local)['"]/);
      });
    });

    it('context command should export both interactive and non-interactive variants', () => {
      const content = readIndexContent();
      expect(content).toContain('contextNonInteractive');
    });

    it('extra-usage command should export both variants', () => {
      const content = readIndexContent();
      expect(content).toContain('extraUsageNonInteractive');
    });
  });
});
