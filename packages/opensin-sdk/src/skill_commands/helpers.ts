import {
  SkillDefinition,
  SlashCommandParseResult,
  SkillParameter,
} from "./types.js";
import { getSkillRegistry } from "./registry.js";

const SLASH_COMMAND_REGEX = /^\/([a-zA-Z0-9_-]+)(?:\s+(.*))?$/;

export function parseSlashCommand(input: string): SlashCommandParseResult {
  const match = input.match(SLASH_COMMAND_REGEX);

  if (!match) {
    return {
      isCommand: false,
      skillName: "",
      rawArgs: "",
      parsedArgs: {},
    };
  }

  const skillName = match[1];
  const rawArgs = match[2] || "";
  const parsedArgs = parseArgs(rawArgs);

  const registry = getSkillRegistry();
  const matchedSkill = registry.getBySlashCommand(`/${skillName}`);

  return {
    isCommand: true,
    skillName,
    rawArgs,
    parsedArgs,
    matchedSkill,
  };
}

export function isSlashCommand(input: string): boolean {
  return SLASH_COMMAND_REGEX.test(input.trim());
}

export function formatSkillHelp(skill: SkillDefinition): string {
  const lines = [
    `# ${skill.name}`,
    ``,
    `${skill.description}`,
    ``,
    `**Usage:** \`${formatSkillUsage(skill)}\``,
    ``,
    `**Category:** ${skill.category}`,
    `**Version:** ${skill.version}`,
    `**Author:** ${skill.author || "Unknown"}`,
    ``,
    `## Parameters`,
    ``,
  ];

  if (skill.parameters.length === 0) {
    lines.push("No parameters required.");
  } else {
    lines.push("| Parameter | Type | Required | Description |");
    lines.push("|-----------|------|----------|-------------|");
    for (const param of skill.parameters) {
      const required = param.required ? "Yes" : "No";
      const defaultVal = param.defaultValue !== undefined
        ? ` (default: \`${JSON.stringify(param.defaultValue)}\`)`
        : "";
      const enumVals = param.enumValues
        ? ` (options: ${param.enumValues.join(", ")})`
        : "";
      lines.push(
        `| \`${param.name}\` | ${param.type} | ${required} | ${param.description}${defaultVal}${enumVals} |`
      );
    }
  }

  if (skill.tags && skill.tags.length > 0) {
    lines.push(``, `**Tags:** ${skill.tags.join(", ")}`);
  }

  return lines.join("\n");
}

export function formatSkillUsage(skill: SkillDefinition): string {
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

function parseArgs(rawArgs: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const regex = /--(\w[\w-]*)(?:=(\S+)|\s+(\S+))?/g;
  let match;

  while ((match = regex.exec(rawArgs)) !== null) {
    const key = match[1];
    const value = match[2] || match[3] || true;
    result[key] = parseValue(value);
  }

  return result;
}

function parseValue(value: string | boolean): unknown {
  if (typeof value === "boolean") return value;

  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;

  const num = Number(value);
  if (!isNaN(num) && value !== "") return num;

  if (value.startsWith("[") || value.startsWith("{")) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  return value;
}
