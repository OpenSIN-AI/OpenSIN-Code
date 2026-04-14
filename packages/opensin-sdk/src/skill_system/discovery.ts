import fs from 'fs';
import path from 'path';
import { SkillDefinition } from './types';
import { loadSkillFile } from './loader';

export function discoverSkillsInDirectory(dirPath: string, source: 'project' | 'global' | 'bundled'): SkillDefinition[] {
  const skills: SkillDefinition[] = [];
  if (!fs.existsSync(dirPath)) {
    return skills;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = path.join(dirPath, entry.name, 'SKILL.md');
      if (fs.existsSync(skillFile)) {
        const skill = loadSkillFile(skillFile, source);
        if (skill) {
          skills.push(skill);
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const skill = loadSkillFile(path.join(dirPath, entry.name), source);
      if (skill) {
        skills.push(skill);
      }
    }
  }

  return skills;
}

export function discoverGlobalSkills(configDir: string = process.env.HOME + '/.config/opencode'): SkillDefinition[] {
  const globalSkillsDir = path.join(configDir, 'skills');
  return discoverSkillsInDirectory(globalSkillsDir, 'global');
}

export function discoverProjectSkills(projectDir: string = process.cwd()): SkillDefinition[] {
  const projectSkillsDir = path.join(projectDir, '.skills');
  return discoverSkillsInDirectory(projectSkillsDir, 'project');
}
