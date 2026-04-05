/**
 * OpenSIN Background Agents — CLI Command Handlers
 *
 * Implements /spawn, /agents list, /agents status, /agents kill commands.
 * Integrates with the OpenSIN CLI stdin handler.
 *
 * Commands:
 *   /spawn <prompt>              — Spawn a background agent
 *   /spawn --agent <type> <prompt> — Spawn with specific agent type
 *   /agents list                 — List all delegations
 *   /agents status [id]          — Show status of all or specific delegation
 *   /agents kill <id>            — Kill a running background agent
 *   /agents retrieve <id>        — Retrieve a delegation result
 *   /agents stats                — Show delegation statistics
 *
 * Branded as OpenSIN/sincode.
 */

import type { BackgroundAgentManager } from './agent_manager.js';
import type { DelegationListItem, DelegationStatus } from './types.js';

export interface CliCommandResult {
  success: boolean;
  output: string;
  error?: string;
}

interface ParsedCommand {
  action: string;
  args: string[];
  flags: Map<string, string>;
}

function parseCommand(input: string): ParsedCommand {
  const args: string[] = [];
  const flags = new Map<string, string>();
  const tokens = input.trim().split(/\s+/);

  let action = '';
  let i = 0;

  if (tokens[0] === '/spawn') {
    action = 'spawn';
    i = 1;
  } else if (tokens[0] === '/agents' || tokens[0] === '/agent') {
    action = tokens[1] || 'list';
    i = tokens[1] ? 2 : 1;
  } else {
    action = tokens[0];
    i = 1;
  }

  for (; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = tokens[i + 1] && !tokens[i + 1].startsWith('--')
        ? tokens[++i]
        : 'true';
      flags.set(key, value);
    } else {
      args.push(token);
    }
  }

  return { action, args, flags };
}

export class BackgroundAgentCliHandler {
  private manager: BackgroundAgentManager;
  private parentSessionId: string;

  constructor(manager: BackgroundAgentManager, parentSessionId: string) {
    this.manager = manager;
    this.parentSessionId = parentSessionId;
  }

  setParentSessionId(sessionId: string): void {
    this.parentSessionId = sessionId;
  }

  async handleCommand(input: string): Promise<CliCommandResult> {
    const parsed = parseCommand(input);

    switch (parsed.action) {
      case 'spawn':
        return this.handleSpawn(parsed);
      case 'list':
        return this.handleList();
      case 'status':
        return this.handleStatus(parsed);
      case 'kill':
        return this.handleKill(parsed);
      case 'retrieve':
        return this.handleRetrieve(parsed);
      case 'stats':
        return this.handleStats();
      default:
        return {
          success: false,
          output: '',
          error: `Unknown background agent command: "${parsed.action}".\n` +
            'Available: /spawn, /agents list, /agents status, /agents kill, /agents retrieve, /agents stats',
        };
    }
  }

  private async handleSpawn(parsed: ParsedCommand): Promise<CliCommandResult> {
    const prompt = parsed.args.join(' ');
    if (!prompt) {
      return {
        success: false,
        output: '',
        error: 'Usage: /spawn [--agent <type>] [--model <model>] <prompt>\n' +
          '\nExamples:\n' +
          '  /spawn Research OAuth2 PKCE best practices\n' +
          '  /spawn --agent sin-explorer Find all API endpoints in src/\n' +
          '  /spawn --model openai/gpt-5.4 Analyze the architecture',
      };
    }

    const agentType = parsed.flags.get('agent') || undefined;
    const model = parsed.flags.get('model') || undefined;
    const maxTurns = parsed.flags.has('max-turns')
      ? parseInt(parsed.flags.get('max-turns')!, 10)
      : undefined;

    try {
      const result = await this.manager.spawn({
        prompt,
        agentType,
        parentSessionId: this.parentSessionId,
        model,
        maxTurns,
      });

      const agentLabel = agentType ? ` (${agentType})` : '';
      return {
        success: true,
        output: `OpenSIN Background Agent spawned${agentLabel}\n` +
          `   ID:      ${result.delegationId}\n` +
          `   Session: ${result.sessionId}\n` +
          `   Task:    ${prompt.slice(0, 80)}${prompt.length > 80 ? '...' : ''}\n` +
          '\nContinue working — you\'ll be notified when the agent completes.\n' +
          'Use "/agents status" to check progress.',
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to spawn background agent: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private handleList(): CliCommandResult {
    const delegations = this.manager.listDelegations(this.parentSessionId);

    if (delegations.length === 0) {
      return {
        success: true,
        output: 'No background agents active.\n\n' +
          'Use "/spawn <prompt>" to start a background agent.',
      };
    }

    const lines = [
      `OpenSIN Background Agents (${delegations.length} total)\n`,
      'ID'.padEnd(32) + 'Status'.padEnd(12) + 'Agent'.padEnd(18) + 'Title',
      '─'.repeat(90),
    ];

    for (const d of delegations) {
      const statusIcon = this.getStatusIcon(d.status);
      const title = (d.title || d.prompt).slice(0, 35);
      const paddedTitle = title.length >= (d.title || d.prompt).length ? title : title + '...';

      lines.push(
        d.id.padEnd(32) +
        `${statusIcon} ${d.status}`.padEnd(12) +
        d.agentType.padEnd(18) +
        paddedTitle
      );
    }

    const unread = delegations.filter(d => d.unread);
    if (unread.length > 0) {
      lines.push(`\n${unread.length} unread result(s). Use "/agents retrieve <id>" to view.`);
    }

    return {
      success: true,
      output: lines.join('\n'),
    };
  }

  private handleStatus(parsed: ParsedCommand): CliCommandResult {
    const delegationId = parsed.args[0];

    if (delegationId) {
      return this.handleSingleStatus(delegationId);
    }

    const delegations = this.manager.listDelegations(this.parentSessionId);
    const active = delegations.filter(d => d.status === 'running' || d.status === 'registered');
    const completed = delegations.filter(d => d.status === 'complete');
    const failed = delegations.filter(d => d.status === 'error');
    const cancelled = delegations.filter(d => d.status === 'cancelled');
    const timedOut = delegations.filter(d => d.status === 'timeout');

    const lines = [
      'OpenSIN Background Agent Status\n',
      `Total:     ${delegations.length}`,
      `Active:    ${active.length}`,
      `Completed: ${completed.length}`,
      `Failed:    ${failed.length}`,
      `Cancelled: ${cancelled.length}`,
      `Timed out: ${timedOut.length}`,
    ];

    if (active.length > 0) {
      lines.push('\nActive:');
      for (const d of active) {
        const elapsed = Math.round((Date.now() - d.createdAt.getTime()) / 1000);
        lines.push(`  ${d.id} — ${d.agentType} (${elapsed}s elapsed)`);
      }
    }

    if (completed.length > 0) {
      lines.push('\nCompleted:');
      for (const d of completed) {
        const unread = d.unread ? ' (unread)' : '';
        lines.push(`  ${d.id} — ${d.title || d.prompt.slice(0, 40)}${unread}`);
      }
    }

    return {
      success: true,
      output: lines.join('\n'),
    };
  }

  private handleSingleStatus(delegationId: string): CliCommandResult {
    const delegation = this.manager.getDelegation(delegationId);
    if (!delegation) {
      return {
        success: false,
        output: '',
        error: `Delegation "${delegationId}" not found.`,
      };
    }

    const statusIcon = this.getStatusIcon(delegation.status);
    const elapsed = delegation.startedAt
      ? Math.round((Date.now() - delegation.startedAt.getTime()) / 1000)
      : 0;

    const lines = [
      `${statusIcon} Delegation: ${delegation.id}`,
      '',
      `Status:     ${delegation.status}`,
      `Agent:      ${delegation.agentType}`,
      `Session:    ${delegation.sessionId}`,
      `Created:    ${delegation.createdAt.toISOString()}`,
      delegation.startedAt ? `Started:    ${delegation.startedAt.toISOString()}` : '',
      delegation.completedAt ? `Completed:  ${delegation.completedAt.toISOString()}` : '',
      `Elapsed:    ${elapsed}s`,
      `Tool calls: ${delegation.progress.toolCalls}`,
      delegation.title ? `Title:      ${delegation.title}` : '',
      delegation.description ? `Summary:    ${delegation.description}` : '',
      delegation.error ? `Error:      ${delegation.error}` : '',
      `Artifact:   ${delegation.artifact.filePath}`,
      delegation.artifact.persistedAt ? `Persisted:  ${delegation.artifact.persistedAt.toISOString()}` : '',
      `Retrieved:  ${delegation.retrieval.retrievalCount} time(s)`,
    ].filter(Boolean);

    return {
      success: true,
      output: lines.join('\n'),
    };
  }

  private async handleKill(parsed: ParsedCommand): Promise<CliCommandResult> {
    const delegationId = parsed.args[0];
    if (!delegationId) {
      return {
        success: false,
        output: '',
        error: 'Usage: /agents kill <delegation-id>\n\n' +
          'Use "/agents list" to see available delegation IDs.',
      };
    }

    const killed = await this.manager.kill(delegationId);
    if (!killed) {
      const delegation = this.manager.getDelegation(delegationId);
      if (!delegation) {
        return {
          success: false,
          output: '',
          error: `Delegation "${delegationId}" not found.`,
        };
      }
      return {
        success: false,
        output: '',
        error: `Delegation "${delegationId}" is already ${delegation.status} and cannot be killed.`,
      };
    }

    return {
      success: true,
      output: `Background agent "${delegationId}" has been killed.`,
    };
  }

  private async handleRetrieve(parsed: ParsedCommand): Promise<CliCommandResult> {
    const delegationId = parsed.args[0];
    if (!delegationId) {
      return {
        success: false,
        output: '',
        error: 'Usage: /agents retrieve <delegation-id>',
      };
    }

    try {
      const result = await this.manager.retrieve(delegationId, this.parentSessionId);
      return {
        success: true,
        output: `Result for "${delegationId}":\n\n${result}`,
      };
    } catch (error) {
      return {
        success: false,
        output: '',
        error: `Failed to retrieve delegation: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private handleStats(): CliCommandResult {
    const stats = this.manager.getStats();

    const lines = [
      'OpenSIN Background Agent Statistics\n',
      `Total delegations:  ${stats.total}`,
      `Active:             ${stats.active}`,
      `Completed:          ${stats.completed}`,
      `Failed:             ${stats.failed}`,
      `Cancelled:          ${stats.cancelled}`,
      `Timed out:          ${stats.timedOut}`,
    ];

    if (stats.total > 0) {
      const successRate = Math.round((stats.completed / stats.total) * 100);
      lines.push(`\nSuccess rate:       ${successRate}%`);
    }

    return {
      success: true,
      output: lines.join('\n'),
    };
  }

  private getStatusIcon(status: DelegationStatus): string {
    switch (status) {
      case 'registered': return '[REG]';
      case 'running': return '[RUN]';
      case 'complete': return '[OK]';
      case 'error': return '[ERR]';
      case 'cancelled': return '[KILL]';
      case 'timeout': return '[TIMEOUT]';
      default: return '[???]';
    }
  }
}
