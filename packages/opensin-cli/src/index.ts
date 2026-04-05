#!/usr/bin/env node
import { Command } from 'commander';
import { repl } from './ui/repl.js';
import { loadConfig } from './utils/helpers.js';
import { ToolRegistry } from './tools/index.js';
import { AgentLoop } from './core/agent.js';
import { SessionManager } from './session/manager.js';
import type { Session } from './core/types.js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkgPath = join(__dirname, '..', 'package.json');
let version = '0.1.0';
try {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  version = pkg.version;
} catch {
  // use default
}

const program = new Command();

program
  .name('sincode')
  .description('OpenSIN Code CLI — AI-powered coding agent')
  .version(version)
  .option('-m, --model <model>', 'Model to use')
  .option('-e, --effort <level>', 'Effort level (low, medium, high)', 'medium')
  .option('-r, --resume [sessionId]', 'Resume a previous session')
  .option('-c, --cwd <dir>', 'Working directory', process.cwd())
  .option('--allowed-tools <tools>', 'Comma-separated list of allowed tools')
  .argument('[query]', 'Query to run (if omitted, starts REPL mode)')
  .action(async (query: string | undefined, opts: any) => {
    const config = loadConfig(opts.cwd);
    if (opts.model) config.model = opts.model;
    if (opts.effort) config.effort = opts.effort as any;
    if (opts.allowedTools) {
      config.allowedTools = opts.allowedTools.split(',').map((s: string) => s.trim());
    }

    const toolRegistry = new ToolRegistry();
    const sessionManager = new SessionManager();

    let session: Session | undefined = undefined;
    if (opts.resume) {
      const sessionId = typeof opts.resume === 'string' ? opts.resume : undefined;
      session = (await sessionManager.loadLast(sessionId)) ?? undefined;
    }

    const agent = new AgentLoop(config, toolRegistry);

    if (query) {
      // One-shot mode
      const messages = await agent.start(query, session);
      const lastAssistant = messages.filter((m) => m.role === 'assistant' && m.content).pop();
      if (lastAssistant?.content) {
        console.log(lastAssistant.content);
      }
    } else {
      // REPL mode
      await repl(agent, sessionManager, config);
    }
  });

program.parse();
