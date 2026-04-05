import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import type { Config, ToolDefinition } from '../core/types.js';
import { truncate } from '../utils/helpers.js';

export async function buildSystemPrompt(
  config: Config,
  tools: ToolDefinition[],
  cwd: string,
  extraContext?: string
): Promise<string> {
  const sections: string[] = [];

  sections.push(buildCoreInstructions(config));
  sections.push(await buildProjectContext(cwd));
  sections.push(await buildGitContext(cwd));
  sections.push(buildToolDescriptions(tools));

  if (extraContext) {
    sections.push(extraContext);
  }

  return sections.filter(Boolean).join('\n\n---\n\n');
}

function buildCoreInstructions(config: Config): string {
  return `You are sincode, an AI coding assistant. Help the user write, debug, and understand code.

Rules:
- Be concise and direct
- Show code examples when helpful
- Explain errors clearly with solutions
- Use the available tools to read, write, edit, and search files
- Never make assumptions about file contents - always read first
- When editing, use the Edit tool with precise string matching`;
}

async function buildProjectContext(cwd: string): Promise<string> {
  const parts: string[] = [];

  const opensinMd = join(cwd, '.opensin.md');
  if (existsSync(opensinMd)) {
    parts.push(truncate(readFileSync(opensinMd, 'utf-8'), 10000));
  }

  const readmePath = join(cwd, 'README.md');
  if (!existsSync(opensinMd) && existsSync(readmePath)) {
    parts.push(truncate(readFileSync(readmePath, 'utf-8'), 5000));
  }

  const opensinDir = join(cwd, '.opensin');
  if (existsSync(opensinDir)) {
    try {
      const entries = readdirSync(opensinDir);
      for (const entry of entries.slice(0, 10)) {
        const fullPath = join(opensinDir, entry);
        if (statSync(fullPath).isFile() && entry.endsWith('.md')) {
          parts.push(truncate(readFileSync(fullPath, 'utf-8'), 5000));
        }
      }
    } catch {
      // skip
    }
  }

  if (parts.length === 0) return '';
  return `Project Context:\n${parts.join('\n')}`;
}

async function buildGitContext(cwd: string): Promise<string> {
  const { exec } = await import('node:child_process');
  const { promisify } = await import('node:util');
  const execAsync = promisify(exec);

  try {
    const { stdout: status } = await execAsync('git status --short', { cwd, timeout: 5000 });
    const { stdout: branch } = await execAsync('git branch --show-current', { cwd, timeout: 5000 });

    let output = `Git Context:\nBranch: ${branch.trim() || 'detached HEAD'}`;

    if (status.trim()) {
      output += `\nStatus:\n${truncate(status.trim(), 5000)}`;
    }

    return output;
  } catch {
    return '';
  }
}

function buildToolDescriptions(tools: ToolDefinition[]): string {
  const descriptions = tools.map((t) => {
    const params = JSON.stringify(t.parameters, null, 2);
    return `${t.name}: ${t.description}\nParameters: ${truncate(params, 2000)}`;
  });

  return `Available Tools:\n${descriptions.join('\n\n')}`;
}
