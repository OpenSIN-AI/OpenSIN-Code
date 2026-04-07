export interface SkillCommand {
  name: string;
  description: string;
  skillId: string;
  args: SkillCommandArg[];
}

export interface SkillCommandArg {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'path';
  required: boolean;
  default?: string;
  description: string;
}

export interface SkillCommandResult {
  success: boolean;
  output: string;
  error?: string;
}
