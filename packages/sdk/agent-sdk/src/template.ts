import { TemplateOptions } from "./types.js";

export class TemplateGenerator {
  generateAgentScaffold(options: TemplateOptions): Map<string, string> {
    const files = new Map<string, string>();
    const dir = options.outputDir ?? options.agentName;

    files.set(
      `${dir}/package.json`,
      this.#generatePackageJson(options),
    );

    files.set(
      `${dir}/tsconfig.json`,
      this.#generateTsConfig(),
    );

    files.set(
      `${dir}/src/index.ts`,
      this.#generateIndex(options),
    );

    files.set(
      `${dir}/src/agent.ts`,
      this.#generateAgentFile(options),
    );

    files.set(
      `${dir}/README.md`,
      this.#generateReadme(options),
    );

    return files;
  }

  generateToolTemplate(toolName: string): string {
    const pascalName = this.#toPascalCase(toolName);
    const camelName = this.#toCamelCase(toolName);

    return `import { ToolDefinition, ToolContext, ToolResult } from "@opensin/agent-sdk";

export const ${camelName}Tool: ToolDefinition = {
  name: "${toolName}",
  description: "TODO: Describe what this tool does",
  inputSchema: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "TODO: Describe the input",
        required: true,
      },
    },
    required: ["input"],
  },
  async handler(input: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const { input: userInput } = input as { input: string };

    // TODO: Implement tool logic
    return {
      success: true,
      content: \`Processed: \${userInput}\`,
    };
  },
};
`;
  }

  generateConfigTemplate(options: TemplateOptions): string {
    return JSON.stringify(
      {
        agent: {
          name: options.agentName,
          description: options.description ?? "",
          version: options.version ?? "0.1.0",
          author: options.author ?? "",
        },
        permissions: (options.permissions ?? []).map((p) => ({
          resource: p,
          action: "*",
        })),
        tools: options.tools ?? [],
        settings: {
          maxConcurrentTasks: 5,
          timeout: 30000,
        },
      },
      null,
      2,
    );
  }

  #generatePackageJson(options: TemplateOptions): string {
    return JSON.stringify(
      {
        name: `@opensin/agent-${options.agentName}`,
        version: options.version ?? "0.1.0",
        description: options.description ?? `Custom agent: ${options.agentName}`,
        type: "module",
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        scripts: {
          build: "tsc",
          dev: "tsc --watch",
        },
        dependencies: {
          "@opensin/agent-sdk": "^0.1.0",
        },
        devDependencies: {
          typescript: "^5.4.0",
        },
      },
      null,
      2,
    );
  }

  #generateTsConfig(): string {
    return JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          declaration: true,
          outDir: "./dist",
          rootDir: "./src",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
        },
        include: ["src/**/*.ts"],
        exclude: ["node_modules", "dist"],
      },
      null,
      2,
    );
  }

  #generateIndex(options: TemplateOptions): string {
    const toolImports = (options.tools ?? [])
      .map((tool) => `import { ${this.#toCamelCase(tool)}Tool } from "./tools/${this.#toCamelCase(tool)}.js";`)
      .join("\n");

    const toolRegistrations = (options.tools ?? [])
      .map((tool) => `    this.registerTool(${this.#toCamelCase(tool)}Tool);`)
      .join("\n");

    return `export { ${this.#toPascalCase(options.agentName)}Agent } from "./agent.js";
${toolImports ? `\n${toolImports}\n` : ""}
`;
  }

  #generateAgentFile(options: TemplateOptions): string {
    const toolImports = (options.tools ?? [])
      .map((tool) => `import { ${this.#toCamelCase(tool)}Tool } from "./tools/${this.#toCamelCase(tool)}.js";`)
      .join("\n");

    const toolRegistrations = (options.tools ?? [])
      .map((tool) => `    this.registerTool(${this.#toCamelCase(tool)}Tool);`)
      .join("\n");

    const permissions = (options.permissions ?? [])
      .map((p) => `      { resource: "${p}", action: "*" },`)
      .join("\n");

    return `import { Agent, AgentConfig } from "@opensin/agent-sdk";
${toolImports ? `\n${toolImports}\n` : ""}
const config: AgentConfig = {
  id: "${options.agentName}",
  name: "${options.agentName}",
  description: "${options.description ?? 'Custom agent: ' + options.agentName}",
  version: "${options.version ?? "0.1.0"}",
  permissions: [
${permissions}
  ],
};

export class ${this.#toPascalCase(options.agentName)}Agent extends Agent {
  constructor() {
    super(config);
${toolRegistrations ? `\n${toolRegistrations}\n` : ""}
  }

  protected async onInit(): Promise<void> {
    // TODO: Add initialization logic
    console.log("[${options.agentName}] Initializing...");
  }

  protected async onRun(input: string): Promise<string> {
    // TODO: Add agent logic
    console.log("[${options.agentName}] Running with input:", input);
    return "TODO: Implement agent logic";
  }

  protected async onCleanup(): Promise<void> {
    // TODO: Add cleanup logic
    console.log("[${options.agentName}] Cleaning up...");
  }
}
`;
  }

  #generateReadme(options: TemplateOptions): string {
    return `# ${options.agentName} Agent

${options.description ?? `Custom agent built with @opensin/agent-sdk`}

## Getting Started

\`\`\`bash
npm install
npm run build
\`\`\`

## Usage

\`\`\`typescript
import { ${this.#toPascalCase(options.agentName)}Agent } from "./src/index.js";

const agent = new ${this.#toPascalCase(options.agentName)}Agent();
await agent.initialize();

const result = await agent.run("your task here");
console.log(result.output);

await agent.cleanup();
\`\`\`

## Tools

${(options.tools ?? []).length > 0 ? (options.tools ?? []).map((t) => `- ${t}`).join("\n") : "No tools registered yet."}

## Permissions

${(options.permissions ?? []).length > 0 ? (options.permissions ?? []).map((p) => `- ${p}`).join("\n") : "No permissions configured."}
`;
  }

  #toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
      .replace(/^[a-z]/, (char) => char.toUpperCase());
  }

  #toCamelCase(str: string): string {
    const pascal = this.#toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }
}
