import { SkillCommand } from './types';

export class SkillCommandRegistry {
  private commands: Map<string, SkillCommand>;

  constructor() {
    this.commands = new Map();
  }

  register(command: SkillCommand): void {
    this.commands.set(command.name, command);
  }

  unregister(name: string): void {
    this.commands.delete(name);
  }

  get(name: string): SkillCommand | undefined {
    return this.commands.get(name);
  }

  getAll(): SkillCommand[] {
    return Array.from(this.commands.values());
  }

  search(query: string): SkillCommand[] {
    const lower = query.toLowerCase();
    return Array.from(this.commands.values()).filter(
      (cmd) => cmd.name.toLowerCase().includes(lower) || cmd.description.toLowerCase().includes(lower)
    );
  }
}
