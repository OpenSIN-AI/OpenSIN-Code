/**
 * Custom Commands — repeatable workflows like Claude Code /skills
 */

import { CustomCommandDefinition, CommandTemplate, SharedCommand, CommandVersion, CustomCommandParam } from "./models.js";

const BUILTIN_TEMPLATES: CommandTemplate[] = [
  {
    id: "tpl-code-review",
    name: "Code Review",
    description: "Review code for quality, security, and best practices",
    category: "development",
    template: "Review the following code for:\n1. Code quality and readability\n2. Security vulnerabilities\n3. Performance issues\n4. Best practices\n\nCode:\n{{code}}\n\nFocus areas: {{focus_areas}}",
    params: [
      { name: "code", type: "string", description: "Code to review", required: true },
      { name: "focus_areas", type: "string", description: "Specific areas to focus on", required: false, defaultValue: "all" },
    ],
    examples: ["Review my auth middleware for security issues"],
  },
  {
    id: "tpl-refactor",
    name: "Refactor",
    description: "Refactor code for better structure and maintainability",
    category: "development",
    template: "Refactor the following code to improve:\n1. Readability\n2. Modularity\n3. Performance\n4. Error handling\n\nCode:\n{{code}}\n\nConstraints: {{constraints}}",
    params: [
      { name: "code", type: "string", description: "Code to refactor", required: true },
      { name: "constraints", type: "string", description: "Refactoring constraints", required: false, defaultValue: "maintain API compatibility" },
    ],
    examples: ["Refactor this function to use strategy pattern"],
  },
  {
    id: "tpl-test-gen",
    name: "Test Generator",
    description: "Generate comprehensive tests for code",
    category: "testing",
    template: "Generate tests for the following code:\n\n{{code}}\n\nTest framework: {{framework}}\nCoverage target: {{coverage}}%",
    params: [
      { name: "code", type: "string", description: "Code to test", required: true },
      { name: "framework", type: "enum", description: "Test framework", required: false, defaultValue: "jest", enumValues: ["jest", "vitest", "pytest", "mocha"] },
      { name: "coverage", type: "number", description: "Target coverage percentage", required: false, defaultValue: "80" },
    ],
    examples: ["Generate jest tests with 90% coverage"],
  },
  {
    id: "tpl-doc-gen",
    name: "Documentation Generator",
    description: "Generate documentation for code",
    category: "documentation",
    template: "Generate documentation for:\n\n{{code}}\n\nStyle: {{style}}\nInclude examples: {{include_examples}}",
    params: [
      { name: "code", type: "string", description: "Code to document", required: true },
      { name: "style", type: "enum", description: "Documentation style", required: false, defaultValue: "jsdoc", enumValues: ["jsdoc", "tsdoc", "google", "sphinx"] },
      { name: "include_examples", type: "boolean", description: "Include usage examples", required: false, defaultValue: "true" },
    ],
    examples: ["Generate JSDoc for this module"],
  },
];

export class CustomCommandManager {
  private commands: Map<string, CustomCommandDefinition> = new Map();
  private versions: Map<string, CommandVersion[]> = new Map();
  private sharedCommands: Map<string, SharedCommand> = new Map();

  constructor() {
    this.loadDefaults();
  }

  private loadDefaults(): void {
    for (const tpl of BUILTIN_TEMPLATES) {
      this.createFromTemplate(tpl.id);
    }
  }

  createCommand(definition: Omit<CustomCommandDefinition, "id" | "createdAt" | "updatedAt">): CustomCommandDefinition {
    const now = new Date().toISOString();
    const cmd: CustomCommandDefinition = {
      ...definition,
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.commands.set(cmd.id, cmd);
    this.versions.set(cmd.id, [{
      version: cmd.version,
      changelog: "Initial version",
      template: cmd.template,
      params: cmd.params,
      publishedAt: now,
      isLatest: true,
    }]);
    return cmd;
  }

  createFromTemplate(templateId: string, overrides?: Partial<CustomCommandDefinition>): CustomCommandDefinition | null {
    const tpl = BUILTIN_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return null;
    return this.createCommand({
      name: tpl.name,
      description: tpl.description,
      version: "1.0.0",
      template: tpl.template,
      params: tpl.params,
      tags: [tpl.category],
      author: "system",
      isShared: false,
      metadata: { templateId },
      ...overrides,
    });
  }

  getCommand(id: string): CustomCommandDefinition | undefined {
    return this.commands.get(id);
  }

  listCommands(tags?: string[]): CustomCommandDefinition[] {
    let cmds = Array.from(this.commands.values());
    if (tags && tags.length > 0) {
      cmds = cmds.filter(c => tags.some(t => c.tags.includes(t)));
    }
    return cmds;
  }

  updateCommand(id: string, updates: Partial<CustomCommandDefinition>): CustomCommandDefinition | null {
    const cmd = this.commands.get(id);
    if (!cmd) return null;
    const updated = { ...cmd, ...updates, updatedAt: new Date().toISOString() };
    this.commands.set(id, updated);
    return updated;
  }

  deleteCommand(id: string): boolean {
    this.commands.delete(id);
    this.versions.delete(id);
    return true;
  }

  executeCommand(id: string, params: Record<string, string>): string | null {
    const cmd = this.commands.get(id);
    if (!cmd) return null;
    let result = cmd.template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    for (const param of cmd.params) {
      if (param.defaultValue && !params[param.name]) {
        result = result.replace(new RegExp(`\\{\\{${param.name}\\}\\}`, "g"), param.defaultValue);
      }
    }
    return result;
  }

  shareCommand(id: string): SharedCommand | null {
    const cmd = this.commands.get(id);
    if (!cmd) return null;
    const shareId = `share-${Math.random().toString(36).slice(2, 10)}`;
    const shared: SharedCommand = {
      id: shareId,
      commandId: cmd.id,
      name: cmd.name,
      description: cmd.description,
      author: cmd.author,
      version: cmd.version,
      downloads: 0,
      rating: 0,
      tags: cmd.tags,
      createdAt: new Date().toISOString(),
    };
    this.sharedCommands.set(shareId, shared);
    return shared;
  }

  getSharedCommands(): SharedCommand[] {
    return Array.from(this.sharedCommands.values());
  }

  getVersions(commandId: string): CommandVersion[] {
    return this.versions.get(commandId) || [];
  }

  publishVersion(commandId: string, changelog: string): CommandVersion | null {
    const cmd = this.commands.get(commandId);
    if (!cmd) return null;
    const versions = this.versions.get(commandId) || [];
    for (const v of versions) {
      v.isLatest = false;
    }
    const newVersion: CommandVersion = {
      version: cmd.version,
      changelog,
      template: cmd.template,
      params: cmd.params,
      publishedAt: new Date().toISOString(),
      isLatest: true,
    };
    versions.push(newVersion);
    this.versions.set(commandId, versions);
    return newVersion;
  }

  getTemplates(): CommandTemplate[] {
    return [...BUILTIN_TEMPLATES];
  }
}

let _manager: CustomCommandManager | undefined;

export function getCustomCommandManager(): CustomCommandManager {
  if (!_manager) {
    _manager = new CustomCommandManager();
  }
  return _manager;
}

export { BUILTIN_TEMPLATES };
