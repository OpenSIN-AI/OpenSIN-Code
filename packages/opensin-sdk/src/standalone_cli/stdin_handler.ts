/**
 * Stdin Handler — REPL loop for interactive CLI mode.
 * 
 * Handles readline input, Ctrl+C, slash commands, and pipes input to the agent loop.
 */

import * as readline from 'readline';
import { OpenSINClient } from '../client.js';
import { SessionManager } from './session_manager.js';
import { CommandHistory } from './history.js';
import { SlashCommand, AgentState } from './types.js';
import { Message, StreamChunk, ToolDefinition } from '../types.js';

export class StdinHandler {
  private rl: readline.Interface;
  private client: OpenSINClient;
  private sessionManager: SessionManager;
  private history: CommandHistory;
  private slashCommands: Map<string, SlashCommand> = new Map();
  private running = false;

  constructor(
    client: OpenSINClient,
    sessionManager: SessionManager,
  ) {
    this.client = client;
    this.sessionManager = sessionManager;
    this.history = new CommandHistory();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
    });
  }

  /**
   * Register a slash command.
   */
  registerCommand(cmd: SlashCommand): void {
    this.slashCommands.set(cmd.name, cmd);
  }

  /**
   * Start the interactive REPL loop.
   */
  async start(): Promise<void> {
    this.running = true;

    // Auto-create session if none exists
    if (!this.sessionManager.getCurrentSession()) {
      await this.sessionManager.create();
    }

    this.updatePrompt();
    this.showBanner();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) {
        this.updatePrompt();
        return;
      }

      this.history.add(input);

      // Handle slash commands
      if (input.startsWith('/')) {
        await this.handleSlashCommand(input);
        this.updatePrompt();
        return;
      }

      // Process user message through agent loop
      await this.processMessage(input);
      this.updatePrompt();
    });

    this.rl.on('close', () => {
      this.running = false;
      console.log('\nGoodbye!');
      process.exit(0);
    });

    // Handle Ctrl+C
    this.rl.on('SIGINT', () => {
      console.log('\nInterrupted. Type /quit to exit or continue chatting.');
      this.updatePrompt();
    });
  }

  /**
   * Process a single message through the agent loop.
   */
  private async processMessage(input: string): Promise<void> {
    const sessionId = this.sessionManager.getCurrentSession();
    if (!sessionId) {
      console.error('No active session. Create one with /new');
      return;
    }

    const messages: Message[] = [{ role: 'user', content: input }];

    try {
      // Get available tools
      const toolsResponse = await this.client.listTools();
      const tools = toolsResponse.tools;

      // Stream the response
      process.stdout.write('\n');
      let fullContent = '';
      let totalInput = 0;
      let totalOutput = 0;

      for await (const chunk of this.client.promptStream(sessionId, messages, tools as ToolDefinition[])) {
        if (chunk.type === 'text' && chunk.content) {
          process.stdout.write(chunk.content);
          fullContent += chunk.content;
          totalOutput += chunk.content.length / 4; // rough token estimate
        } else if (chunk.type === 'tool_use' && chunk.tool_call) {
          process.stdout.write(`\n[Calling tool: ${chunk.tool_call.name}]\n`);
          // Execute tool and feed result back
          const result = await this.client.executeTool(
            chunk.tool_call.name,
            chunk.tool_call.input as Record<string, unknown>,
            this.sessionManager.getState().workspace,
            sessionId,
          );
          process.stdout.write(`[Tool result: ${JSON.stringify(result).slice(0, 200)}...]\n`);
        } else if (chunk.type === 'done' && chunk.usage) {
          totalInput = chunk.usage.input_tokens;
          totalOutput = chunk.usage.output_tokens;
        } else if (chunk.type === 'error' && chunk.error) {
          process.stdout.write(`\n[Error: ${chunk.error}]\n`);
        }
      }

      console.log(); // newline after streaming
      this.sessionManager.addTokenUsage(totalInput, totalOutput);
    } catch (error) {
      console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Handle a slash command.
   */
  private async handleSlashCommand(input: string): Promise<void> {
    const parts = input.slice(1).split(' ');
    const cmdName = parts[0];
    const args = parts.slice(1).join(' ');

    const cmd = this.slashCommands.get(cmdName);
    if (cmd) {
      try {
        await cmd.handler(args);
      } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }

    // Built-in commands
    switch (cmdName) {
      case 'help':
        this.showHelp();
        break;
      case 'quit':
      case 'exit':
        this.rl.close();
        break;
      case 'clear':
        console.clear();
        break;
      case 'new':
        await this.sessionManager.create(args || undefined);
        console.log(`New session created: ${this.sessionManager.getCurrentSession()}`);
        break;
      case 'sessions':
        await this.listSessions();
        break;
      case 'status':
        this.showStatus();
        break;
      case 'model':
        if (args) {
          this.sessionManager.setModel(args);
          console.log(`Model set to: ${args}`);
        } else {
          console.log(`Current model: ${this.sessionManager.getState().model}`);
        }
        break;
      default:
        console.log(`Unknown command: /${cmdName}. Type /help for available commands.`);
    }
  }

  /**
   * List sessions.
   */
  private async listSessions(): Promise<void> {
    try {
      const sessions = await this.sessionManager.list();
      const current = this.sessionManager.getCurrentSession();
      console.log('\nSessions:');
      for (const s of sessions) {
        const marker = s.id === current ? ' ● ' : '   ';
        console.log(`${marker}${s.id}  ${s.title || ''}  (${s.messageCount || 0} msgs)`);
      }
      console.log();
    } catch (error) {
      console.error(`Error listing sessions: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update the readline prompt.
   */
  private updatePrompt(): void {
    const state = this.sessionManager.getState();
    const session = state.sessionId ? state.sessionId.slice(0, 8) : 'none';
    this.rl.setPrompt(`opensin [${session}]> `);
    this.rl.prompt();
  }

  /**
   * Show the welcome banner.
   */
  private showBanner(): void {
    console.log('\nOpenSIN CLI v0.1.0');
    console.log('Type /help for commands, /quit to exit.\n');
  }

  /**
   * Show help information.
   */
  private showHelp(): void {
    console.log('\nAvailable commands:');
    console.log('  /help              Show this help');
    console.log('  /quit, /exit       Exit the CLI');
    console.log('  /clear             Clear the screen');
    console.log('  /new [title]       Create a new session');
    console.log('  /sessions          List all sessions');
    console.log('  /status            Show current session status');
    console.log('  /model [name]      Set or show the current model');
    console.log('  /permissions [mode] Set permission mode (auto/ask/readonly)');

    if (this.slashCommands.size > 0) {
      console.log('\nCustom commands:');
      for (const [name, cmd] of Array.from(this.slashCommands.entries())) {
        console.log(`  /${name.padEnd(16)} ${cmd.description}`);
      }
    }
    console.log();
  }

  /**
   * Show current status.
   */
  private showStatus(): void {
    const state = this.sessionManager.getState();
    console.log('\nStatus:');
    console.log(`  Session:    ${state.sessionId || 'none'}`);
    console.log(`  Model:      ${state.model}`);
    console.log(`  Workspace:  ${state.workspace}`);
    console.log(`  Permission: ${state.permissionMode}`);
    console.log(`  Turns:      ${state.turnCount}`);
    console.log(`  Tokens:     ${state.tokenUsage.total} (in: ${state.tokenUsage.input}, out: ${state.tokenUsage.output})`);
    console.log();
  }
}
