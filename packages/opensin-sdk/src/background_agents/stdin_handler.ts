/**
 * OpenSIN Background Agents — Stdin Handler Integration
 *
 * Integrates background agent commands with the CLI stdin handler.
 * Parses /spawn, /agents list, /agents status, /agents kill, /agents result,
 * /agents wait commands from user input.
 *
 * Branded as OpenSIN/sincode for the OpenSIN ecosystem.
 *
 * Phase 3.2 — Background Agents Plugin (Async agent delegation)
 * Issue: #362
 */

import { BackgroundAgentManager } from "./manager.js";
import { BackgroundAgentCommands, CommandContext, CommandResult } from "./commands.js";
import type { BackgroundAgentEvent } from "./types.js";

interface ParsedCommand {
  command: string;
  subcommand?: string;
  args: string[];
  options: Record<string, string>;
  rawPrompt?: string;
}

function parseBackgroundAgentCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();

  // /spawn <prompt> [--agent <name>]
  const spawnMatch = trimmed.match(/^\/spawn\s+(.+)$/s);
  if (spawnMatch) {
    const rest = spawnMatch[1];
    const options: Record<string, string> = {};
    const agentMatch = rest.match(/--agent\s+(\S+)/);
    if (agentMatch) {
      options.agent = agentMatch[1];
    }
    const prompt = rest.replace(/--agent\s+\S+/, "").trim();
    return { command: "spawn", args: [], options, rawPrompt: prompt };
  }

  // /agents [list|status|kill|result|wait] [args...]
  const agentsMatch = trimmed.match(/^\/agents(?:\s+(\S+))?(?:\s+(.*))?$/s);
  if (agentsMatch) {
    const subcommand = agentsMatch[1] || "list";
    const rest = (agentsMatch[2] || "").trim();

    const options: Record<string, string> = {};
    const optionMatch = rest.match(/--(\w+)\s+(\S+)/g);
    if (optionMatch) {
      for (const opt of optionMatch) {
        const [key, value] = opt.replace("--", "").split(/\s+/);
        options[key] = value;
      }
    }

    const argsStr = rest.replace(/--\w+\s+\S+/g, "").trim();
    const args = argsStr ? argsStr.split(/\s+/).filter(Boolean) : [];

    return { command: "agents", subcommand, args, options };
  }

  return null;
}

export interface StdinHandlerOptions {
  onNotification?: (notification: string) => void;
  onResult?: (result: CommandResult) => void;
}

export class BackgroundAgentStdinHandler {
  private manager: BackgroundAgentManager;
  private commands: BackgroundAgentCommands;
  private options: StdinHandlerOptions;

  constructor(manager: BackgroundAgentManager, options: StdinHandlerOptions = {}) {
    this.manager = manager;
    this.commands = new BackgroundAgentCommands(manager);
    this.options = options;

    this.manager.onEvent((event: BackgroundAgentEvent) => {
      if (event.type === "agent:complete" && this.options.onNotification) {
        const completeEvent = event as { type: "agent:complete"; agentId: string; result: string };
        this.options.onNotification(completeEvent.result);
      }
      if (event.type === "agent:error" && this.options.onNotification) {
        const errorEvent = event as { type: "agent:error"; agentId: string; error: string };
        this.options.onNotification(
          `<sin-agent-notification>\n<agent-id>${errorEvent.agentId}</agent-id>\n<status>error</status>\n<error>${errorEvent.error}</error>\n</sin-agent-notification>`
        );
      }
      if (event.type === "agent:timeout" && this.options.onNotification) {
        const timeoutEvent = event as { type: "agent:timeout"; agentId: string };
        this.options.onNotification(
          `<sin-agent-notification>\n<agent-id>${timeoutEvent.agentId}</agent-id>\n<status>timeout</status>\n<summary>Background agent timed out.</summary>\n</sin-agent-notification>`
        );
      }
    });
  }

  async handleInput(
    input: string,
    context: CommandContext
  ): Promise<{ consumed: boolean; result?: CommandResult }> {
    const parsed = parseBackgroundAgentCommand(input);
    if (!parsed) {
      return { consumed: false };
    }

    let result: CommandResult;

    if (parsed.command === "spawn") {
      result = await this.commands.spawn(
        parsed.rawPrompt ?? "",
        context,
        { agent: parsed.options.agent }
      );
    } else if (parsed.command === "agents") {
      switch (parsed.subcommand) {
        case "list":
          result = this.commands.list(context);
          break;
        case "status":
          result = this.commands.status(parsed.args[0], context);
          break;
        case "kill":
          result = await this.commands.kill(parsed.args[0]);
          break;
        case "result":
          result = await this.commands.result(parsed.args[0], context);
          break;
        case "wait": {
          const timeout = parsed.options.timeout ? parseInt(parsed.options.timeout, 10) : undefined;
          result = await this.commands.wait(parsed.args[0], timeout);
          break;
        }
        default:
          result = {
            success: false,
            output: "",
            error: `Unknown /agents subcommand: "${parsed.subcommand}".\n\nAvailable: list, status, kill, result, wait`,
          };
      }
    } else {
      return { consumed: false };
    }

    if (this.options.onResult) {
      this.options.onResult(result);
    }

    return { consumed: true, result };
  }

  getManager(): BackgroundAgentManager {
    return this.manager;
  }

  getCommands(): BackgroundAgentCommands {
    return this.commands;
  }

  dispose(): void {
    this.manager.dispose();
  }
}

export const BACKGROUND_AGENT_HELP = `
OpenSIN Background Agents:
  /spawn <prompt> [--agent <name>]  Spawn a background agent
  /agents list                      List all background agents
  /agents status [id]               Show status (summary or specific agent)
  /agents kill <id>                 Kill a running agent
  /agents result <id>               Retrieve agent result
  /agents wait <id> [--timeout ms]  Wait for agent to complete
`.trim();
