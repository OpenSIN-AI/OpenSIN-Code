import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repl } from './ui/repl.js';
import { loadConfig } from './utils/helpers.js';
import { ToolRegistry } from './tools/index.js';
import { AgentLoop } from './core/agent.js';
import { SessionManager } from './session/manager.js';
import type { Session } from './core/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function main() {
  const program = new Command();

  let version = '0.1.0';
  try {
    const pkgPath = join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    version = pkg.version;
  } catch {}

  program
    .name('sincode')
    .description('OpenSIN Code CLI — AI-powered coding agent')
    .version(version)
    .option('-m, --model <model>', 'Model to use')
    .option('-e, --effort <level>', 'Effort level: low, medium, high', 'medium')
    .option('-r, --resume [sessionId]', 'Resume a previous session')
    .option('-c, --cwd <dir>', 'Working directory', process.cwd())
    .option('--allowed-tools <tools>', 'Comma-separated list of allowed tools')
    .argument('[query]', 'Query to run (if omitted, starts REPL mode)')
    .action(async (query: string | undefined, opts: any) => {
      const config = loadConfig(opts.cwd);
      if (opts.model) config.model = opts.model;
      if (opts.effort) config.effort = opts.effort;
      if (opts.allowedTools) {
        config.allowedTools = opts.allowedTools.split(',').map((s: string) => s.trim());
      }

      const toolRegistry = new ToolRegistry();
      const sessionManager = new SessionManager();

      let session: Session | undefined = undefined;
      if (opts.resume) {
        const sid = typeof opts.resume === 'string' ? opts.resume : undefined;
        const loaded = await sessionManager.loadLast(sid);
        if (loaded) {
          session = loaded;
          console.log(`Resuming session: ${session.title} (${session.sessionId})`);
        }
      }

      const agent = new AgentLoop(config, toolRegistry);

      if (query) {
        const messages = await agent.start(query, session);
        const lastAssistant = messages.filter((m) => m.role === 'assistant' && m.content).pop();
        if (lastAssistant?.content) {
          console.log(lastAssistant.content);
        }
      } else {
        await repl(agent, sessionManager, config, session);
      }
    });

  program.parse();
}
