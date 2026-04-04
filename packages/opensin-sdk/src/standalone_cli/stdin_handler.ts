import { Readable } from "stream";
import {
  CliConfig,
  NdjsonMessage,
  StdinCommand,
  HistoryEntry,
} from "./types.js";
import { SessionManager } from "./session_manager.js";
import { HistoryManager } from "./history.js";

export class StdinHandler {
  private config: CliConfig;
  private sessionManager: SessionManager;
  private historyManager: HistoryManager;
  private isRunning = false;
  private messageCounter = 0;

  constructor(
    config: CliConfig,
    sessionManager: SessionManager,
    historyManager: HistoryManager
  ) {
    this.config = config;
    this.sessionManager = sessionManager;
    this.historyManager = historyManager;
  }

  async start(): Promise<void> {
    this.isRunning = true;

    process.stdout.write(this.formatSystemMessage("OpenSIN Standalone CLI"));
    process.stdout.write(this.formatSystemMessage(`Platform: ${this.config.platform}`));
    process.stdout.write(this.formatSystemMessage(`Auto-approve: ${this.config.autoApprove}`));
    process.stdout.write(this.formatSystemMessage("Type /help for commands, or just start chatting."));
    process.stdout.write("\n");

    if (this.config.sessionId) {
      const resumed = await this.sessionManager.resumeSession(this.config.sessionId);
      if (resumed) {
        process.stdout.write(
          this.formatSystemMessage(`Resumed session: ${resumed.sessionId} (${resumed.lastMessages.length} recent messages)`)
        );
      }
    } else {
      const session = await this.sessionManager.createSession();
      process.stdout.write(
        this.formatSystemMessage(`New session: ${session.sessionId}`)
      );
    }

    process.stdout.write("\n> ");

    this.setupStdinListener();
  }

  stop(): void {
    this.isRunning = false;
  }

  private setupStdinListener(): void {
    process.stdin.setEncoding("utf-8");
    process.stdin.resume();

    let buffer = "";

    process.stdin.on("data", (chunk: string) => {
      buffer += chunk;

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          this.processLine(line.trim());
        }
      }
    });

    process.stdin.on("end", () => {
      this.handleShutdown();
    });

    process.on("SIGINT", () => {
      this.handleShutdown();
    });

    process.on("SIGTERM", () => {
      this.handleShutdown();
    });
  }

  private async processLine(line: string): Promise<void> {
    if (line.startsWith("/")) {
      await this.handleCommand(line);
    } else {
      await this.handlePrompt(line);
    }

    if (this.isRunning) {
      process.stdout.write("\n> ");
    }
  }

  private async handleCommand(line: string): Promise<void> {
    const parts = line.split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case "/help":
        this.showHelp();
        break;

      case "/new":
        await this.handleNewSession();
        break;

      case "/resume":
        await this.handleResume(parts[1]);
        break;

      case "/sessions":
        await this.handleListSessions();
        break;

      case "/history":
        await this.handleHistory(parts[1]);
        break;

      case "/clear":
        await this.handleClear();
        break;

      case "/model":
        await this.handleModel(parts[1]);
        break;

      case "/approve":
        this.config.autoApprove = true;
        process.stdout.write(this.formatSystemMessage("Auto-approve enabled"));
        break;

      case "/no-approve":
        this.config.autoApprove = false;
        process.stdout.write(this.formatSystemMessage("Auto-approve disabled"));
        break;

      case "/exit":
      case "/quit":
        this.handleShutdown();
        break;

      default:
        process.stdout.write(this.formatSystemMessage(`Unknown command: ${command}`));
    }
  }

  private async handlePrompt(text: string): Promise<void> {
    const session = this.sessionManager.getActiveSession();
    if (!session) {
      process.stdout.write(this.formatSystemMessage("No active session. Use /new to create one."));
      return;
    }

    const userEntry: Omit<HistoryEntry, "timestamp" | "id"> = {
      sessionId: session.sessionId,
      role: "user",
      content: text,
    };

    await this.historyManager.add(userEntry);

    const ndjsonMessage: NdjsonMessage = {
      type: "prompt",
      id: `msg-${++this.messageCounter}`,
      payload: {
        sessionId: session.sessionId,
        content: text,
        autoApprove: this.config.autoApprove,
        model: this.config.model,
      },
      timestamp: new Date().toISOString(),
    };

    this.outputNdjson(ndjsonMessage);

    try {
      const response = await this.sendToServer(ndjsonMessage);
      const agentEntry: Omit<HistoryEntry, "timestamp" | "id"> = {
        sessionId: session.sessionId,
        role: "agent",
        content: response.payload.output as string || "",
      };

      await this.historyManager.add(agentEntry);

      process.stdout.write(`\n${response.payload.output || ""}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      process.stdout.write(this.formatSystemMessage(`Error: ${errorMsg}`));

      const errorNdjson: NdjsonMessage = {
        type: "error",
        payload: { error: errorMsg },
        timestamp: new Date().toISOString(),
      };
      this.outputNdjson(errorNdjson);
    }
  }

  private async sendToServer(message: NdjsonMessage): Promise<NdjsonMessage> {
    const response = await fetch(`${this.config.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
      },
      body: JSON.stringify(message.payload),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return {
      type: "response",
      payload: data,
      timestamp: new Date().toISOString(),
    };
  }

  private async handleNewSession(): Promise<void> {
    const current = this.sessionManager.getActiveSession();
    if (current) {
      await this.sessionManager.closeSession(current.sessionId);
    }

    const session = await this.sessionManager.createSession();
    process.stdout.write(this.formatSystemMessage(`New session: ${session.sessionId}`));
  }

  private async handleResume(sessionId?: string): Promise<void> {
    if (!sessionId) {
      const sessions = this.sessionManager.listSessions();
      if (sessions.length === 0) {
        process.stdout.write(this.formatSystemMessage("No sessions to resume"));
        return;
      }
      sessionId = sessions[0].sessionId;
    }

    const resumed = await this.sessionManager.resumeSession(sessionId);
    if (resumed) {
      process.stdout.write(
        this.formatSystemMessage(`Resumed session: ${resumed.sessionId}`)
      );
    } else {
      process.stdout.write(this.formatSystemMessage(`Session not found: ${sessionId}`));
    }
  }

  private async handleListSessions(): Promise<void> {
    const sessions = this.sessionManager.listSessions();
    if (sessions.length === 0) {
      process.stdout.write(this.formatSystemMessage("No sessions"));
      return;
    }

    process.stdout.write("\nSessions:\n");
    for (const s of sessions) {
      const active = s.sessionId === this.sessionManager.getActiveSession()?.sessionId ? " *" : "";
      process.stdout.write(
        `  ${s.sessionId} [${s.status}] ${s.messageCount} msgs${active}\n`
      );
    }
    process.stdout.write("\n");
  }

  private async handleHistory(sessionId?: string): Promise<void> {
    const targetSession = sessionId || this.sessionManager.getActiveSession()?.sessionId;
    if (!targetSession) {
      process.stdout.write(this.formatSystemMessage("No active session"));
      return;
    }

    const entries = await this.historyManager.get(targetSession, 10);
    if (entries.length === 0) {
      process.stdout.write(this.formatSystemMessage("No history"));
      return;
    }

    process.stdout.write("\nRecent history:\n");
    for (const entry of entries) {
      const preview = entry.content.substring(0, 100);
      process.stdout.write(`  [${entry.role}] ${preview}\n`);
    }
    process.stdout.write("\n");
  }

  private async handleClear(): Promise<void> {
    const session = this.sessionManager.getActiveSession();
    if (session) {
      await this.historyManager.clear(session.sessionId);
      process.stdout.write(this.formatSystemMessage("History cleared"));
    }
  }

  private async handleModel(model?: string): Promise<void> {
    if (!model) {
      process.stdout.write(this.formatSystemMessage(`Current model: ${this.config.model || "default"}`));
      return;
    }

    this.config.model = model;
    const session = this.sessionManager.getActiveSession();
    if (session) {
      session.model = model;
    }
    process.stdout.write(this.formatSystemMessage(`Model set to: ${model}`));
  }

  private showHelp(): void {
    const help = `
Commands:
  /help              Show this help
  /new               Create a new session
  /resume [id]       Resume a session
  /sessions          List all sessions
  /history [id]      Show recent history
  /clear             Clear history
  /model [name]      Set the model
  /approve           Enable auto-approve
  /no-approve        Disable auto-approve
  /exit, /quit       Exit the CLI

Just type text to send a message to the agent.
`;
    process.stdout.write(help);
  }

  private handleShutdown(): void {
    this.isRunning = false;
    const session = this.sessionManager.getActiveSession();
    if (session) {
      this.sessionManager.closeSession(session.sessionId);
    }
    process.stdout.write(this.formatSystemMessage("Goodbye!"));
    process.exit(0);
  }

  private outputNdjson(message: NdjsonMessage): void {
    process.stdout.write(JSON.stringify(message) + "\n");
  }

  private formatSystemMessage(text: string): string {
    return `\n[System] ${text}\n`;
  }
}
