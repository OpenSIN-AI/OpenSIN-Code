import { SkillDefinition } from './types.js';
import { discoverGlobalSkills, discoverProjectSkills } from './discovery.js';

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();

  constructor() {}

  register(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id);
  }

  getAll(): SkillDefinition[] {
    return Array.from(this.skills.values());
  }

  search(query: string): SkillDefinition[] {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter((skill) => {
      if (skill.metadata.name.toLowerCase().includes(lowerQuery)) return true;
      if (skill.metadata.tags && skill.metadata.tags.some(t => t.toLowerCase().includes(lowerQuery))) return true;
      return false;
    });
  }

  matchTriggers(text: string): SkillDefinition[] {
    const lowerText = text.toLowerCase();
    return this.getAll().filter((skill) => {
      if (!skill.metadata.triggers) return false;
      return skill.metadata.triggers.some(trigger => lowerText.includes(trigger.toLowerCase()));
    });
  }

  loadDefaults(projectDir?: string, configDir?: string): void {
    const globalSkills = discoverGlobalSkills(configDir);
    const projectSkills = discoverProjectSkills(projectDir);

    for (const skill of globalSkills) {
      this.register(skill);
    }
    // Project skills override global skills with same ID
    for (const skill of projectSkills) {
      this.register(skill);
    }
  }
}
