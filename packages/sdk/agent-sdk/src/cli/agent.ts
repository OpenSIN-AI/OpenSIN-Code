import { TemplateGenerator } from "../template.js";
import type { TemplateOptions, AgentCreateResult } from "../types.js";
import * as fs from "fs";
import * as path from "path";

export async function handleAgentCreateCommand(
  name: string,
  options?: {
    description?: string;
    author?: string;
    version?: string;
    tools?: string[];
    permissions?: string[];
    outputDir?: string;
  },
): Promise<AgentCreateResult> {
  if (!name || name.trim().length === 0) {
    return {
      success: false,
      message: "Agent name is required. Usage: sincode agent create <name>",
      files: [],
      outputDir: "",
    };
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name)) {
    return {
      success: false,
      message:
        'Invalid agent name. Must start with a letter and contain only alphanumeric characters, hyphens, and underscores.',
      files: [],
      outputDir: "",
    };
  }

  try {
    const templateOptions: TemplateOptions = {
      agentName: name,
      description: options?.description,
      author: options?.author,
      version: options?.version,
      tools: options?.tools,
      permissions: options?.permissions,
      outputDir: options?.outputDir ?? name,
    };

    const generator = new TemplateGenerator();
    const files = generator.generateAgentScaffold(templateOptions);

    const outputDir = templateOptions.outputDir ?? name;
    const createdFiles: string[] = [];

    for (const [filePath, content] of files) {
      const fullPath = path.resolve(filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, "utf-8");
      createdFiles.push(filePath);
    }

    const configContent = generator.generateConfigTemplate(templateOptions);
    const configPath = path.join(outputDir, "agent.config.json");
    fs.writeFileSync(path.resolve(configPath), configContent, "utf-8");
    createdFiles.push(configPath);

    return {
      success: true,
      message: `Agent "${name}" scaffold created in ${outputDir}/`,
      files: createdFiles,
      outputDir,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      files: [],
      outputDir: "",
    };
  }
}

export function parseAgentCommand(input: string): {
  action: string;
  args: string[];
} {
  const parts = input.trim().split(/\s+/);
  const action = parts[0] ?? "";
  const args = parts.slice(1);
  return { action, args };
}
