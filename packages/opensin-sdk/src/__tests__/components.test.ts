import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const COMPONENTS_DIR = path.resolve(__dirname, '../components_v2');
const INDEX_PATH = path.join(COMPONENTS_DIR, 'index.ts');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

function readComponentFile(name: string): string {
  const tsxPath = path.join(COMPONENTS_DIR, name + '.tsx');
  if (fs.existsSync(tsxPath)) return fs.readFileSync(tsxPath, 'utf-8');
  const tsPath = path.join(COMPONENTS_DIR, name + '.ts');
  if (fs.existsSync(tsPath)) return fs.readFileSync(tsPath, 'utf-8');
  return '';
}

describe('Components v2 Module', () => {
  describe('Module exports', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should export App component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bApp\b|\s+default\s+as\s+App)/);
    });

    it('should export Messages component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bMessages\b|\s+default\s+as\s+Messages)/);
    });

    it('should export Message component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bMessage\b|\s+default\s+as\s+Message)/);
    });

    it('should export PromptInput component', () => {
      const content = readIndexContent();
      expect(content).toContain('PromptInput');
    });

    it('should export StatusLine component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bStatusLine\b|\s+default\s+as\s+StatusLine)/);
    });

    it('should export Spinner component', () => {
      const content = readIndexContent();
      expect(content).toContain('Spinner');
    });

    it('should export TextInput component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bTextInput\b|\s+default\s+as\s+TextInput)/);
    });

    it('should export ModelPicker component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bModelPicker\b|\s+default\s+as\s+ModelPicker)/);
    });

    it('should export ThemePicker component', () => {
      const content = readIndexContent();
      expect(content).toMatch(/export\s+(?:\{.*\bThemePicker\b|\s+default\s+as\s+ThemePicker)/);
    });

    it('should export Settings component', () => {
      const content = readIndexContent();
      expect(content).toContain('Settings');
    });
  });

  describe('Component types', () => {
    it('App should be a tsx file with export', () => {
      const content = readComponentFile('App');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toMatch(/export\s+(function|const|default)/);
    });

    it('Messages should be a tsx file', () => {
      const content = readComponentFile('Messages');
      expect(content.length).toBeGreaterThan(0);
    });

    it('Message should be a tsx file', () => {
      const content = readComponentFile('Message');
      expect(content.length).toBeGreaterThan(0);
    });

    it('StatusLine should be a tsx file', () => {
      const content = readComponentFile('StatusLine');
      expect(content.length).toBeGreaterThan(0);
    });

    it('TextInput should be a tsx file', () => {
      const content = readComponentFile('TextInput');
      expect(content.length).toBeGreaterThan(0);
    });

    it('ModelPicker should be a tsx file', () => {
      const content = readComponentFile('ModelPicker');
      expect(content.length).toBeGreaterThan(0);
    });

    it('ThemePicker should be a tsx file', () => {
      const content = readComponentFile('ThemePicker');
      expect(content.length).toBeGreaterThan(0);
    });
  });

  describe('Component groups', () => {
    it('should export design system components', () => {
      const content = readIndexContent();
      expect(content).toContain('design-system');
    });

    it('should export diff components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./diff'");
    });

    it('should export permission components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./permissions'");
    });

    it('should export MCP components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./mcp'");
    });

    it('should export task components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./tasks'");
    });

    it('should export skill components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./skills'");
    });

    it('should export memory components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./memory'");
    });

    it('should export agent components', () => {
      const content = readIndexContent();
      expect(content).toContain("'./agents'");
    });
  });

  describe('Additional component exports', () => {
    it('should export VirtualMessageList', () => {
      const content = readIndexContent();
      expect(content).toContain('VirtualMessageList');
    });

    it('should export FullscreenLayout', () => {
      const content = readIndexContent();
      expect(content).toContain('FullscreenLayout');
    });

    it('should export MessageRow', () => {
      const content = readIndexContent();
      expect(content).toContain('MessageRow');
    });

    it('should export Markdown component', () => {
      const content = readIndexContent();
      expect(content).toContain('Markdown');
    });

    it('should export EffortIndicator', () => {
      const content = readIndexContent();
      expect(content).toContain('EffortIndicator');
    });

    it('should export TaskListV2', () => {
      const content = readIndexContent();
      expect(content).toContain('TaskListV2');
    });

    it('should export Feedback component', () => {
      const content = readIndexContent();
      expect(content).toContain('Feedback');
    });

    it('should export Onboarding component', () => {
      const content = readIndexContent();
      expect(content).toContain('Onboarding');
    });

    it('should export StructuredDiff', () => {
      const content = readIndexContent();
      expect(content).toContain('StructuredDiff');
    });

    it('should export TokenWarning', () => {
      const content = readIndexContent();
      expect(content).toContain('TokenWarning');
    });
  });

  describe('OpenSIN branding in components', () => {
    it('should export OpenSINCodeHint component', () => {
      const content = readIndexContent();
      expect(content).toContain('OpenSINCodeHint');
    });

    it('should export OpenSINInChromeOnboarding', () => {
      const content = readIndexContent();
      expect(content).toContain('OpenSINInChromeOnboarding');
    });

    it('should export OpenSINMdExternalIncludesDialog', () => {
      const content = readIndexContent();
      expect(content).toContain('OpenSINMdExternalIncludesDialog');
    });

    it('OpenSINCodeHint directory should exist', () => {
      expect(fs.existsSync(path.join(COMPONENTS_DIR, 'OpenSINCodeHint'))).toBe(true);
    });

    it('LogoV2 directory should exist', () => {
      expect(fs.existsSync(path.join(COMPONENTS_DIR, 'LogoV2'))).toBe(true);
    });
  });

  describe('Component file structure', () => {
    it('should have at least 50 component files', () => {
      const entries = fs.readdirSync(COMPONENTS_DIR, { withFileTypes: true });
      const componentFiles = entries.filter(e => e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) && !e.name.startsWith('index'));
      expect(componentFiles.length).toBeGreaterThanOrEqual(50);
    });

    it('Spinner should be a directory with index', () => {
      expect(fs.existsSync(path.join(COMPONENTS_DIR, 'Spinner'))).toBe(true);
    });

    it('PromptInput should be a directory with index', () => {
      expect(fs.existsSync(path.join(COMPONENTS_DIR, 'PromptInput'))).toBe(true);
    });
  });
});
