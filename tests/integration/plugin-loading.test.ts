/**
 * Integration test: Plugin loading and initialization
 */
describe('Plugin Loading', () => {
  it('should load sin-hookify plugin manifest', () => {
    const manifest = require('../../plugins/sin-hookify/plugin.json');
    expect(manifest.name).toBe('sin-hookify');
    expect(manifest.version).toBe('1.0.0');
    expect(manifest.commands.length).toBeGreaterThan(0);
    expect(manifest.hooks).toBeDefined();
  });

  it('should load sin-ralph plugin manifest', () => {
    const manifest = require('../../plugins/sin-ralph/plugin.json');
    expect(manifest.name).toBe('sin-ralph');
    expect(manifest.commands.length).toBeGreaterThan(0);
  });

  it('should load sin-feature-dev plugin manifest', () => {
    const manifest = require('../../plugins/sin-feature-dev/plugin.json');
    expect(manifest.name).toBe('sin-feature-dev');
    expect(manifest.agents.length).toBe(3);
  });

  it('should load sin-pr-review plugin manifest', () => {
    const manifest = require('../../plugins/sin-pr-review/plugin.json');
    expect(manifest.name).toBe('sin-pr-review');
    expect(manifest.agents.length).toBe(6);
  });

  it('should load sin-plugin-dev plugin manifest', () => {
    const manifest = require('../../plugins/sin-plugin-dev/plugin.json');
    expect(manifest.name).toBe('sin-plugin-dev');
    expect(manifest.skills.length).toBe(7);
  });
});
