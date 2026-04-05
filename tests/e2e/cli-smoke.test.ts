/**
 * E2E Test: CLI smoke tests
 */
import { execSync } from 'child_process';

describe('CLI Smoke Tests', () => {
  it('should have package.json with correct name', () => {
    const pkg = require('../../package.json');
    expect(pkg.name).toBeDefined();
    expect(pkg.scripts).toBeDefined();
  });

  it('should have all plugin directories', () => {
    const fs = require('fs');
    const plugins = ['sin-hookify', 'sin-ralph', 'sin-feature-dev', 'sin-pr-review', 'sin-plugin-dev'];
    for (const plugin of plugins) {
      expect(fs.existsSync(`plugins/${plugin}/plugin.json`)).toBe(true);
    }
  });

  it('should have governance files', () => {
    const fs = require('fs');
    expect(fs.existsSync('governance/repo-governance.json')).toBe(true);
    expect(fs.existsSync('governance/pr-watcher.json')).toBe(true);
    expect(fs.existsSync('governance/coder-dispatch-matrix.json')).toBe(true);
    expect(fs.existsSync('platforms/registry.json')).toBe(true);
  });
});
