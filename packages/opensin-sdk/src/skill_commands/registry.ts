import {
  SkillDefinition,
  SkillRegistryConfig,
  SkillCommand,
} from "./types.js";

const DEFAULT_CONFIG: SkillRegistryConfig = {
  cacheEnabled: true,
  cacheTtlMs: 5 * 60 * 1000,
  maxSkills: 500,
};

let instance: SkillRegistry | null = null;

export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map();
  private commands: Map<string, SkillDefinition> = new Map();
  private config: SkillRegistryConfig;
  private cacheTimestamp: Map<string, number> = new Map();

  constructor(config?: Partial<SkillRegistryConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  register(skill: SkillDefinition): void {
    if (this.skills.size >= this.config.maxSkills) {
      throw new Error(
        `Skill registry full (max ${this.config.maxSkills} skills)`
      );
    }

    if (this.skills.has(skill.id)) {
      throw new Error(`Skill already registered: ${skill.id}`);
    }

    this.skills.set(skill.id, skill);
    this.commands.set(skill.slashCommand, skill);
    this.cacheTimestamp.set(skill.id, Date.now());
  }

  unregister(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    this.skills.delete(skillId);
    this.commands.delete(skill.slashCommand);
    this.cacheTimestamp.delete(skillId);
    return true;
  }

  getById(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  getBySlashCommand(command: string): SkillDefinition | undefined {
    const normalized = command.startsWith("/") ? command : `/${command}`;
    return this.commands.get(normalized);
  }

  list(category?: string): SkillDefinition[] {
    const skills = Array.from(this.skills.values());
    if (category) {
      return skills.filter((s) => s.category === category);
    }
    return skills;
  }

  listCommands(): SkillCommand[] {
    return Array.from(this.commands.values()).map((skill) => ({
      name: skill.slashCommand,
      description: skill.description,
      usage: this.buildUsage(skill),
      parameters: skill.parameters,
    }));
  }

  categories(): string[] {
    const cats = new Set<string>();
    for (const skill of this.skills.values()) {
      cats.add(skill.category);
    }
    return Array.from(cats).sort();
  }

  isStale(skillId: string): boolean {
    if (!this.config.cacheEnabled) return true;
    const timestamp = this.cacheTimestamp.get(skillId);
    if (!timestamp) return true;
    return Date.now() - timestamp > this.config.cacheTtlMs;
  }

  refresh(skillId: string): void {
    this.cacheTimestamp.set(skillId, Date.now());
  }

  validateParameters(
    skillId: string,
    params: Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return { valid: false, errors: [`Skill not found: ${skillId}`] };
    }

    const errors: string[] = [];

    for (const param of skill.parameters) {
      const value = params[param.name];

      if (param.required && (value === undefined || value === null)) {
        errors.push(`Missing required parameter: ${param.name}`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (param.type === "string" && typeof value !== "string") {
        errors.push(`Parameter ${param.name} must be a string`);
      } else if (param.type === "number" && typeof value !== "number") {
        errors.push(`Parameter ${param.name} must be a number`);
      } else if (param.type === "boolean" && typeof value !== "boolean") {
        errors.push(`Parameter ${param.name} must be a boolean`);
      } else if (param.type === "enum" && param.enumValues) {
        if (!param.enumValues.includes(String(value))) {
          errors.push(
            `Parameter ${param.name} must be one of: ${param.enumValues.join(", ")}`
          );
        }
      } else if (param.type === "path" && typeof value === "string") {
        if (!value.startsWith("/") && !value.startsWith("./")) {
          errors.push(`Parameter ${param.name} must be a valid path`);
        }
      } else if (param.validationPattern && typeof value === "string") {
        const regex = new RegExp(param.validationPattern);
        if (!regex.test(value as string)) {
          errors.push(
            `Parameter ${param.name} does not match pattern: ${param.validationPattern}`
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  applyDefaults(
    skillId: string,
    params: Record<string, unknown>
  ): Record<string, unknown> {
    const skill = this.skills.get(skillId);
    if (!skill) return params;

    const result = { ...params };
    for (const param of skill.parameters) {
      if (result[param.name] === undefined && param.defaultValue !== undefined) {
        result[param.name] = param.defaultValue;
      }
    }
    return result;
  }

  private buildUsage(skill: SkillDefinition): string {
    const parts = [skill.slashCommand];
    for (const param of skill.parameters) {
      const flag = `--${param.name}`;
      if (param.required) {
        parts.push(`<${flag}>`);
      } else {
        parts.push(`[${flag}]`);
      }
    }
    return parts.join(" ");
  }
}

export function getSkillRegistry(
  config?: Partial<SkillRegistryConfig>
): SkillRegistry {
  if (!instance) {
    instance = new SkillRegistry(config);
  }
  return instance;
}

export function resetSkillRegistry(): void {
  instance = null;
}
