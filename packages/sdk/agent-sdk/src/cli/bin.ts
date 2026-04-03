#!/usr/bin/env node

import { handleAgentCreateCommand } from "./agent.js";

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: sincode agent create <name> [options]");
  console.log("");
  console.log("Commands:");
  console.log("  create <name>    Create a new agent scaffold");
  console.log("");
  console.log("Options:");
  console.log("  --description    Agent description");
  console.log("  --author         Author name");
  console.log("  --version        Version (default: 0.1.0)");
  console.log("  --tools          Comma-separated list of tool names");
  console.log("  --permissions    Comma-separated list of permissions");
  console.log("  --output-dir     Output directory (default: agent name)");
  process.exit(0);
}

const command = args[0];

if (command === "create") {
  const name = args[1];

  if (!name) {
    console.error("Error: Agent name is required");
    console.error("Usage: sincode agent create <name>");
    process.exit(1);
  }

  const parsedOptions: Record<string, string | undefined> = {};
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg?.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsedOptions[key] = value;
        i++;
      } else {
        parsedOptions[key] = "true";
      }
    }
  }

  const result = await handleAgentCreateCommand(name, {
    description: parsedOptions["description"],
    author: parsedOptions["author"],
    version: parsedOptions["version"],
    tools: parsedOptions["tools"]?.split(",").map((t) => t.trim()),
    permissions: parsedOptions["permissions"]?.split(",").map((p) => p.trim()),
    outputDir: parsedOptions["output-dir"],
  });

  if (result.success) {
    console.log(result.message);
    console.log("");
    console.log("Created files:");
    for (const file of result.files) {
      console.log(`  ${file}`);
    }
    console.log("");
    console.log("Next steps:");
    console.log(`  cd ${result.outputDir}`);
    console.log("  npm install");
    console.log("  npm run build");
  } else {
    console.error(`Error: ${result.message}`);
    process.exit(1);
  }
} else {
  console.error(`Unknown command: ${command}`);
  console.error("Usage: sincode agent create <name>");
  process.exit(1);
}
