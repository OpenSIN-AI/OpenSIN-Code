/**
 * OpenSIN Agent Memory — Frontmatter Utilities
 *
 * YAML frontmatter parsing and atomic file writes for memory blocks.
 *
 * Branded as OpenSIN/sincode.
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as YAML from 'yaml';

/**
 * Split a markdown file into frontmatter and body.
 */
export function splitFrontmatter(text: string): {
  frontmatterText: string | undefined;
  body: string;
} {
  if (!text.startsWith('---\n')) {
    return { frontmatterText: undefined, body: text };
  }

  const endIndex = text.indexOf('\n---\n', 4);
  if (endIndex === -1) {
    return { frontmatterText: undefined, body: text };
  }

  const frontmatterText = text.slice(4, endIndex);
  const body = text.slice(endIndex + '\n---\n'.length);
  return { frontmatterText, body };
}

/**
 * Build a markdown document with YAML frontmatter.
 */
export function buildFrontmatterDocument(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const frontmatterYaml = YAML.stringify(frontmatter, {
    lineWidth: 120,
    defaultStringType: 'QUOTE_DOUBLE',
  });

  return `---\n${frontmatterYaml}---\n${body.trim()}\n`;
}

/**
 * Write a file atomically using a temp file + rename.
 */
export async function atomicWriteFile(
  filePath: string,
  content: string,
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = path.join(dir, `.${path.basename(filePath)}.tmp`);
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}
