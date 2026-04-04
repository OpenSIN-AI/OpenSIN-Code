import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '..');

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Branding Consistency', () => {
  describe('No Claude/Anthropic product references (excluding technical/source)', () => {
    const technicalFileNames = [
      'claudecodehints',
      'claudedesktop',
      'claudemd',
      'claudeinchrome',
      'claudecodeguideagent',
    ];

    const forbiddenPatterns = [
      /claude\s+ai/i,
      /anthropic\s+model/i,
      /anthropic\s*claude/i,
    ];

    it('should not have forbidden Claude product references in source files', () => {
      const files = getAllTsFiles(SRC_DIR);
      const violations: string[] = [];

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const relativePath = path.relative(SRC_DIR, file);

        for (const pattern of forbiddenPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            violations.push(`${relativePath}: ${matches[0]}`);
          }
        }
      }

      expect(violations.length).toBe(0);
    });

    it('all filenames should use OpenSIN or neutral naming', () => {
      const files = getAllTsFiles(SRC_DIR);
      const claudeFiles = files.filter(f => {
        const name = path.basename(f).toLowerCase();
        return name.includes('claude') && !technicalFileNames.some(tf => name.includes(tf));
      });
      expect(claudeFiles.length).toBe(0);
    });
  });

  describe('OpenSIN branding consistency', () => {
    it('package.json should have OpenSIN name', () => {
      const pkgPath = path.resolve(SRC_DIR, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toContain('opensin');
    });

    it('package.json should have OpenSIN description', () => {
      const pkgPath = path.resolve(SRC_DIR, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.description.toLowerCase()).toContain('opensin');
    });

    it('index.ts should export OpenSINClient', () => {
      const indexPath = path.join(SRC_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('OpenSINClient');
    });

    it('commands should reference OpenSIN in descriptions', () => {
      const commandsIndexPath = path.join(SRC_DIR, 'commands_v2', 'index.ts');
      const content = fs.readFileSync(commandsIndexPath, 'utf-8');
      expect(content.toLowerCase()).toContain('opensin');
    });

    it('status command should mention OpenSIN', () => {
      const statusPath = path.join(SRC_DIR, 'commands_v2', 'status', 'index.ts');
      const content = fs.readFileSync(statusPath, 'utf-8');
      expect(content).toContain('OpenSIN');
    });

    it('copy command should mention OpenSIN', () => {
      const copyPath = path.join(SRC_DIR, 'commands_v2', 'copy', 'index.ts');
      const content = fs.readFileSync(copyPath, 'utf-8');
      expect(content).toContain('OpenSIN');
    });
  });

  describe('Module naming conventions', () => {
    it('main directories should follow v2 convention for rebranded modules', () => {
      const expectedDirs = ['commands_v2', 'hooks_v2', 'tools_v2', 'utils_v2', 'components_v2', 'cli_v2'];
      for (const dir of expectedDirs) {
        const dirPath = path.join(SRC_DIR, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      }
    });

    it('index.ts should reference hooks_v2', () => {
      const indexPath = path.join(SRC_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('hooks_v2');
    });

    it('index.ts should reference tools_v2', () => {
      const indexPath = path.join(SRC_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('tools_v2');
    });

    it('index.ts should reference utils_v2', () => {
      const indexPath = path.join(SRC_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('utils_v2');
    });

    it('index.ts should reference cli_v2', () => {
      const indexPath = path.join(SRC_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('cli_v2');
    });

    it('index.ts should reference ink_v2', () => {
      const indexPath = path.join(SRC_DIR, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('ink_v2');
    });
  });

  describe('OpenSIN prefix in module names', () => {
    it('SDK package name should be @opensin/sdk', () => {
      const pkgPath = path.resolve(SRC_DIR, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.name).toBe('@opensin/sdk');
    });

    it('bin command should be opensin', () => {
      const pkgPath = path.resolve(SRC_DIR, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(Object.keys(pkg.bin)).toContain('opensin');
    });

    it('keywords should include opensin', () => {
      const pkgPath = path.resolve(SRC_DIR, '..', 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      expect(pkg.keywords).toContain('opensin');
    });
  });
});
