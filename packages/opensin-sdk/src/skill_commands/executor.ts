import { SkillCommand, SkillCommandResult } from './types';
import { validateArgs, parseArgs } from './helpers';

export class SkillCommandExecutor {
  async execute(command: SkillCommand, args: Record<string, string>): Promise<SkillCommandResult> {
    const errors = validateArgs(command.args, args);
    if (errors.length > 0) {
      return { success: false, output: '', error: errors.join('\n') };
    }

    const parsedArgs = parseArgs(command.args, args);

    try {
      const output = await this.runSkill(command.skillId, parsedArgs);
      return { success: true, output };
    } catch (err) {
      return { success: false, output: '', error: String(err) };
    }
  }

  private async runSkill(skillId: string, args: Record<string, unknown>): Promise<string> {
    return `[Skill: ${skillId}] Executed with args: ${JSON.stringify(args)}`;
  }
}
