import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const CLI_DIR = path.resolve(__dirname, '../cli_v2');
const INDEX_PATH = path.join(CLI_DIR, 'index.ts');

function readIndexContent(): string {
  return fs.readFileSync(INDEX_PATH, 'utf-8');
}

function readCliFile(name: string): string {
  const tsPath = path.join(CLI_DIR, name + '.ts');
  if (fs.existsSync(tsPath)) return fs.readFileSync(tsPath, 'utf-8');
  const tsxPath = path.join(CLI_DIR, name + '.tsx');
  if (fs.existsSync(tsxPath)) return fs.readFileSync(tsxPath, 'utf-8');
  return '';
}

describe('CLI v2 Framework', () => {
  describe('Core exports', () => {
    it('should have an index.ts file', () => {
      expect(fs.existsSync(INDEX_PATH)).toBe(true);
    });

    it('should export cliError', () => {
      const content = readIndexContent();
      expect(content).toContain('cliError');
    });

    it('should export cliOk', () => {
      const content = readIndexContent();
      expect(content).toContain('cliOk');
    });

    it('should export ndjsonSafeStringify', () => {
      const content = readIndexContent();
      expect(content).toContain('ndjsonSafeStringify');
    });

    it('should export StructuredIO', () => {
      const content = readIndexContent();
      expect(content).toContain('StructuredIO');
    });

    it('should export RemoteIO', () => {
      const content = readIndexContent();
      expect(content).toContain('RemoteIO');
    });

    it('should export update function', () => {
      const content = readIndexContent();
      expect(content).toContain('update');
    });

    it('exit.ts should exist', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'exit.ts'))).toBe(true);
    });

    it('structuredIO.ts should exist', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'structuredIO.ts'))).toBe(true);
    });

    it('ndjsonSafeStringify.ts should exist', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'ndjsonSafeStringify.ts'))).toBe(true);
    });
  });

  describe('StructuredIO', () => {
    it('structuredIO.ts should define StructuredIO class', () => {
      const content = readCliFile('structuredIO');
      expect(content).toContain('StructuredIO');
    });

    it('should export SANDBOX_NETWORK_ACCESS_TOOL_NAME', () => {
      const content = readIndexContent();
      expect(content).toContain('SANDBOX_NETWORK_ACCESS_TOOL_NAME');
    });

    it('structuredIO should import from modelcontextprotocol', () => {
      const content = readCliFile('structuredIO');
      expect(content).toContain('@modelcontextprotocol');
    });
  });

  describe('CLI handlers', () => {
    it('handlers directory should exist', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'handlers'))).toBe(true);
    });

    it('should export agentsHandler', () => {
      const content = readIndexContent();
      expect(content).toContain('agentsHandler');
    });

    it('should export auth handlers', () => {
      const content = readIndexContent();
      expect(content).toContain('authLogin');
      expect(content).toContain('authStatus');
      expect(content).toContain('authLogout');
    });

    it('should export MCP handlers', () => {
      const content = readIndexContent();
      expect(content).toContain('mcpListHandler');
      expect(content).toContain('mcpAddJsonHandler');
      expect(content).toContain('mcpRemoveHandler');
    });

    it('should export plugin handlers', () => {
      const content = readIndexContent();
      expect(content).toContain('pluginListHandler');
      expect(content).toContain('pluginInstallHandler');
      expect(content).toContain('pluginUninstallHandler');
    });

    it('should export autoMode handlers', () => {
      const content = readIndexContent();
      expect(content).toContain('autoModeDefaultsHandler');
      expect(content).toContain('autoModeConfigHandler');
    });

    it('should export utility handlers', () => {
      const content = readIndexContent();
      expect(content).toContain('doctorHandler');
      expect(content).toContain('installHandler');
    });

    it('handlers directory should have auth handler file', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'handlers', 'auth.ts'))).toBe(true);
    });

    it('handlers directory should have mcp handler file', () => {
      const hasTs = fs.existsSync(path.join(CLI_DIR, 'handlers', 'mcp.ts'));
      const hasTsx = fs.existsSync(path.join(CLI_DIR, 'handlers', 'mcp.tsx'));
      expect(hasTs || hasTsx).toBe(true);
    });

    it('handlers directory should have plugins handler file', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'handlers', 'plugins.ts'))).toBe(true);
    });
  });

  describe('Transport layer', () => {
    it('transports directory should exist', () => {
      expect(fs.existsSync(path.join(CLI_DIR, 'transports'))).toBe(true);
    });

    it('should export CCRClient', () => {
      const content = readIndexContent();
      expect(content).toContain('CCRClient');
    });

    it('should export HybridTransport', () => {
      const content = readIndexContent();
      expect(content).toContain('HybridTransport');
    });

    it('should export SSETransport', () => {
      const content = readIndexContent();
      expect(content).toContain('SSETransport');
    });

    it('should export WebSocketTransport', () => {
      const content = readIndexContent();
      expect(content).toContain('WebSocketTransport');
    });

    it('should export parseSSEFrames', () => {
      const content = readIndexContent();
      expect(content).toContain('parseSSEFrames');
    });

    it('should export getTransportForUrl', () => {
      const content = readIndexContent();
      expect(content).toContain('getTransportForUrl');
    });

    it('should export CCRInitError', () => {
      const content = readIndexContent();
      expect(content).toContain('CCRInitError');
    });

    it('should export stream accumulator functions', () => {
      const content = readIndexContent();
      expect(content).toContain('createStreamAccumulator');
      expect(content).toContain('accumulateStreamEvents');
    });

    it('should export SerialBatchEventUploader', () => {
      const content = readIndexContent();
      expect(content).toContain('SerialBatchEventUploader');
    });

    it('should export WorkerStateUploader', () => {
      const content = readIndexContent();
      expect(content).toContain('WorkerStateUploader');
    });

    it('should export RetryableError', () => {
      const content = readIndexContent();
      expect(content).toContain('RetryableError');
    });
  });

  describe('Command parsing', () => {
    it('ndjsonSafeStringify.ts should exist and export function', () => {
      const content = readCliFile('ndjsonSafeStringify');
      expect(content).toContain('export');
      expect(content).toContain('ndjsonSafeStringify');
    });

    it('exit.ts should export cliError and cliOk', () => {
      const content = readCliFile('exit');
      expect(content).toContain('cliError');
      expect(content).toContain('cliOk');
    });
  });

  describe('Plugin validation constants', () => {
    it('should export VALID_INSTALLABLE_SCOPES', () => {
      const content = readIndexContent();
      expect(content).toContain('VALID_INSTALLABLE_SCOPES');
    });

    it('should export VALID_UPDATE_SCOPES', () => {
      const content = readIndexContent();
      expect(content).toContain('VALID_UPDATE_SCOPES');
    });

    it('should export handleMarketplaceError', () => {
      const content = readIndexContent();
      expect(content).toContain('handleMarketplaceError');
    });
  });
});
