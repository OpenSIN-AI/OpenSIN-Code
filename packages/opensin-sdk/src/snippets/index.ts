/**
 * OpenSIN Snippets System — Inline text expansion
 *
 * Instant inline text expansion for prompts. Type #snippet anywhere
 * and watch it transform. Brings DRY principles to prompt engineering
 * with composable, shell-enabled snippets.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as childProcess from 'node:child_process';
import * as util from 'node:util';

const exec = util.promisify(childProcess.exec);

interface Snippet {
  name: string;
  content: string;
  description?: string;
  shell?: boolean;
  dependencies?: string[];
}

interface SnippetsConfig {
  snippetsDir?: string;
  builtins: Record<string, Snippet>;
}

const SNIPPET_PATTERN = /#([a-zA-Z0-9_-]+)(?::([a-zA-Z0-9_-]+))?(?:\(([^)]*)\))?/g;

const DEFAULT_BUILTINS: Record<string, Snippet> = {
  review: {
    name: 'review',
    content: 'Review this code for: bugs, security issues, performance problems, and style violations. Provide specific, actionable feedback.',
    description: 'Code review prompt',
  },
  test: {
    name: 'test',
    content: 'Write comprehensive tests for this code. Include unit tests, edge cases, and integration tests where appropriate.',
    description: 'Testing prompt',
  },
  docs: {
    name: 'docs',
    content: 'Generate documentation for this code. Include: purpose, parameters, return values, examples, and edge cases.',
    description: 'Documentation prompt',
  },
  refactor: {
    name: 'refactor',
    content: 'Refactor this code to improve: readability, maintainability, performance, and adherence to best practices. Preserve all existing behavior.',
    description: 'Refactoring prompt',
  },
  fix: {
    name: 'fix',
    content: 'Fix all bugs and issues in this code. Explain each fix and why it was necessary.',
    description: 'Bug fixing prompt',
  },
  explain: {
    name: 'explain',
    content: 'Explain this code in detail. Cover: purpose, architecture, data flow, key decisions, and potential improvements.',
    description: 'Explanation prompt',
  },
  type: {
    name: 'type',
    content: 'Add proper TypeScript types to this code. Use strict types, avoid `any`, and create interfaces where appropriate.',
    description: 'TypeScript typing prompt',
  },
  lint: {
    name: 'lint',
    content: 'Fix all linting issues in this code. Follow the project\'s style guide and best practices.',
    description: 'Linting fix prompt',
  },
  git: {
    name: 'git',
    content: 'Generate a conventional commit message for these changes. Format: <type>(<scope>): <description>',
    shell: true,
    description: 'Git commit message from staged changes',
  },
  context: {
    name: 'context',
    content: 'Load all relevant context for this task. Include: related files, imports, tests, documentation, and recent commits.',
    description: 'Context loading prompt',
  },
};

export class SnippetsManager {
  private config: SnippetsConfig;
  private configPath: string;
  private snippets: Map<string, Snippet> = new Map();
  private snippetsDir: string;

  constructor(configDir?: string) {
    this.configPath = configDir
      ? path.join(configDir, 'snippets.json')
      : path.join(os.homedir(), '.opensin', 'snippets.json');
    this.snippetsDir = configDir
      ? path.join(configDir, 'snippets')
      : path.join(os.homedir(), '.opensin', 'snippets');
    this.config = { builtins: {} };
  }

  async init(): Promise<void> {
    await this.loadBuiltins();
    await this.loadUserSnippets();
    await this.loadProjectSnippets();
  }

  private async loadBuiltins(): Promise<void> {
    for (const [name, snippet] of Object.entries(DEFAULT_BUILTINS)) {
      this.snippets.set(name, snippet);
    }
  }

  private async loadUserSnippets(): Promise<void> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(raw);

      for (const [name, snippet] of Object.entries(this.config.builtins)) {
        this.snippets.set(name, snippet);
      }
    } catch {
      // Config doesn't exist yet
    }
  }

  private async loadProjectSnippets(): Promise<void> {
    const cwd = process.cwd();
    const projectSnippetsPath = path.join(cwd, '.opensin', 'snippets');

    try {
      const entries = await fs.readdir(projectSnippetsPath, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.md')) continue;

        const name = entry.name.replace(/\.md$/, '');
        const content = await fs.readFile(path.join(projectSnippetsPath, entry.name), 'utf-8');

        this.snippets.set(name, {
          name,
          content: content.trim(),
          description: `Project snippet: ${name}`,
        });
      }
    } catch {
      // Project snippets don't exist
    }
  }

  async expand(text: string): Promise<string> {
    const matches = Array.from(text.matchAll(SNIPPET_PATTERN));
    if (matches.length === 0) return text;

    let result = text;

    for (const match of matches.reverse()) {
      const [fullMatch, name, subname, args] = match;
      const snippet = this.snippets.get(name);

      if (snippet) {
        let expanded = await this.expandSnippet(snippet, subname, args);
        result = result.slice(0, match.index) + expanded + result.slice(match.index! + fullMatch.length);
      }
    }

    return result;
  }

  private async expandSnippet(snippet: Snippet, subname?: string, args?: string): Promise<string> {
    let content = snippet.content;

    if (args) {
      const argPairs = args.split(',').map(a => a.trim().split('='));
      for (const [key, value] of argPairs) {
        content = content.replace(new RegExp(`\\$${key}`, 'g'), value || '');
      }
    }

    if (snippet.shell) {
      try {
        const { stdout } = await exec(content, { cwd: process.cwd() });
        content = stdout.trim();
      } catch {
        content = `[Shell snippet failed: ${snippet.name}]`;
      }
    }

    if (snippet.dependencies) {
      for (const dep of snippet.dependencies) {
        const depSnippet = this.snippets.get(dep);
        if (depSnippet) {
          const depContent = await this.expandSnippet(depSnippet);
          content = `${depContent}\n\n${content}`;
        }
      }
    }

    return content;
  }

  list(): Snippet[] {
    return Array.from(this.snippets.values());
  }

  get(name: string): Snippet | undefined {
    return this.snippets.get(name);
  }

  async add(snippet: Snippet): Promise<void> {
    this.snippets.set(snippet.name, snippet);
    this.config.builtins[snippet.name] = snippet;

    const dir = path.dirname(this.configPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
  }

  async remove(name: string): Promise<boolean> {
    if (!this.snippets.has(name)) return false;
    this.snippets.delete(name);
    delete this.config.builtins[name];

    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2));
    return true;
  }
}

export function createSnippetsManager(configDir?: string): SnippetsManager {
  return new SnippetsManager(configDir);
}

export function expandSnippets(text: string): Promise<string> {
  const manager = new SnippetsManager();
  return manager.init().then(() => manager.expand(text));
}
