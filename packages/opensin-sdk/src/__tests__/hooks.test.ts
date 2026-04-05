import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const HOOKS_DIR = path.resolve(__dirname, '../hooks_v2');
const INDEX_PATH = path.join(HOOKS_DIR, 'index.ts');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

function getExportedNames(content: string): string[] {
  const names: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/export\s+\*\s+from\s+['"]\.\/([^'"]+)['"]/);
    if (match) {
      names.push(match[1]);
    }
  }
  return names;
}

function getHookNames(content: string): string[] {
  const names: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const exportMatch = line.match(/export\s+\*\s+from\s+['"]\.\/(use\w+)['"]/);
    if (exportMatch) {
      names.push(exportMatch[1]);
    }
  }
  return names;
}

function readHookFile(hookName: string): string {
  const filePath = path.join(HOOKS_DIR, hookName + '.ts');
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  const tsxPath = path.join(HOOKS_DIR, hookName + '.tsx');
  if (fs.existsSync(tsxPath)) {
    return fs.readFileSync(tsxPath, 'utf-8');
  }
  return '';
}

describe('Hooks v2 Module', () => {
  describe('Module exports', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should export useVoice hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useVoice');
    });

    it('should export useTextInput hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useTextInput');
    });

    it('should export useTypeahead hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useTypeahead');
    });

    it('should export useCopyOnSelect hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useCopyOnSelect');
    });

    it('should export useHistorySearch hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useHistorySearch');
    });

    it('should export useSettings hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useSettings');
    });

    it('should export useCancelRequest hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useCancelRequest');
    });

    it('should export useDiffData hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useDiffData');
    });

    it('should export useTaskListWatcher hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useTaskListWatcher');
    });

    it('should export useSessionBackgrounding hook', () => {
      const content = readIndexContent();
      expect(content).toContain('useSessionBackgrounding');
    });
  });

  describe('Hook initialization patterns', () => {
    it('should have at least 50 hook exports', () => {
      const content = readIndexContent();
      const exportLines = content.split('\n').filter(l => l.match(/export\s+\*\s+from/));
      expect(exportLines.length).toBeGreaterThanOrEqual(50);
    });

    it('should export core hooks module', () => {
      const content = readIndexContent();
      expect(content).toContain('core-hooks');
    });

    it('should export fileSuggestions module', () => {
      const content = readIndexContent();
      expect(content).toContain('fileSuggestions');
    });

    it('should export types module', () => {
      const content = readIndexContent();
      expect(content).toMatch(/['"]\.\/types(\.js)?['"]/);
    });

    it('should export notification hooks from notifs directory', () => {
      const content = readIndexContent();
      expect(content).toContain('notifs/');
    });

    it('should export toolPermission module', () => {
      const content = readIndexContent();
      expect(content).toContain('toolPermission');
    });

    it('should export unifiedSuggestions module', () => {
      const content = readIndexContent();
      expect(content).toContain('unifiedSuggestions');
    });

    it('should export renderPlaceholder module', () => {
      const content = readIndexContent();
      expect(content).toContain('renderPlaceholder');
    });
  });

  describe('Hook file structure', () => {
    it('useVoice file should exist and export a function', () => {
      const content = readHookFile('useVoice');
      expect(content).toContain('useVoice');
      expect(content).toContain('export');
    });

    it('useTextInput file should exist', () => {
      const content = readHookFile('useTextInput');
      expect(content.length).toBeGreaterThan(0);
    });

    it('useTypeahead file should exist', () => {
      const content = readHookFile('useTypeahead');
      expect(content.length).toBeGreaterThan(0);
    });

    it('useSettings file should exist', () => {
      const content = readHookFile('useSettings');
      expect(content.length).toBeGreaterThan(0);
    });

    it('useCancelRequest file should exist', () => {
      const content = readHookFile('useCancelRequest');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Hook naming conventions', () => {
    it('hook files should follow use* naming', () => {
      const entries = fs.readdirSync(HOOKS_DIR, { withFileTypes: true });
      const hookFiles = entries
        .filter(e => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx')))
        .filter(e => e.name.startsWith('use'))
        .map(e => e.name.replace(/\.(ts|tsx)$/, ''));

      hookFiles.forEach(name => {
        expect(name).toMatch(/^use[A-Z]/);
      });
    });

    it('should have at least 50 hook files', () => {
      const entries = fs.readdirSync(HOOKS_DIR, { withFileTypes: true });
      const hookFiles = entries.filter(e => e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx')) && e.name.startsWith('use'));
      expect(hookFiles.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Hook groupings', () => {
    it('should have notification hooks in notifs directory', () => {
      const notifsDir = path.join(HOOKS_DIR, 'notifs');
      expect(fs.existsSync(notifsDir)).toBe(true);
      const entries = fs.readdirSync(notifsDir, { withFileTypes: true });
      expect(entries.length).toBeGreaterThan(0);
    });

    it('should export IDE-related hooks', () => {
      const content = readIndexContent();
      const ideHooks = content.split('\n').filter(l => l.includes('useIde') || l.includes('useIDE'));
      expect(ideHooks.length).toBeGreaterThan(0);
    });

    it('should export voice-related hooks', () => {
      const content = readIndexContent();
      const voiceHooks = content.split('\n').filter(l => l.toLowerCase().includes('voice'));
      expect(voiceHooks.length).toBeGreaterThan(0);
    });

    it('should export task-related hooks', () => {
      const content = readIndexContent();
      const taskHooks = content.split('\n').filter(l => l.toLowerCase().includes('task'));
      expect(taskHooks.length).toBeGreaterThan(0);
    });

    it('should export plugin-related hooks', () => {
      const content = readIndexContent();
      const pluginHooks = content.split('\n').filter(l => l.toLowerCase().includes('plugin'));
      expect(pluginHooks.length).toBeGreaterThan(0);
    });
  });
});
