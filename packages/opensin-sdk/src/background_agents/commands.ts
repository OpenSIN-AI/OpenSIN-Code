/**
 * OpenSIN Background Agents — CLI Commands
 *
 * Implements /spawn, /agents list, /agents status, /agents kill, /agents result
 * commands for the OpenSIN CLI.
 *
 * Branded as OpenSIN/sincode for the OpenSIN ecosystem.
 *
 * Phase 3.2 — Background Agents Plugin (Async agent delegation)
 * Issue: #362
 */

import { BackgroundAgentManager } from "./manager.js";
import { BackgroundAgentStatus } from "./types.js";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";

function statusColor(status: BackgroundAgentStatus): string {
  switch (status) {
    case "running": case "registered": return YELLOW;
    case "complete": return GREEN;
    case "error": return RED;
    case "cancelled": return MAGENTA;
    case "timeout": return RED;
    default: return RESET;
  }
}

function statusIcon(status: BackgroundAgentStatus): string {
  switch (status) {
    case "running": return "⏳";
    case "registered": return "📋";
    case "complete": return "✅";
    case "error": return "❌";
    case "cancelled": return "🚫";
    case "timeout": return "⏰";
    default: return "❓";
  }
}

export interface CommandContext {
  sessionId: string;
  messageId: string;
  agentName: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

export class BackgroundAgentCommands {
  private manager: BackgroundAgentManager;

  constructor(manager: BackgroundAgentManager) {
    this.manager = manager;
  }

  async spawn(prompt: string, context: CommandContext, options?: { agent?: string }): Promise<CommandResult> {
    if (!prompt || prompt.trim().length === 0) {
      return { success: false, output: "", error: "Usage: /spawn <prompt> [--agent <agent-name>]\n\nSpawn a background agent to work on a task asynchronously." };
    }

    try {
      const agent = await this.manager.spawn({
        prompt: prompt.trim(),
        agent: options?.agent,
        parentSessionId: context.sessionId,
        parentMessageId: context.messageId,
        parentAgent: context.agentName,
      });

      const output = [
        `${BOLD}${GREEN}✓ OpenSIN Background Agent Spawned${RESET}`,
        "",
        `  ${BOLD}ID:${RESET}      ${CYAN}${agent.id}${RESET}`,
        `  ${BOLD}Agent:${RESET}    ${agent.agent}`,
        `  ${BOLD}Status:${RESET}   ${statusColor(agent.status)}${statusIcon(agent.status)} ${agent.status}${RESET}`,
        `  ${BOLD}Session:${RESET}  ${DIM}${agent.sessionId}${RESET}`,
        "",
        `  ${DIM}The agent is working in the background. You can continue your work.${RESET}`,
        `  ${DIM}Use /agents status ${agent.id} to check progress.${RESET}`,
        `  ${DIM}Use /agents result ${agent.id} to retrieve results when done.${RESET}`,
      ].join("\n");

      return { success: true, output };
    } catch (err) {
      return { success: false, output: "", error: `Failed to spawn background agent: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  list(context: CommandContext): CommandResult {
    const agents = this.manager.getAgentList(context.sessionId);

    if (agents.length === 0) {
      return { success: true, output: `${DIM}No background agents spawned in this session.${RESET}\n\nUse /spawn <prompt> to start one.` };
    }

    const lines = [`${BOLD}${CYAN}OpenSIN Background Agents${RESET} (${agents.length} total)`, ""];

    for (const agent of agents) {
      const icon = statusIcon(agent.status);
      const color = statusColor(agent.status);
      const unread = agent.unread ? ` ${BOLD}${YELLOW}[UNREAD]${RESET}` : "";
      const title = agent.title ? ` — ${agent.title}` : "";
      const timeAgo = this.formatTimeAgo(agent.createdAt);

      lines.push(`  ${icon} ${color}${agent.id}${RESET}${title}${unread}`);
      lines.push(`    ${DIM}Status: ${agent.status} | Agent: ${agent.agent} | ${timeAgo}${RESET}`);
      if (agent.description) {
        lines.push(`    ${DIM}${agent.description.slice(0, 80)}${RESET}`);
      }
      lines.push("");
    }

    const summary = this.manager.getStatusSummary();
    lines.push(`${DIM}Summary: ${summary.active} active, ${summary.completed} completed, ${summary.errors} errors, ${summary.cancelled} cancelled, ${summary.timedOut} timed out${RESET}`);

    return { success: true, output: lines.join("\n") };
  }

  status(agentId: string | undefined, _context: CommandContext): CommandResult {
    if (!agentId) {
      const summary = this.manager.getStatusSummary();
      const active = this.manager.listActive();

      const lines = [
        `${BOLD}${CYAN}OpenSIN Background Agents — Status${RESET}`, "",
        `  ${BOLD}Total:${RESET}     ${summary.total}`,
        `  ${BOLD}Active:${RESET}    ${statusColor("running")}${summary.active}${RESET}`,
        `  ${BOLD}Completed:${RESET} ${statusColor("complete")}${summary.completed}${RESET}`,
        `  ${BOLD}Errors:${RESET}    ${statusColor("error")}${summary.errors}${RESET}`,
        `  ${BOLD}Cancelled:${RESET} ${statusColor("cancelled")}${summary.cancelled}${RESET}`,
        `  ${BOLD}Timed Out:${RESET} ${statusColor("timeout")}${summary.timedOut}${RESET}`,
      ];

      if (active.length > 0) {
        lines.push("", `${BOLD}Active Agents:${RESET}`);
        for (const agent of active) {
          const elapsed = this.formatDuration(agent.createdAt, new Date());
          lines.push(`  ${statusIcon(agent.status)} ${CYAN}${agent.id}${RESET} — ${DIM}running for ${elapsed}${RESET}`);
          if (agent.progress.lastMessage) {
            lines.push(`    ${DIM}Last: ${agent.progress.lastMessage}${RESET}`);
          }
        }
      }

      return { success: true, output: lines.join("\n") };
    }

    const agent = this.manager.findById(agentId);
    if (!agent) {
      return { success: false, output: "", error: `Agent "${agentId}" not found. Use /agents list to see all agents.` };
    }

    const lines = [
      `${BOLD}${CYAN}Agent Status: ${agent.id}${RESET}`, "",
      `  ${BOLD}Status:${RESET}    ${statusColor(agent.status)}${statusIcon(agent.status)} ${agent.status}${RESET}`,
      `  ${BOLD}Agent Type:${RESET} ${agent.agent}`,
      `  ${BOLD}Created:${RESET}   ${agent.createdAt.toLocaleString()}`,
      agent.startedAt ? `  ${BOLD}Started:${RESET}    ${agent.startedAt.toLocaleString()}` : "",
      agent.completedAt ? `  ${BOLD}Completed:${RESET} ${agent.completedAt.toLocaleString()}` : "",
      `  ${BOLD}Elapsed:${RESET}   ${this.formatDuration(agent.createdAt, agent.completedAt ?? new Date())}`,
      "",
      `  ${BOLD}Prompt:${RESET}`,
      `    ${DIM}${agent.prompt.slice(0, 200)}${agent.prompt.length > 200 ? "..." : ""}${RESET}`,
    ].filter(Boolean) as string[];

    if (agent.title) lines.push(`\n  ${BOLD}Title:${RESET} ${agent.title}`);
    if (agent.description) lines.push(`  ${BOLD}Description:${RESET} ${agent.description}`);
    if (agent.error) lines.push(`\n  ${BOLD}${RED}Error:${RESET} ${RED}${agent.error}${RESET}`);
    if (agent.artifact.filePath) lines.push(`\n  ${BOLD}Artifact:${RESET} ${DIM}${agent.artifact.filePath}${RESET}`);

    return { success: true, output: lines.join("\n") };
  }

  async kill(agentId: string): Promise<CommandResult> {
    if (!agentId) {
      return { success: false, output: "", error: "Usage: /agents kill <agent-id>\n\nKill a running background agent." };
    }

    const agent = this.manager.findById(agentId);
    if (!agent) {
      return { success: false, output: "", error: `Agent "${agentId}" not found.` };
    }

    if (agent.status === "complete" || agent.status === "error" || agent.status === "cancelled" || agent.status === "timeout") {
      return { success: false, output: "", error: `Agent "${agentId}" is already in terminal state: ${agent.status}.` };
    }

    await this.manager.cancel(agentId);

    return {
      success: true,
      output: `${BOLD}${RED}✗ Agent Killed${RESET}\n\n  ${BOLD}ID:${RESET} ${CYAN}${agentId}${RESET}\n  ${BOLD}Status:${RESET} ${RED}cancelled${RESET}\n\n  ${DIM}The agent has been terminated.${RESET}`,
    };
  }

  async result(agentId: string, context: CommandContext): Promise<CommandResult> {
    if (!agentId) {
      return { success: false, output: "", error: "Usage: /agents result <agent-id>\n\nRetrieve the result of a completed background agent." };
    }

    try {
      const result = await this.manager.getResult(agentId, context.sessionId);
      const agent = this.manager.findById(agentId);
      if (!agent) {
        return { success: false, output: "", error: `Agent "${agentId}" not found.` };
      }

      const lines = [
        `${BOLD}${GREEN}Agent Result: ${agent.id}${RESET}`,
        `  ${BOLD}Status:${RESET} ${statusColor(agent.status)}${statusIcon(agent.status)} ${agent.status}${RESET}`,
        agent.title ? `  ${BOLD}Title:${RESET} ${agent.title}` : "",
        "", "---", result, "---",
      ].filter(Boolean) as string[];

      return { success: true, output: lines.join("\n") };
    } catch (err) {
      return { success: false, output: "", error: `Failed to retrieve result: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async wait(agentId: string, timeoutMs?: number): Promise<CommandResult> {
    if (!agentId) {
      return { success: false, output: "", error: "Usage: /agents wait <agent-id> [--timeout <ms>]\n\nWait for a background agent to complete." };
    }

    const agent = this.manager.findById(agentId);
    if (!agent) {
      return { success: false, output: "", error: `Agent "${agentId}" not found.` };
    }

    const waitTimeout = timeoutMs ?? 60_000;
    const result = await this.manager.waitForTerminal(agentId, waitTimeout);

    if (result === "terminal") {
      const updated = this.manager.findById(agentId);
      return {
        success: true,
        output: `${BOLD}${GREEN}Agent Complete: ${agentId}${RESET}\n\n  ${BOLD}Status:${RESET} ${statusColor(updated?.status ?? "complete")}${statusIcon(updated?.status ?? "complete")} ${updated?.status}${RESET}\n  ${BOLD}Completed:${RESET} ${updated?.completedAt?.toLocaleString() ?? "N/A"}\n\n  ${DIM}Use /agents result ${agentId} to see the full output.${RESET}`,
      };
    } else {
      return {
        success: true,
        output: `${BOLD}${YELLOW}Still Running${RESET}\n\n  Agent "${agentId}" is still working after ${waitTimeout / 1000}s.\n  ${DIM}Use /agents status ${agentId} to check progress.${RESET}`,
      };
    }
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  private formatDuration(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }
}
