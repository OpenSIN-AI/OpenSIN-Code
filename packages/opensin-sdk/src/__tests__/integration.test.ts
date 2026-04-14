import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(SRC_DIR, 'index');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

describe('SDK Integration', () => {
  describe('Full SDK export', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should export OpenSINClient', () => {
      const content = readIndexContent();
      expect(content).toContain('OpenSINClient');
    });

    it('should export SessionManager', () => {
      const content = readIndexContent();
      expect(content).toContain('SessionManager');
    });

    it('should export EventStream', () => {
      const content = readIndexContent();
      expect(content).toContain('EventStream');
    });

    it('should export BaseProvider', () => {
      const content = readIndexContent();
      expect(content).toContain('BaseProvider');
    });

    it('should export OpenAIProvider', () => {
      const content = readIndexContent();
      expect(content).toContain('OpenAIProvider');
    });

    it('should export ProviderRegistry', () => {
      const content = readIndexContent();
      expect(content).toContain('ProviderRegistry');
    });

    it('should export AutonomyLevel', () => {
      const content = readIndexContent();
      expect(content).toContain('AutonomyLevel');
    });

    it('should export HookRegistry', () => {
      const content = readIndexContent();
      expect(content).toContain('HookRegistry');
    });

    it('should export createSessionId', () => {
      const content = readIndexContent();
      expect(content).toContain('createSessionId');
    });

    it('should export serializeSession', () => {
      const content = readIndexContent();
      expect(content).toContain('serializeSession');
    });
  });

  describe('V2 modules accessibility', () => {
    it('should re-export from hooks_v2', () => {
      const content = readIndexContent();
      expect(content).toContain('hooks_v2');
    });

    it('should re-export from ink_v2', () => {
      const content = readIndexContent();
      expect(content).toContain('ink_v2');
    });

    it('should re-export from cli_v2', () => {
      const content = readIndexContent();
      expect(content).toContain('cli_v2');
    });

    it('should re-export from tools_v2', () => {
      const content = readIndexContent();
      expect(content).toContain('tools_v2');
    });

    it('should re-export from utils_v2', () => {
      const content = readIndexContent();
      expect(content).toContain('utils_v2');
    });

    it('hooks_v2 directory should exist', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'hooks_v2'))).toBe(true);
    });

    it('tools_v2 directory should exist', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'tools_v2'))).toBe(true);
    });

    it('utils_v2 directory should exist', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'utils_v2'))).toBe(true);
    });

    it('cli_v2 directory should exist', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'cli_v2'))).toBe(true);
    });

    it('components_v2 directory should exist', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'components_v2'))).toBe(true);
    });
  });

  describe('No Claude/Anthropic references in exports', () => {
    it('index.ts should not export claude-named modules', () => {
      const content = readIndexContent();
      const lines = content.split('\n');
      const claudeExports = lines.filter(l =>
        l.match(/export\s+\*.*claude/i) && !l.includes('claudeCodeHints')
      );
      expect(claudeExports.length).toBe(0);
    });

    it('index.ts should not export anthropic-named modules', () => {
      const content = readIndexContent();
      const lines = content.split('\n');
      const anthropicExports = lines.filter(l =>
        l.match(/export\s+\*.*anthropic/i)
      );
      expect(anthropicExports.length).toBe(0);
    });
  });

  describe('Type exports', () => {
    it('should export SessionId type', () => {
      const content = readIndexContent();
      expect(content).toContain('SessionId');
    });

    it('should export ModelId type', () => {
      const content = readIndexContent();
      expect(content).toContain('ModelId');
    });

    it('should export Content type', () => {
      const content = readIndexContent();
      expect(content).toContain('Content');
    });

    it('should export ToolCall type', () => {
      const content = readIndexContent();
      expect(content).toContain('ToolCall');
    });

    it('should export SessionInfo type', () => {
      const content = readIndexContent();
      expect(content).toContain('SessionInfo');
    });

    it('should export ProviderConfig type', () => {
      const content = readIndexContent();
      expect(content).toContain('ProviderConfig');
    });

    it('should export StreamEvent type', () => {
      const content = readIndexContent();
      expect(content).toContain('StreamEvent');
    });

    it('should export JsonRpcError type', () => {
      const content = readIndexContent();
      expect(content).toContain('JsonRpcError');
    });
  });

  describe('Module consistency', () => {
    it('should have a reasonable number of export lines', () => {
      const content = readIndexContent();
      const exportLines = content.split('\n').filter(l => l.trim().startsWith('export'));
      expect(exportLines.length).toBeGreaterThan(50);
    });

    it('should export createProvider', () => {
      const content = readIndexContent();
      expect(content).toContain('createProvider');
    });

    it('should export ProviderError', () => {
      const content = readIndexContent();
      expect(content).toContain('ProviderError');
    });

    it('should export I18nEngine', () => {
      const content = readIndexContent();
      expect(content).toContain('I18nEngine');
    });

    it('should export TurboMode', () => {
      const content = readIndexContent();
      expect(content).toContain('TurboMode');
    });

    it('should export DesignMode', () => {
      const content = readIndexContent();
      expect(content).toContain('DesignMode');
    });

    it('should export Powerup', () => {
      const content = readIndexContent();
      expect(content).toContain('Powerup');
    });

    it('should export ColorPicker', () => {
      const content = readIndexContent();
      expect(content).toContain('ColorPicker');
    });

    it('should export EffortManager', () => {
      const content = readIndexContent();
      expect(content).toContain('EffortManager');
    });

    it('should export SessionNamer', () => {
      const content = readIndexContent();
      expect(content).toContain('SessionNamer');
    });
  });

  describe('SDK structure', () => {
    it('should have client', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'client'))).toBe(true);
    });

    it('should have types', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'types'))).toBe(true);
    });

    it('should have events', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'events'))).toBe(true);
    });

    it('should have providers', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'providers'))).toBe(true);
    });

    it('should have hooks module', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'hooks'))).toBe(true);
    });

    it('should have lint module', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'lint'))).toBe(true);
    });

    it('should have commands_v2 module', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'commands_v2'))).toBe(true);
    });

    it('should have ink_v2 module', () => {
      expect(fs.existsSync(path.join(SRC_DIR, 'ink_v2'))).toBe(true);
    });
  });
});
