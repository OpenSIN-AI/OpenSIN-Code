import { definePlugin, createTool, ParamTypes } from '@opensin/plugin-sdk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

interface Skill {
  name: string;
  description: string;
  source: 'project' | 'user' | 'plugin';
  path: string;
  enabled: boolean;
}

async function discoverSkills(dir: string, source: Skill['source']): Promise<Skill[]> {
  const skills: Skill[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(dir, entry.name);
        const descPath = path.join(skillPath, 'SKILL.md');
        try {
          const desc = await fs.readFile(descPath, 'utf-8');
          skills.push({
            name: entry.name,
            description: desc.split('\n')[0].replace(/^#\s*/, ''),
            source,
            path: skillPath,
            enabled: true,
          });
        } catch { /* no SKILL.md */ }
      }
    }
  } catch { /* dir doesn't exist */ }
  return skills;
}

export default definePlugin({
  name: '@opensin/plugin-skills',
  version: '0.1.0',
  type: 'tool',
  description: 'Skills management system for SIN Code CLI',

  async activate(ctx) {
    const projectDir = ctx.getConfig<string>('projectDir', process.cwd());
    const userDir = path.join(os.homedir(), '.sin', 'skills');
    const projectSkillsDir = path.join(projectDir, '.sin', 'skills');

    const skills = [
      ...await discoverSkills(projectSkillsDir, 'project'),
      ...await discoverSkills(userDir, 'user'),
    ];

    ctx.tools.register(createTool({
      name: 'skills_list',
      description: 'List all available skills',
      parameters: {
        source: ParamTypes.string({ description: 'Filter by source (project|user|all)', default: 'all' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const source = (params.source as string) || 'all';
        const filtered = source === 'all' ? skills : skills.filter(s => s.source === source);
        if (filtered.length === 0) return { content: 'No skills found.' };
        return { content: filtered.map(s => `${s.name} [${s.source}]\n  ${s.description}\n  ${s.path}`).join('\n\n') };
      }
    }));

    ctx.tools.register(createTool({
      name: 'skills_show',
      description: 'Show skill details',
      parameters: {
        name: ParamTypes.string({ required: true, description: 'Skill name' }),
      },
      execute: async (params: Record<string, unknown>) => {
        const name = params.name as string;
        const skill = skills.find(s => s.name === name);
        if (!skill) return { content: `Skill "${name}" not found.` };
        try {
          const content = await fs.readFile(path.join(skill.path, 'SKILL.md'), 'utf-8');
          return { content };
        } catch {
          return { content: `Could not read skill content at ${skill.path}` };
        }
      }
    }));

    ctx.logger.info(`Skills plugin activated (${skills.length} skills discovered)`);
  },
});
