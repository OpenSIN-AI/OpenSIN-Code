import { SkillCommandArg } from './types';

export function validateArgs(args: SkillCommandArg[], provided: Record<string, string>): string[] {
  const errors: string[] = [];
  for (const arg of args) {
    if (arg.required && !provided[arg.name]) {
      errors.push(`Missing required argument: ${arg.name}`);
    }
  }
  return errors;
}

export function parseArgs(args: SkillCommandArg[], provided: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const arg of args) {
    const value = provided[arg.name] ?? arg.default;
    if (value !== undefined) {
      switch (arg.type) {
        case 'number':
          result[arg.name] = Number(value);
          break;
        case 'boolean':
          result[arg.name] = value === 'true' || value === '1';
          break;
        default:
          result[arg.name] = value;
      }
    }
  }
  return result;
}

export function formatUsage(command: { name: string; args: SkillCommandArg[]; description: string }): string {
  const argsStr = command.args
    .map((a) => (a.required ? `<${a.name}>` : `[${a.name}]`))
    .join(' ');
  return `/${command.name} ${argsStr} — ${command.description}`;
}
