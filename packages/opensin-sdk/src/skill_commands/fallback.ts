import { SkillCommandResult } from './types';

export function createFallbackResult(error: string): SkillCommandResult {
  return { success: false, output: '', error };
}

export function isSkillAvailable(skillId: string, availableSkills: string[]): boolean {
  return availableSkills.includes(skillId);
}

export function getFallbackMessage(skillId: string): string {
  return `Skill "${skillId}" is not available. Check your installed skills with /skills.`;
}
