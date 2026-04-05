import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateTemplate, createAgentFromTemplate } from '../template.js';
import { rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const TEST_DIR = '/tmp/agent-sdk-template-test';

describe('Template', () => {
  beforeEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('should generate template files', async () => {
    const outputDir = await generateTemplate({
      agentName: 'Test Agent',
      description: 'A test agent',
      author: 'Test Author',
      version: '0.1.0',
      outputDir: TEST_DIR,
    });

    const indexContent = await readFile(join(outputDir, 'src', 'index.ts'), 'utf-8');
    expect(indexContent).toContain('Test Agent');
    expect(indexContent).toContain('A test agent');

    const pkgContent = await readFile(join(outputDir, 'package.json'), 'utf-8');
    expect(pkgContent).toContain('test-agent');

    const readmeContent = await readFile(join(outputDir, 'README.md'), 'utf-8');
    expect(readmeContent).toContain('Test Agent');
    expect(readmeContent).toContain('Test Author');
  });

  it('should create all expected files', async () => {
    const outputDir = await generateTemplate({
      agentName: 'My Agent',
      outputDir: TEST_DIR,
    });

    const files = ['src/index.ts', 'package.json', 'tsconfig.json', 'README.md', '.gitignore'];
    for (const file of files) {
      const content = await readFile(join(outputDir, file), 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('should create agent from template', async () => {
    const result = await createAgentFromTemplate({
      agentName: 'New Agent',
      description: 'New agent description',
      outputDir: TEST_DIR,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('New Agent');
    expect(result.files).toHaveLength(5);
    expect(result.outputDir).toBe(TEST_DIR);
  });

  it('should handle template creation errors', async () => {
    const result = await createAgentFromTemplate({
      agentName: '',
      outputDir: '/root/forbidden/path/that/does/not/exist/12345',
    });

    expect(result.success).toBe(false);
  });

  it('should use defaults for optional fields', async () => {
    const outputDir = await generateTemplate({
      agentName: 'Minimal',
      outputDir: TEST_DIR,
    });

    const readmeContent = await readFile(join(outputDir, 'README.md'), 'utf-8');
    expect(readmeContent).toContain('A custom OpenSIN agent');
    expect(readmeContent).toContain('unknown');
  });
});
