import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { SkillDefinition } from '../core/types.js';

export class SkillManager {
  private skills = new Map<string, SkillDefinition>();

  async discover(cwd: string): Promise<SkillDefinition[]> {
    const skillDirs = [
      join(cwd, '.opensin', 'skills'),
      join(process.env.HOME || '', '.config', 'sincode', 'skills'),
    ];

    for (const dir of skillDirs) {
      await this.loadSkillsFromDir(dir);
    }

    return Array.from(this.skills.values());
  }

  async loadSkillsFromDir(dir: string): Promise<void> {
    if (!existsSync(dir)) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const skillPath = join(dir, entry.name, 'SKILL.md');
        if (!existsSync(skillPath)) continue;

        const content = readFileSync(skillPath, 'utf-8');
        const skill = this.parseSkillMd(content, skillPath);
        if (skill) {
          this.skills.set(skill.name, skill);
        }
      }
    } catch {
      // skip unreadable dirs
    }
  }

  getSkill(name: string): SkillDefinition | undefined {
    return this.skills.get(name);
  }

  getAllSkills(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  getInstructions(names: string[]): string {
    const instructions: string[] = [];
    for (const name of names) {
      const skill = this.skills.get(name);
      if (skill) {
        instructions.push(`## Skill: ${skill.name}\n${skill.instructions}`);
      }
    }
    return instructions.join('\n\n');
  }

  private parseSkillMd(content: string, path: string): SkillDefinition | null {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const instructions = frontmatterMatch[2].trim();

    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
    const versionMatch = frontmatter.match(/^version:\s*(.+)$/m);

    return {
      name: nameMatch?.[1]?.trim() || 'unknown',
      description: descMatch?.[1]?.trim() || '',
      version: versionMatch?.[1]?.trim() || '1.0.0',
      instructions,
      path,
    };
  }
}
