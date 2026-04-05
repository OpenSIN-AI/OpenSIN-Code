/**
 * YAML frontmatter parser for OpenSIN memory blocks.
 *
 * Memory blocks are stored as markdown files with YAML frontmatter:
 * ---
 * label: persona
 * description: Agent persona and behavior guidelines
 * limit: 5000
 * read_only: false
 * ---
 * Actual memory content here...
 */

import * as yaml from 'yaml';

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
 * Build a complete markdown document with YAML frontmatter.
 */
export function buildFrontmatterDocument(
  frontmatter: Record<string, unknown>,
  body: string,
): string {
  const frontmatterYaml = yaml.stringify(frontmatter, {
    lineWidth: 120,
    minContentWidth: 0,
  });

  return `---\n${frontmatterYaml}---\n${body.trim()}\n`;
}

/**
 * Atomically write a file by writing to a temp file first, then renaming.
 * This prevents corruption if the process is interrupted mid-write.
 */
export async function atomicWriteFile(
  filePath: string,
  content: string,
): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.tmp`,
  );
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}
