/**
 * Unit tests for sin-hookify config loader
 */
import { extractFrontmatter } from '../../plugins/sin-hookify/core/config-loader';

describe('ConfigLoader', () => {
  it('should extract simple frontmatter', () => {
    const content = `---
name: test-rule
enabled: true
event: bash
pattern: rm -rf
---

Test message`;
    const [fm, msg] = extractFrontmatter(content);
    expect(fm.name).toBe('test-rule');
    expect(fm.enabled).toBe(true);
    expect(fm.event).toBe('bash');
    expect(msg).toBe('Test message');
  });

  it('should extract conditions list', () => {
    const content = `---
name: multi-condition
enabled: true
event: file
conditions:
  - field: file_path
    operator: regex_match
    pattern: \\.env$
  - field: new_text
    operator: contains
    pattern: KEY
---

Sensitive file detected`;
    const [fm, msg] = extractFrontmatter(content);
    expect(fm.name).toBe('multi-condition');
    expect(fm.conditions).toBeDefined();
    expect(Array.isArray(fm.conditions)).toBe(true);
    expect((fm.conditions as any[]).length).toBe(2);
    expect(msg).toContain('Sensitive file');
  });

  it('should return empty for content without frontmatter', () => {
    const content = 'Just plain text';
    const [fm, msg] = extractFrontmatter(content);
    expect(Object.keys(fm)).toHaveLength(0);
    expect(msg).toBe('Just plain text');
  });

  it('should parse boolean values correctly', () => {
    const content = `---
enabled: true
disabled: false
---

Test`;
    const [fm] = extractFrontmatter(content);
    expect(fm.enabled).toBe(true);
    expect(fm.disabled).toBe(false);
  });
});
