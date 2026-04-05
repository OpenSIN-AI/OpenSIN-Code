/**
 * CLI Agent Tool Registry and Execution
 */

import type { CLITool, ToolResult, ToolCallRecord } from "./types.js";

export class ToolRegistry {
  private tools = new Map<string, CLITool>();

  register(tool: CLITool): void {
    this.tools.set(tool.name, tool);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  get(name: string): CLITool | undefined {
    return this.tools.get(name);
  }

  list(): CLITool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        output: "",
        error: `Tool "${name}" not found`,
        exitCode: 1,
      };
    }
    return tool.execute(params);
  }

  getToolDefinitions(): Record<string, unknown>[] {
    return this.list().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      requiresApproval: tool.requiresApproval,
    }));
  }
}

export function createBuiltinTools(workspacePath: string): CLITool[] {
  return [
    createReadFileTool(workspacePath),
    createWriteFileTool(workspacePath),
    createEditFileTool(workspacePath),
    createListFilesTool(workspacePath),
    createRunCommandTool(workspacePath),
    createGrepTool(workspacePath),
    createSearchFilesTool(workspacePath),
    createGitStatusTool(workspacePath),
    createGitDiffTool(workspacePath),
    createProfileTool(workspacePath),
    createMemoryTool(workspacePath),
  ];
}

function createProfileTool(workspacePath: string): CLITool {
  return {
    name: "profile",
    description: "Manage agent profiles. Actions: list, switch, create, delete, show, current",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "switch", "create", "delete", "show", "current"], description: "Action to perform" },
        name: { type: "string", description: "Profile name" },
        description: { type: "string", description: "Profile description" },
        prompt: { type: "string", description: "Profile system prompt" },
        mode: { type: "string", enum: ["primary", "subagent", "all"] },
        model: { type: "string", description: "Model to pin" },
        temperature: { type: "number" },
        color: { type: "string" },
      },
      required: ["action"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { createProfileManager } = await import("../agent_profiles/manager.js");
        const pm = createProfileManager(workspacePath);
        await pm.init();

        const action = params.action as string;
        const name = params.name as string;

        switch (action) {
          case "list": {
            const profiles = pm.listProfiles();
            const active = pm.getActiveProfile();
            const lines = profiles.map(p => {
              const marker = p.name === active ? " ◀ ACTIVE" : "";
              const sourceTag = p.source === "builtin" ? "[built-in]" : `[${p.source}]`;
              return `${p.name} ${sourceTag} — ${p.description}${marker}`;
            });
            return { success: true, output: `Available profiles:\n\n${lines.join("\n")}` };
          }
          case "current": {
            const active = pm.getActiveProfile();
            const resolution = pm.resolveProfile();
            if (!resolution) return { success: false, output: "No active profile.", error: "No profile" };
            const p = resolution.profile;
            const info = [
              `Active profile: ${p.name}`,
              `Description: ${p.description}`,
              `Mode: ${p.mode}`,
              `Source: ${p.source}`,
              p.model ? `Model: ${p.model}` : null,
              p.color ? `Color: ${p.color}` : null,
            ].filter(Boolean).join("\n");
            return { success: true, output: info };
          }
          case "switch": {
            if (!name) return { success: false, output: "Usage: profile switch <name>", error: "Missing name" };
            const ok = pm.setActiveProfile(name);
            if (!ok) return { success: false, output: `Profile "${name}" not found.`, error: "Not found" };
            return { success: true, output: `Switched to profile: ${name}` };
          }
          case "show": {
            if (!name) return { success: false, output: "Usage: profile show <name>", error: "Missing name" };
            const profile = pm.getProfile(name);
            if (!profile) return { success: false, output: `Profile "${name}" not found.`, error: "Not found" };
            const details = [
              `Name: ${profile.name}`,
              `Description: ${profile.description}`,
              `Mode: ${profile.mode}`,
              `Source: ${profile.source}`,
              profile.model ? `Model: ${profile.model}` : null,
              profile.temperature ? `Temperature: ${profile.temperature}` : null,
              profile.color ? `Color: ${profile.color}` : null,
              "",
              "Prompt:",
              profile.prompt,
            ].filter(Boolean).join("\n");
            return { success: true, output: details };
          }
          case "create": {
            if (!name || !params.prompt) return { success: false, output: "Usage: profile create <name> --prompt \"system prompt\"", error: "Missing params" };
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const agentsDir = path.join(workspacePath, ".opensin", "agents");
            await fs.mkdir(agentsDir, { recursive: true });
            const filePath = path.join(agentsDir, `${name}.md`);
            let content = "---\n";
            content += `description: ${params.description || ""}\n`;
            content += `mode: ${params.mode || "all"}\n`;
            if (params.model) content += `model: ${params.model}\n`;
            if (params.temperature) content += `temperature: ${params.temperature}\n`;
            if (params.color) content += `color: ${params.color}\n`;
            content += "---\n\n";
            content += params.prompt as string;
            await fs.writeFile(filePath, content, "utf-8");
            return { success: true, output: `Created profile: ${name}\nSaved to: .opensin/agents/${name}.md` };
          }
          case "delete": {
            if (!name) return { success: false, output: "Usage: profile delete <name>", error: "Missing name" };
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const filePath = path.join(workspacePath, ".opensin", "agents", `${name}.md`);
            try {
              await fs.unlink(filePath);
              return { success: true, output: `Deleted profile: ${name}` };
            } catch {
              return { success: false, output: `Cannot delete "${name}". Built-in profiles cannot be deleted.`, error: "Cannot delete" };
            }
          }
          default:
            return { success: false, output: `Unknown action: ${action}. Use: list, switch, create, delete, show, current`, error: "Unknown action" };
        }
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createProfileTool(workspacePath: string): CLITool {
  return {
    name: "profile",
    description: "Manage agent profiles. Actions: list, switch, create, delete, show, current",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "switch", "create", "delete", "show", "current"], description: "Action to perform" },
        name: { type: "string", description: "Profile name" },
        description: { type: "string", description: "Profile description" },
        prompt: { type: "string", description: "Profile system prompt" },
        mode: { type: "string", enum: ["primary", "subagent", "all"] },
        model: { type: "string", description: "Model to pin" },
        temperature: { type: "number" },
        color: { type: "string" },
      },
      required: ["action"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { createProfileManager } = await import("../agent_profiles/manager.js");
        const pm = createProfileManager(workspacePath);
        await pm.init();

        const action = params.action as string;
        const name = params.name as string;

        switch (action) {
          case "list": {
            const profiles = pm.listProfiles();
            const active = pm.getActiveProfile();
            const lines = profiles.map(p => {
              const marker = p.name === active ? " ◀ ACTIVE" : "";
              const sourceTag = p.source === "builtin" ? "[built-in]" : `[${p.source}]`;
              return `${p.name} ${sourceTag} — ${p.description}${marker}`;
            });
            return { success: true, output: `Available profiles:\n\n${lines.join("\n")}` };
          }
          case "current": {
            const active = pm.getActiveProfile();
            const resolution = pm.resolveProfile();
            if (!resolution) return { success: false, output: "No active profile.", error: "No profile" };
            const p = resolution.profile;
            const info = [
              `Active profile: ${p.name}`,
              `Description: ${p.description}`,
              `Mode: ${p.mode}`,
              `Source: ${p.source}`,
              p.model ? `Model: ${p.model}` : null,
              p.color ? `Color: ${p.color}` : null,
            ].filter(Boolean).join("\n");
            return { success: true, output: info };
          }
          case "switch": {
            if (!name) return { success: false, output: "Usage: profile switch <name>", error: "Missing name" };
            const ok = pm.setActiveProfile(name);
            if (!ok) return { success: false, output: `Profile "${name}" not found.`, error: "Not found" };
            return { success: true, output: `Switched to profile: ${name}` };
          }
          case "show": {
            if (!name) return { success: false, output: "Usage: profile show <name>", error: "Missing name" };
            const profile = pm.getProfile(name);
            if (!profile) return { success: false, output: `Profile "${name}" not found.`, error: "Not found" };
            const details = [
              `Name: ${profile.name}`,
              `Description: ${profile.description}`,
              `Mode: ${profile.mode}`,
              `Source: ${profile.source}`,
              profile.model ? `Model: ${profile.model}` : null,
              profile.temperature ? `Temperature: ${profile.temperature}` : null,
              profile.color ? `Color: ${profile.color}` : null,
              "",
              "Prompt:",
              profile.prompt,
            ].filter(Boolean).join("\n");
            return { success: true, output: details };
          }
          case "create": {
            if (!name || !params.prompt) return { success: false, output: "Usage: profile create <name> --prompt \"system prompt\"", error: "Missing params" };
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const agentsDir = path.join(workspacePath, ".opensin", "agents");
            await fs.mkdir(agentsDir, { recursive: true });
            const filePath = path.join(agentsDir, `${name}.md`);
            let content = "---\n";
            content += `description: ${params.description || ""}\n`;
            content += `mode: ${params.mode || "all"}\n`;
            if (params.model) content += `model: ${params.model}\n`;
            if (params.temperature) content += `temperature: ${params.temperature}\n`;
            if (params.color) content += `color: ${params.color}\n`;
            content += "---\n\n";
            content += params.prompt as string;
            await fs.writeFile(filePath, content, "utf-8");
            return { success: true, output: `Created profile: ${name}\nSaved to: .opensin/agents/${name}.md` };
          }
          case "delete": {
            if (!name) return { success: false, output: "Usage: profile delete <name>", error: "Missing name" };
            const fs = await import("node:fs/promises");
            const path = await import("node:path");
            const filePath = path.join(workspacePath, ".opensin", "agents", `${name}.md`);
            try {
              await fs.unlink(filePath);
              return { success: true, output: `Deleted profile: ${name}` };
            } catch {
              return { success: false, output: `Cannot delete "${name}". Built-in profiles cannot be deleted.`, error: "Cannot delete" };
            }
          }
          default:
            return { success: false, output: `Unknown action: ${action}. Use: list, switch, create, delete, show, current`, error: "Unknown action" };
        }
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createReadFileTool(workspacePath: string): CLITool {
  return {
    name: "read_file",
    description: "Read the contents of a file",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to workspace" },
        startLine: { type: "number", description: "Starting line number (1-indexed)" },
        endLine: { type: "number", description: "Ending line number (1-indexed)" },
      },
      required: ["path"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const fullPath = path.resolve(workspacePath, params.path as string);
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");
        const start = ((params.startLine as number) ?? 1) - 1;
        const end = (params.endLine as number) ?? lines.length;
        const sliced = lines.slice(start, end).join("\n");
        return { success: true, output: sliced };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createWriteFileTool(workspacePath: string): CLITool {
  return {
    name: "write_file",
    description: "Write content to a file (creates or overwrites)",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to workspace" },
        content: { type: "string", description: "File content" },
      },
      required: ["path", "content"],
    },
    requiresApproval: true,
    execute: async (params) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const fullPath = path.resolve(workspacePath, params.path as string);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, params.content as string, "utf-8");
        return { success: true, output: `Written ${params.path}` };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createEditFileTool(workspacePath: string): CLITool {
  return {
    name: "edit_file",
    description: "Apply a search/replace edit to a file",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to workspace" },
        oldText: { type: "string", description: "Text to search for" },
        newText: { type: "string", description: "Text to replace with" },
      },
      required: ["path", "oldText", "newText"],
    },
    requiresApproval: true,
    execute: async (params) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const fullPath = path.resolve(workspacePath, params.path as string);
        const content = fs.readFileSync(fullPath, "utf-8");
        if (!content.includes(params.oldText as string)) {
          return { success: false, output: "", error: "Search text not found in file" };
        }
        const newContent = content.replace(params.oldText as string, params.newText as string);
        fs.writeFileSync(fullPath, newContent, "utf-8");
        return { success: true, output: `Edited ${params.path}` };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createListFilesTool(workspacePath: string): CLITool {
  return {
    name: "list_files",
    description: "List files in a directory",
    parameters: {
      type: "object",
      properties: {
        path: { type: "string", description: "Directory path relative to workspace" },
        recursive: { type: "boolean", description: "List recursively" },
      },
      required: [],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const fs = require("fs");
        const path = require("path");
        const fullPath = path.resolve(workspacePath, (params.path as string) ?? ".");
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const result = entries.map((e: any) => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : "file",
        }));
        return { success: true, output: JSON.stringify(result, null, 2) };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createRunCommandTool(workspacePath: string): CLITool {
  return {
    name: "run_command",
    description: "Execute a shell command",
    parameters: {
      type: "object",
      properties: {
        command: { type: "string", description: "Command to execute" },
        cwd: { type: "string", description: "Working directory" },
        timeout: { type: "number", description: "Timeout in ms" },
      },
      required: ["command"],
    },
    requiresApproval: true,
    execute: async (params) => {
      try {
        const { execSync } = require("child_process");
        const cwd = (params.cwd as string)
          ? require("path").resolve(workspacePath, params.cwd as string)
          : workspacePath;
        const output = execSync(params.command as string, {
          cwd,
          encoding: "utf-8",
          timeout: (params.timeout as number) ?? 30000,
          maxBuffer: 10 * 1024 * 1024,
        });
        return { success: true, output, exitCode: 0 };
      } catch (e: any) {
        return {
          success: false,
          output: e.stdout ?? "",
          error: e.stderr ?? e.message,
          exitCode: e.status ?? 1,
        };
      }
    },
  };
}

function createGrepTool(workspacePath: string): CLITool {
  return {
    name: "grep",
    description: "Search for a pattern in files",
    parameters: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Regex pattern to search for" },
        path: { type: "string", description: "Directory to search in" },
        filePattern: { type: "string", description: "File glob pattern" },
      },
      required: ["pattern"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { execSync } = require("child_process");
        const searchPath = (params.path as string)
          ? require("path").resolve(workspacePath, params.path as string)
          : workspacePath;
        const fileArg = (params.filePattern as string) ? `--include="${params.filePattern}"` : "";
        const output = execSync(`grep -rn ${fileArg} "${params.pattern}" "${searchPath}" 2>/dev/null || true`, {
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });
        return { success: true, output: output.trim() || "No matches found" };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createSearchFilesTool(workspacePath: string): CLITool {
  return {
    name: "search_files",
    description: "Find files by name pattern",
    parameters: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "File name pattern (glob)" },
        path: { type: "string", description: "Directory to search in" },
      },
      required: ["pattern"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { execSync } = require("child_process");
        const searchPath = (params.path as string)
          ? require("path").resolve(workspacePath, params.path as string)
          : workspacePath;
        const output = execSync(`find "${searchPath}" -name "${params.pattern}" 2>/dev/null | head -100`, {
          encoding: "utf-8",
        });
        return { success: true, output: output.trim() || "No files found" };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createGitStatusTool(workspacePath: string): CLITool {
  return {
    name: "git_status",
    description: "Get git status of the workspace",
    parameters: {
      type: "object",
      properties: {},
    },
    requiresApproval: false,
    execute: async () => {
      try {
        const { execSync } = require("child_process");
        const output = execSync("git status --short", {
          cwd: workspacePath,
          encoding: "utf-8",
        });
        return { success: true, output: output.trim() || "Working tree clean" };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createGitDiffTool(workspacePath: string): CLITool {
  return {
    name: "git_diff",
    description: "Get git diff of changes",
    parameters: {
      type: "object",
      properties: {
        file: { type: "string", description: "Specific file to diff" },
        staged: { type: "boolean", description: "Show staged changes" },
      },
      required: [],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { execSync } = require("child_process");
        const flag = params.staged ? "--staged" : "";
        const file = (params.file as string) ?? "";
        const output = execSync(`git diff ${flag} ${file}`, {
          cwd: workspacePath,
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });
        return { success: true, output: output.trim() || "No changes" };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createMemoryTool(workspacePath: string): CLITool {
  return {
    name: "memory",
    description: "Save durable information to persistent memory that survives across sessions. Shared between OpenSIN-Code CLI and sin-hermes-agent-main. Actions: add, replace, remove, read. Targets: memory (personal notes), user (user profile).",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["add", "replace", "remove", "read"], description: "Action to perform" },
        target: { type: "string", enum: ["memory", "user"], description: "Which store: memory or user" },
        content: { type: "string", description: "Entry content for add/replace" },
        old_text: { type: "string", description: "Substring to identify entry for replace/remove" },
      },
      required: ["action", "target"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { MemoryStore, createMemoryStore } = await import("../hermes_memory/index.js");
        const store = createMemoryStore();
        await store.loadFromDisk();

        const action = params.action as string;
        const target = (params.target as string) || "memory";
        const content = params.content as string;
        const oldText = params.old_text as string;

        let result;
        switch (action) {
          case "add":
            if (!content) return { success: false, output: "", error: "Content required for add" };
            result = await store.add(target, content);
            break;
          case "replace":
            if (!oldText || !content) return { success: false, output: "", error: "old_text and content required for replace" };
            result = await store.replace(target, oldText, content);
            break;
          case "remove":
            if (!oldText) return { success: false, output: "", error: "old_text required for remove" };
            result = await store.remove(target, oldText);
            break;
          case "read":
            const entries = target === "user" ? store.userEntries : store.memoryEntries;
            result = { success: true, target, entries, entry_count: entries.length, usage: `${store.charCount(target).toLocaleString()}/${store.charLimit(target).toLocaleString()} chars` };
            break;
          default:
            return { success: false, output: "", error: `Unknown action: ${action}. Use: add, replace, remove, read` };
        }
        return { success: result.success, output: JSON.stringify(result, null, 2), error: result.success ? undefined : result.error };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}

function createMemoryTool(workspacePath: string): CLITool {
  return {
    name: "memory",
    description: "Save durable information to persistent memory that survives across sessions. Shared between OpenSIN-Code CLI and sin-hermes-agent-main. Actions: add, replace, remove, read. Targets: memory (personal notes), user (user profile).",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["add", "replace", "remove", "read"], description: "Action to perform" },
        target: { type: "string", enum: ["memory", "user"], description: "Which store: memory or user" },
        content: { type: "string", description: "Entry content for add/replace" },
        old_text: { type: "string", description: "Substring to identify entry for replace/remove" },
      },
      required: ["action", "target"],
    },
    requiresApproval: false,
    execute: async (params) => {
      try {
        const { MemoryStore, createMemoryStore } = await import("../hermes_memory/index.js");
        const store = createMemoryStore();
        await store.loadFromDisk();

        const action = params.action as string;
        const target = (params.target as string) || "memory";
        const content = params.content as string;
        const oldText = params.old_text as string;

        let result;
        switch (action) {
          case "add":
            if (!content) return { success: false, output: "", error: "Content required for add" };
            result = await store.add(target, content);
            break;
          case "replace":
            if (!oldText || !content) return { success: false, output: "", error: "old_text and content required for replace" };
            result = await store.replace(target, oldText, content);
            break;
          case "remove":
            if (!oldText) return { success: false, output: "", error: "old_text required for remove" };
            result = await store.remove(target, oldText);
            break;
          case "read":
            const entries = target === "user" ? store.userEntries : store.memoryEntries;
            result = { success: true, target, entries, entry_count: entries.length, usage: `${store.charCount(target).toLocaleString()}/${store.charLimit(target).toLocaleString()} chars` };
            break;
          default:
            return { success: false, output: "", error: `Unknown action: ${action}. Use: add, replace, remove, read` };
        }
        return { success: result.success, output: JSON.stringify(result, null, 2), error: result.success ? undefined : result.error };
      } catch (e) {
        return { success: false, output: "", error: (e as Error).message };
      }
    },
  };
}
