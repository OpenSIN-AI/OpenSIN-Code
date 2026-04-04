#!/usr/bin/env node
/**
 * OpenSIN CLI — Standalone entry point.
 * 
 * Usage:
 *   opensin                    # Interactive REPL mode
 *   opensin "Hello world"      # Single command mode
 *   echo "Hello" | opensin     # Pipe mode
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { OpenSINClient, createClient } from '../client.js';
import { StdinHandler } from './stdin_handler.js';
import { SessionManager } from './session_manager.js';
import { CliConfig } from './types.js';

const DEFAULT_CONFIG: CliConfig = {
  apiUrl: 'http://localhost:8000',
  defaultModel: 'opensin-default',
  workspace: process.cwd(),
  permissionMode: 'auto',
  maxIterations: 50,
  sandboxEnabled: false,
};

const CONFIG_FILE = path.join(os.homedir(), '.opensin', 'cli_config.json');

/**
 * Load CLI config from disk.
 */
function loadConfig(): CliConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {
    // Use defaults
  }
  return DEFAULT_CONFIG;
}

/**
 * Save CLI config to disk.
 */
function saveConfig(config: Partial<CliConfig>): void {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const existing = loadConfig();
    const merged = { ...existing, ...config };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2));
  } catch {
    // Silently fail
  }
}

async function main(): Promise<void> {
  const program = new Command();

  program
    .name('opensin')
    .description('OpenSIN CLI — AI-powered coding assistant')
    .version('0.1.0')
    .option('-u, --api-url <url>', 'API server URL')
    .option('-k, --api-key <key>', 'API key')
    .option('-m, --model <model>', 'Model name')
    .option('-w, --workspace <dir>', 'Workspace directory')
    .option('-p, --permission <mode>', 'Permission mode (auto/ask/readonly)')
    .option('-s, --sandbox', 'Enable sandbox mode')
    .argument('[query]', 'Single query (non-interactive mode)');

  program.parse();

  const opts = program.opts();
  const config = loadConfig();

  // Override with CLI options
  if (opts.apiUrl) config.apiUrl = opts.apiUrl;
  if (opts.apiKey) config.apiKey = opts.apiKey;
  if (opts.model) config.defaultModel = opts.model;
  if (opts.workspace) config.workspace = path.resolve(opts.workspace);
  if (opts.permission) config.permissionMode = opts.permission;
  if (opts.sandbox) config.sandboxEnabled = true;

  // Save config if changed
  saveConfig({
    apiUrl: config.apiUrl,
    defaultModel: config.defaultModel,
    workspace: config.workspace,
    permissionMode: config.permissionMode,
    sandboxEnabled: config.sandboxEnabled,
  });

  // Create client
  const client = createClient({
    baseUrl: config.apiUrl,
    apiKey: config.apiKey,
    timeout: 60000,
  });

  try {
    await client.connect();
  } catch (error) {
    console.error(`Failed to connect to API server at ${config.apiUrl}`);
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    console.error('\nMake sure the OpenSIN API server is running.');
    console.error('Start it with: uvicorn opensin_core.api_server.server:app --reload');
    process.exit(1);
  }

  // Create session manager
  const sessionManager = new SessionManager(
    client,
    config.workspace,
    config.defaultModel,
  );

  const args = program.args;

  if (args.length > 0) {
    // Non-interactive mode: process query and exit
    const query = args.join(' ');
    console.log(`Query: ${query}`);

    const sessionId = await sessionManager.create();
    const messages = [{ role: 'user' as const, content: query }];

    try {
      const toolsResponse = await client.listTools();
      const result = await client.prompt(sessionId, messages, toolsResponse.tools as any[]);
      console.log(`\n${result.content}`);
      console.log(`\nTokens: ${result.usage.total_tokens}`);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  } else if (process.stdin.isTTY) {
    // Interactive mode: start REPL
    const handler = new StdinHandler(client, sessionManager);
    await handler.start();
  } else {
    // Pipe mode: read from stdin
    let input = '';
    process.stdin.setEncoding('utf-8');
    for await (const chunk of process.stdin) {
      input += chunk;
    }

    if (!input.trim()) {
      console.error('No input provided.');
      process.exit(1);
    }

    const sessionId = await sessionManager.create();
    const messages = [{ role: 'user' as const, content: input.trim() }];

    try {
      const toolsResponse = await client.listTools();
      const result = await client.prompt(sessionId, messages, toolsResponse.tools as any[]);
      console.log(result.content);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
