import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { execSync } from 'node:child_process';

interface SnippetStore {
  snippets: Map<string, string>;
}

async function loadSnippets(dir: string): Promise<Map<string, string>> {
  const snippets = new Map<string, string>();
  try {
    const files = await fs.readdir(dir);
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.txt') || file.endsWith('.sin')) {
        const name = file.replace(/\.(md|txt|sin)$/, '');
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        snippets.set(name, content);
      }
    }
  } catch { /* dir doesn't exist */ }
  return snippets;
}

function expandShellCommands(text: string): string {
  return text.replace(/\$\(([^)]+)\)/g, (_match, cmd) => {
    try {
      return execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();
    } catch {
      return `$(${cmd})`;
    }
  });
}

export default definePlugin({
  name: '@opensin/plugin-snippets',
  version: '0.1.0',
  type: 'tool',
  description: 'Instant inline text expansion — type #snippet-name anywhere',

  async activate(ctx) {
    const projectDir = ctx.getConfig<string>('projectDir', process.cwd());
    const userDir = path.join(os.homedir(), '.sin', 'snippets');
    const projectSnippetsDir = path.join(projectDir, '.sin', 'snippets');

    // Load snippets from both directories
    const projectSnippets = await loadSnippets(projectSnippetsDir);
    const userSnippets = await loadSnippets(userDir);
    const allSnippets = new Map([...userSnippets, ...projectSnippets]);

    ctx.events.on('message:parse:before', async (data: any) => {
      let { content } = data || {};
      if (!content) return;

      // Expand #snippet-name references
      const snippetRegex = /#([a-zA-Z0-9_-]+)/g;
      let match;
      while ((match = snippetRegex.exec(content)) !== null) {
        const snippetName = match[1];
        const snippet = allSnippets.get(snippetName);
        if (snippet) {
          const expanded = expandShellCommands(snippet);
          content = content.replace(match[0], expanded);
        }
      }

      data.content = content;
    });

    // Tool: list snippets
    ctx.tools.register(createTool({
      name: 'snippets_list',
      description: 'List all available snippets',
      parameters: {},
      execute: async () => {
        if (allSnippets.size === 0) return { content: 'No snippets found.' };
        const list = Array.from(allSnippets.entries()).map(([name, content]) => `#${name} (${content.length} chars)`);
        return { content: `Available snippets:\n${list.join('\n')}` };
      }
    }));

    // Tool: show snippet
    ctx.tools.register(createTool({
      name: 'snippets_show',
      description: 'Show a snippet content',
      parameters: {
        name: ParamTypes.string({ required: true, description: 'Snippet name' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const name = params.name as string;
        const snippet = allSnippets.get(name);
        if (!snippet) return { content: `Snippet "${name}" not found.` };
        return { content: `#${name}:\n${snippet}` };
      }
    }));

    ctx.logger.info(`Snippets plugin activated (${allSnippets.size} snippets loaded)`);
  },
});
