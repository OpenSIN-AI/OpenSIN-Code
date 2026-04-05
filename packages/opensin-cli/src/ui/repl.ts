import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import type { Message, Config, Session } from '../core/types.js';
import type { AgentLoop } from '../core/agent.js';
import type { SessionManager } from '../session/manager.js';
import chalk from 'chalk';

export async function repl(
  agent: AgentLoop,
  sessionManager: SessionManager,
  config: Config,
  session?: Session
): Promise<void> {
  const rl = createInterface({ input: stdin, output: stdout });

  const sessionId = session?.sessionId || `sess_${Date.now().toString(36)}`;
  let currentSession = session || {
    sessionId,
    title: 'New Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
    cwd: process.cwd(),
  };

  console.log(chalk.green.bold('\n  OpenSIN Code CLI v0.1.0'));
  console.log(chalk.gray('  Type /help for commands, Ctrl+D to exit\n'));

  agent.setCallbacks({
    onMessage: (msg) => {
      if (msg.role === 'assistant' && msg.content) {
        console.log('\n' + chalk.green('▸ ') + msg.content + '\n');
      }
    },
    onToolCall: (tc) => {
      console.log(chalk.yellow(`  🔧 Calling ${tc.function.name}...`));
    },
    onToolResult: (result) => {
      const status = result.isError ? chalk.red('✗') : chalk.green('✓');
      console.log(chalk.gray(`  ${status} Tool result (${result.content.length} chars)\n`));
    },
  });

  const prompt = () => {
    rl.question(chalk.blue.bold('sincode> '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      if (trimmed === '/exit' || trimmed === '/quit') {
        rl.close();
        return;
      }

      if (trimmed === '/help') {
        showHelp();
        prompt();
        return;
      }

      if (trimmed === '/clear') {
        currentSession.messages = [];
        console.log(chalk.gray('  Session cleared\n'));
        prompt();
        return;
      }

      if (trimmed === '/sessions') {
        const sessions = await sessionManager.list();
        if (sessions.length === 0) {
          console.log(chalk.gray('  No sessions found'));
        } else {
          for (const s of sessions) {
            const active = s.sessionId === currentSession.sessionId ? chalk.green('●') : ' ';
            console.log(`  ${active} ${s.sessionId}  ${s.title}  (${s.messageCount} msgs)`);
          }
        }
        prompt();
        return;
      }

      if (trimmed === '/model') {
        console.log(chalk.gray(`  Current model: ${config.model || 'default'}`));
        prompt();
        return;
      }

      if (trimmed.startsWith('/model ')) {
        config.model = trimmed.slice(7).trim();
        console.log(chalk.green(`  Model set to: ${config.model}`));
        prompt();
        return;
      }

      if (trimmed === '/tokens') {
        const msgs = agent.getMessages();
        const totalChars = msgs.reduce((sum, m) => sum + (m.content?.length || 0), 0);
        console.log(chalk.gray(`  Messages: ${msgs.length}, Total chars: ~${totalChars}`));
        prompt();
        return;
      }

      // Regular query
      try {
        const messages = await agent.start(trimmed, currentSession);
        currentSession.messages = messages;
        await sessionManager.save(currentSession);
      } catch (error) {
        console.log(chalk.red(`  Error: ${error instanceof Error ? error.message : String(error)}`));
      }

      prompt();
    });
  };

  rl.on('close', () => {
    console.log(chalk.gray('\n  Goodbye!\n'));
    process.exit(0);
  });

  prompt();
}

function showHelp() {
  console.log(chalk.bold('\n  Commands:'));
  console.log(chalk.gray('    /help          Show this help'));
  console.log(chalk.gray('    /clear         Clear session history'));
  console.log(chalk.gray('    /exit          Exit the CLI'));
  console.log(chalk.gray('    /quit          Exit the CLI'));
  console.log(chalk.gray('    /sessions      List all sessions'));
  console.log(chalk.gray('    /model         Show current model'));
  console.log(chalk.gray('    /model <name>  Set model'));
  console.log(chalk.gray('    /tokens        Show token usage estimate'));
  console.log(chalk.gray('    <query>        Ask anything\n'));
}
