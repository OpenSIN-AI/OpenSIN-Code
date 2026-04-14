/**
 * Stdin Handler — REPL loop for interactive CLI mode.
 *
 * Enhanced with OpenSIN Agent Memory plugin (/memory commands).
 */

import * as readline from 'readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { OpenSINClient } from '../client';
import { SessionManager } from './session_manager';
import { CommandHistory } from './history';
import { SlashCommand, AgentState } from './types';
import { Message, ToolDefinition } from '../types';
import { createMemoryStore, renderMemoryBlocks, type MemoryStore } from '../memory/index';

export class StdinHandler {
  private rl: readline.Interface;
  private client: OpenSINClient;
  private sessionManager: SessionManager;
  private history: CommandHistory;
  private slashCommands: Map<string, SlashCommand> = new Map();
  private running = false;
  private memoryStore: MemoryStore;

  constructor(client: OpenSINClient, sessionManager: SessionManager) {
    this.client = client;
    this.sessionManager = sessionManager;
    this.history = new CommandHistory();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '',
    });
    // Initialize memory store with current working directory as project root
    this.memoryStore = createMemoryStore(process.cwd());
  }

  registerCommand(cmd: SlashCommand): void {
    this.slashCommands.set(cmd.name, cmd);
  }

  async start(): Promise<void> {
    this.running = true;

    // Seed memory blocks on first run
    await this.memoryStore.ensureSeed();

    if (!this.sessionManager.getCurrentSession()) {
      await this.sessionManager.create();
    }
    this.updatePrompt();
    this.showBanner();

    this.rl.on('line', async (line) => {
      const input = line.trim();
      if (!input) { this.updatePrompt(); return; }
      this.history.add(input);
      if (input.startsWith('/')) {
        await this.handleSlashCommand(input);
        this.updatePrompt();
        return;
      }
      await this.processMessage(input);
      this.updatePrompt();
    });

    this.rl.on('close', () => {
      this.running = false;
      console.log('\nGoodbye!');
      process.exit(0);
    });

    this.rl.on('SIGINT', () => {
      console.log('\nInterrupted. Type /quit to exit or continue chatting.');
      this.updatePrompt();
    });
  }

  private async processMessage(input: string): Promise<void> {
    const sessionId = this.sessionManager.getCurrentSession();
    if (!sessionId) {
      console.error('No active session. Create one with /new');
      return;
    }

    // Build system prompt with memory injection
    const systemPrompt = await this.buildSystemPromptWithMemory();

    const messages: Message[] = [{ role: 'user', content: input }];
    try {
      const coreTools = ['bash', 'read_file', 'edit_file', 'write_file', 'glob', 'grep_search', 'todo_write', 'tool_search', 'sleep', 'config', 'get_errors'];
      const toolsResponse = await this.client.listTools();
      const tools = toolsResponse.tools.filter((t: ToolDefinition) => coreTools.includes(t.name));
      process.stdout.write('\n');
      const result = await this.client.prompt(sessionId, messages, tools);
      console.log(result.content);
      this.sessionManager.addTokenUsage(result.usage.input_tokens, result.usage.output_tokens);
    } catch (error) {
      console.error(`\nError: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Build system prompt with memory block injection at session start.
   * Called asynchronously during message processing.
   */
  private async buildSystemPromptWithMemory(): Promise<string> {
    const blocks = await this.memoryStore.listBlocks('all');
    if (blocks.length === 0) {
      return '';
    }
    return renderMemoryBlocks(blocks);
  }

  private async handleSlashCommand(input: string): Promise<void> {
    const parts = input.slice(1).split(' ');
    const cmdName = parts[0];
    const args = parts.slice(1).join(' ');
    const cmd = this.slashCommands.get(cmdName);
    if (cmd) {
      try { await cmd.handler(args); } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      return;
    }
    switch (cmdName) {
      case 'help': this.showHelp(); break;
      case 'quit': case 'exit': this.rl.close(); break;
      case 'clear': console.clear(); break;
      case 'new':
        await this.sessionManager.create(args || undefined);
        console.log(`New session created: ${this.sessionManager.getCurrentSession()}`);
        break;
      case 'sessions': await this.listSessions(); break;
      case 'status': this.showStatus(); break;
      case 'model':
        if (args) { this.sessionManager.setModel(args); console.log(`Model set to: ${args}`); }
        else { console.log(`Current model: ${this.sessionManager.getState().model}`); }
        break;
      case 'memory':
        await this.handleMemoryCommand(args);
        break;
      default: console.log(`Unknown command: /${cmdName}. Type /help for available commands.`);
    }
  }

  // -----------------------------------------------------------------------
  // /memory command handler
  // -----------------------------------------------------------------------

  private async handleMemoryCommand(args: string): Promise<void> {
    const parts = args.split(' ');
    const subCmd = parts[0]?.toLowerCase();

    try {
      switch (subCmd) {
        case 'list':
          await this.memoryList(parts.slice(1).join(' '));
          break;
        case 'add':
          await this.memoryAdd(parts.slice(1).join(' '));
          break;
        case 'edit':
          await this.memoryEdit(parts.slice(1).join(' '));
          break;
        case 'delete':
          await this.memoryDelete(parts.slice(1).join(' '));
          break;
        case 'search':
          await this.memorySearch(parts.slice(1).join(' '));
          break;
        case 'show':
          await this.memoryShow(parts.slice(1).join(' '));
          break;
        default:
          this.showMemoryHelp();
          break;
      }
    } catch (error) {
      console.error(`Memory error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async memoryList(scopeArg: string): Promise<void> {
    const scope = scopeArg || 'all';
    const blocks = await this.memoryStore.listBlocks(scope as any);
    if (blocks.length === 0) {
      console.log('No memory blocks found.');
      return;
    }
    console.log('\nMemory Blocks:');
    console.log('─'.repeat(60));
    for (const block of blocks) {
      const ro = block.readOnly ? ' [RO]' : '';
      console.log(`  ${block.scope}:${block.label}${ro}  (${block.value.length}/${block.limit} chars)`);
      console.log(`    ${block.description}`);
    }
    console.log();
  }

  private async memoryAdd(args: string): Promise<void> {
    // Format: /memory add <label> <content>
    // Or: /memory add <scope>:<label> <content>
    const match = args.match(/^(\w+):(\S+)\s+(.+)$/s);
    if (match) {
      const [, scope, label, content] = match;
      await this.memoryStore.setBlock(scope as any, label, content);
      console.log(`Memory block created: ${scope}:${label}`);
      return;
    }

    const spaceIdx = args.indexOf(' ');
    if (spaceIdx === -1) {
      console.log('Usage: /memory add <label> <content>');
      console.log('   or: /memory add <scope>:<label> <content>');
      return;
    }

    const label = args.slice(0, spaceIdx);
    const content = args.slice(spaceIdx + 1);
    await this.memoryStore.setBlock('project', label, content);
    console.log(`Memory block created: project:${label}`);
  }

  private async memoryEdit(args: string): Promise<void> {
    // Format: /memory edit <label> <new content>
    // Or: /memory edit <scope>:<label> <new content>
    const match = args.match(/^(\w+):(\S+)\s+(.+)$/s);
    if (match) {
      const [, scope, label, content] = match;
      await this.memoryStore.setBlock(scope as any, label, content);
      console.log(`Memory block updated: ${scope}:${label}`);
      return;
    }

    const spaceIdx = args.indexOf(' ');
    if (spaceIdx === -1) {
      console.log('Usage: /memory edit <label> <new content>');
      console.log('   or: /memory edit <scope>:<label> <new content>');
      return;
    }

    const label = args.slice(0, spaceIdx);
    const content = args.slice(spaceIdx + 1);
    await this.memoryStore.setBlock('project', label, content);
    console.log(`Memory block updated: project:${label}`);
  }

  private async memoryDelete(args: string): Promise<void> {
    // Format: /memory delete <label>
    // Or: /memory delete <scope>:<label>
    const match = args.match(/^(\w+):(\S+)$/);
    if (match) {
      const [, scope, label] = match;
      await this.memoryStore.deleteBlock(scope as any, label);
      console.log(`Memory block deleted: ${scope}:${label}`);
      return;
    }

    const label = args.trim();
    if (!label) {
      console.log('Usage: /memory delete <label>');
      console.log('   or: /memory delete <scope>:<label>');
      return;
    }

    await this.memoryStore.deleteBlock('project', label);
    console.log(`Memory block deleted: project:${label}`);
  }

  private async memorySearch(query: string): Promise<void> {
    if (!query.trim()) {
      console.log('Usage: /memory search <query>');
      return;
    }
    const results = await this.memoryStore.searchBlocks(query);
    if (results.length === 0) {
      console.log(`No memory blocks matching "${query}".`);
      return;
    }
    console.log(`\nSearch results for "${query}":`);
    console.log('─'.repeat(60));
    for (const block of results) {
      console.log(`  ${block.scope}:${block.label}  (${block.value.length}/${block.limit} chars)`);
      console.log(`    ${block.description}`);
    }
    console.log();
  }

  private async memoryShow(args: string): Promise<void> {
    // Format: /memory show <label>
    // Or: /memory show <scope>:<label>
    const match = args.match(/^(\w+):(\S+)$/);
    let scope: string, label: string;
    if (match) {
      [, scope, label] = match;
    } else {
      scope = 'project';
      label = args.trim();
    }

    if (!label) {
      console.log('Usage: /memory show <label>');
      console.log('   or: /memory show <scope>:<label>');
      return;
    }

    const block = await this.memoryStore.getBlock(scope as any, label);
    console.log(`\n${block.scope}:${block.label}`);
    console.log(`  Description: ${block.description}`);
    console.log(`  Size: ${block.value.length}/${block.limit} chars`);
    console.log(`  Read-only: ${block.readOnly}`);
    console.log(`  Last modified: ${block.lastModified.toISOString()}`);
    console.log('─'.repeat(60));
    console.log(block.value || '(empty)');
    console.log();
  }

  private showMemoryHelp(): void {
    console.log('\nMemory Commands:');
    console.log('  /memory list [scope]          List all memory blocks (scope: all/global/project)');
    console.log('  /memory add <label> <content>  Create a new memory block');
    console.log('  /memory edit <label> <content> Update an existing memory block');
    console.log('  /memory delete <label>         Delete a memory block');
    console.log('  /memory search <query>         Search memory blocks');
    console.log('  /memory show <label>           Show full content of a block');
    console.log('  /memory                        Show this help');
    console.log();
  }

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

  private updatePrompt(): void {
    const state = this.sessionManager.getState();
    const session = state.sessionId ? state.sessionId.slice(0, 8) : 'none';
    this.rl.setPrompt(`opensin [${session}]> `);
    this.rl.prompt();
  }

  private showBanner(): void {
    console.log('\nOpenSIN CLI v0.1.0');
    console.log('Type /help for commands, /quit to exit.\n');
  }

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
    console.log('  /memory            Memory management (list, add, edit, delete, search)');
    if (this.slashCommands.size > 0) {
      console.log('\nCustom commands:');
      for (const [name, cmd] of Array.from(this.slashCommands.entries())) {
        console.log(`  /${name.padEnd(16)} ${cmd.description}`);
      }
    }
    console.log();
  }

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
