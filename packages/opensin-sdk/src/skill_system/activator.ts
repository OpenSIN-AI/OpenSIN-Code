import { SkillDefinition } from './types';

export class SkillActivator {
  private activeSkills: Map<string, SkillDefinition> = new Map();

  activate(skill: SkillDefinition): void {
    this.activeSkills.set(skill.id, skill);
  }

  deactivate(id: string): void {
    this.activeSkills.delete(id);
  }

  isActive(id: string): boolean {
    return this.activeSkills.has(id);
  }

  getActiveSkills(): SkillDefinition[] {
    return Array.from(this.activeSkills.values());
  }

  getInjectedPrompt(): string {
    const skills = this.getActiveSkills();
    if (skills.length === 0) return '';

    let prompt = '## Active Skills\n\nYou have the following specialized skills loaded for this session:\n\n';
    
    for (const skill of skills) {
      prompt += `### Skill: ${skill.metadata.name}\n`;
      if (skill.metadata.description) {
        prompt += `${skill.metadata.description}\n\n`;
      }
      prompt += `#### Instructions:\n${skill.instructions}\n\n`;
    }

    return prompt;
  }
}
