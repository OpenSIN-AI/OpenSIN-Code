/**
 * CLI Agent Core — Terminal-based AI coding like Augment Code/Kilo Code
 */

import type {
  CLIAgentConfig,
  CLIAgentSession,
  CLIMessage,
  CLIEvent,
  CLITool,
  ToolCallRecord,
  ToolResult,
  CLIAgentState,
  CLICommand,
} from "./types.js";
import { SessionManager } from "./session.js";
import { ToolRegistry, createBuiltinTools } from "./tools.js";
import { createDefaultConfig, validateConfig } from "./config.js";
import { createOrchestrator, type AgentOrchestrator } from "../orchestrator/index.js";

export class CLIAgent {
  private config: CLIAgentConfig;
  private sessionManager: SessionManager;
  private toolRegistry: ToolRegistry;
  private orchestrator: AgentOrchestrator;
  private eventListeners: Set<(event: CLIEvent) => void> = new Set();
  private state: CLIAgentState;
  private approvalQueue: ToolCallRecord[] = [];
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(config: Partial<CLIAgentConfig> = {}) {
    this.config = createDefaultConfig(config);
    this.sessionManager = new SessionManager();
    this.toolRegistry = new ToolRegistry();
    this.orchestrator = createOrchestrator();
    this.state = {
      session: this.sessionManager.createSession(this.config),
      config: this.config,
      isStreaming: false,
    };

    const tools = createBuiltinTools(this.config.workspacePath);
    tools.forEach((t) => this.toolRegistry.register(t));
  }

  onEvent(listener: (event: CLIEvent) => void): void {
    this.eventListeners.add(listener);
  }

  offEvent(listener: (event: CLIEvent) => void): void {
    this.eventListeners.delete(listener);
  }

  registerTool(tool: CLITool): void {
    this.toolRegistry.register(tool);
  }

  getState(): CLIAgentState {
    return { ...this.state };
  }

  async startInteractive(): Promise<void> {
    this.config.interactive = true;
    this.config.batchMode = false;
    this.isRunning = true;
    this.abortController = new AbortController();

    this.emit({ type: "session:update", session: this.state.session });

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.printWelcome();

    while (this.isRunning && !this.abortController.signal.aborted) {
      const input = await this.promptInput(rl);
      if (!input) continue;

      if (input === "/quit" || input === "/exit") {
        break;
      }

      if (input === "/help") {
        this.printHelp();
        continue;
      }

      if (input === "/status") {
        this.printStatus();
        continue;
      }

      if (input === "/clear") {
        this.sessionManager.clearHistory(this.config.sessionId);
        console.log("\nHistory cleared.\n");
        continue;
      }

      await this.processUserInput(input);
    }

    rl.close();
    this.isRunning = false;
    this.sessionManager.setStatus(this.config.sessionId, "completed");
    this.emit({ type: "complete" });
  }

  async runBatch(commands: CLICommand[]): Promise<CLIAgentSession> {
    this.config.batchMode = true;
    this.config.interactive = false;
    this.isRunning = true;
    this.abortController = new AbortController();

    for (const cmd of commands) {
      if (this.abortController.signal.aborted) break;
      await this.processCommand(cmd);
    }

    this.isRunning = false;
    this.sessionManager.setStatus(this.config.sessionId, "completed");
    return this.state.session;
  }

  async processUserInput(input: string): Promise<void> {
    const message: CLIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: Date.now(),
    };

    this.sessionManager.addMessage(this.config.sessionId, message);
    this.emit({ type: "message:start", messageId: message.id });

    try {
      await this.generateAssistantResponse(input);
    } catch (error) {
      this.emit({ type: "error", error: (error as Error).message });
    }
  }

  async processCommand(cmd: CLICommand): Promise<void> {
    const message: CLIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: cmd.input,
      timestamp: Date.now(),
      metadata: { type: cmd.type, options: cmd.options },
    };

    this.sessionManager.addMessage(this.config.sessionId, message);
    this.emit({ type: "message:start", messageId: message.id });

    try {
      await this.generateAssistantResponse(cmd.input, cmd.options?.files);
    } catch (error) {
      this.emit({ type: "error", error: (error as Error).message });
    }
  }

  async approveTool(toolCallId: string): Promise<void> {
    const idx = this.approvalQueue.findIndex((t) => t.id === toolCallId);
    if (idx === -1) return;

    const toolCall = this.approvalQueue.splice(idx, 1)[0];
    toolCall.approved = true;

    const result = await this.executeTool(toolCall);
    this.sessionManager.addToolCall(this.config.sessionId, toolCall);

    const toolMessage: CLIMessage = {
      id: `tool-${Date.now()}`,
      role: "tool",
      content: result.output,
      timestamp: Date.now(),
      toolCallId: toolCall.id,
    };
    this.sessionManager.addMessage(this.config.sessionId, toolMessage);

    this.emit({ type: "tool:result", toolCall });
  }

  async rejectTool(toolCallId: string, reason?: string): Promise<void> {
    const idx = this.approvalQueue.findIndex((t) => t.id === toolCallId);
    if (idx === -1) return;

    const toolCall = this.approvalQueue.splice(idx, 1)[0];
    toolCall.approved = false;
    toolCall.result = {
      success: false,
      output: "",
      error: reason ?? "Tool call rejected by user",
    };

    this.sessionManager.addToolCall(this.config.sessionId, toolCall);
    this.emit({ type: "tool:error", toolCall, error: toolCall.result.error });
  }

  abort(): void {
    this.abortController?.abort();
    this.isRunning = false;
    this.sessionManager.setStatus(this.config.sessionId, "completed");
    this.emit({ type: "complete" });
  }

  getSession(): CLIAgentSession {
    return this.state.session;
  }

  getAvailableTools(): CLITool[] {
    return this.toolRegistry.list();
  }

  getOrchestrator(): AgentOrchestrator {
    return this.orchestrator;
  }

  private async generateAssistantResponse(userInput: string, files?: string[]): Promise<void> {
    this.state.isStreaming = true;

    const assistantMessage: CLIMessage = {
      id: `msg-${Date.now()}-assistant`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    this.emit({ type: "message:start", messageId: assistantMessage.id });

    const context = this.buildContextString(files);
    const prompt = this.buildPrompt(context, userInput);

    const routing = this.orchestrator.routeModel(prompt, {
      requiresToolUse: true,
      preferSpeed: this.config.batchMode,
      requiresLongContext: Boolean(files && files.length > 3),
    });

    this.config.model = routing.selectedModel.id;
    this.config.provider = routing.selectedModel.provider;
    this.state.config = this.config;

    const response = await this.callLLM(prompt);
    assistantMessage.content = response;

    this.sessionManager.addMessage(this.config.sessionId, assistantMessage);
    this.emit({ type: "message:end", messageId: assistantMessage.id });

    await this.handleToolCalls(response);

    this.state.isStreaming = false;
  }

  private async handleToolCalls(response: string): Promise<void> {
    const toolCalls = this.parseToolCalls(response);

    for (const toolCall of toolCalls) {
      const tool = this.toolRegistry.get(toolCall.toolName);
      if (!tool) continue;

      const policy = await this.orchestrator.evaluateAction(toolCall.toolName, toolCall.parameters);

      const needsApproval = tool.requiresApproval && !this.config.autoApproveTools.includes(toolCall.toolName);
      const blockedByPolicy = !policy.approved;

      if ((needsApproval || blockedByPolicy) && this.config.interactive) {
        this.approvalQueue.push(toolCall);
        this.emit({ type: "approval:required", toolCall });
        continue;
      }

      if (blockedByPolicy) {
        toolCall.approved = false;
        toolCall.result = {
          success: false,
          output: "",
          error: `Tool call blocked by policy (${policy.riskLevel})`,
          exitCode: 1,
        };
        this.sessionManager.addToolCall(this.config.sessionId, toolCall);
        this.emit({ type: "tool:error", toolCall, error: toolCall.result.error ?? "Tool call blocked by policy" });
        continue;
      }

      toolCall.approved = true;
      this.emit({ type: "tool:start", toolCall });

      const result = await this.executeTool(toolCall);
      toolCall.result = result;
      toolCall.duration = Date.now() - toolCall.timestamp;

      this.sessionManager.addToolCall(this.config.sessionId, toolCall);
      this.emit({ type: "tool:result", toolCall });

      const toolMessage: CLIMessage = {
        id: `tool-${Date.now()}`,
        role: "tool",
        content: result.output,
        timestamp: Date.now(),
        toolCallId: toolCall.id,
      };
      this.sessionManager.addMessage(this.config.sessionId, toolMessage);
    }
  }

  private async executeTool(toolCall: ToolCallRecord): Promise<ToolResult> {
    const startTime = Date.now();
    try {
      const result = await this.toolRegistry.execute(toolCall.toolName, toolCall.parameters);
      toolCall.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      toolCall.duration = Date.now() - startTime;
      return {
        success: false,
        output: "",
        error: (error as Error).message,
        exitCode: 1,
      };
    }
  }

  private parseToolCalls(response: string): ToolCallRecord[] {
    const toolCalls: ToolCallRecord[] = [];
    const pattern = /<tool_call name="([^"]+)"[^>]*>([\s\S]*?)<\/tool_call>/g;
    let match;

    while ((match = pattern.exec(response)) !== null) {
      const name = match[1];
      let params: Record<string, unknown> = {};
      try {
        params = JSON.parse(match[2].trim());
      } catch {
        params = { _raw: match[2].trim() };
      }

      toolCalls.push({
        id: `tc-${Date.now()}-${toolCalls.length}`,
        toolName: name,
        parameters: params,
        result: { success: false, output: "", error: "Not executed" },
        timestamp: Date.now(),
        duration: 0,
        approved: false,
      });
    }

    return toolCalls;
  }

  private async callLLM(prompt: string): Promise<string> {
    if (this.config.verbose) {
      console.log(`[CLIAgent] Calling LLM: ${this.config.model}`);
    }

    return `[OpenSIN CLI Agent] I received your request. In a full implementation, this would call the ${this.config.model} model via ${this.config.provider} with the prompt.\n\nFor now, I can help you with:\n- Reading and editing files\n- Running commands\n- Searching code\n- Git operations\n\nTry asking me to read a file or run a command!`;
  }

  private buildContextString(files?: string[]): string {
    const session = this.sessionManager.getActiveSession();
    if (!session) return "";

    let context = `Workspace: ${session.context.workspacePath}\n`;
    if (session.context.gitBranch) {
      context += `Branch: ${session.context.gitBranch}\n`;
    }

    if (files && files.length > 0) {
      context += `\nRelevant files:\n${files.map((f) => `- ${f}`).join("\n")}\n`;
    }

    const recent = this.sessionManager.getRecentMessages(this.config.sessionId, 10);
    if (recent.length > 0) {
      context += "\nRecent conversation:\n";
      for (const msg of recent) {
        const preview = msg.content.slice(0, 200);
        context += `[${msg.role}]: ${preview}\n`;
      }
    }

    return context;
  }

  private buildPrompt(context: string, userInput: string): string {
    const systemPrompt = this.config.systemPrompt ?? `You are OpenSIN CLI Agent, an AI coding assistant running in the terminal. You can read files, edit code, run commands, and help with software development tasks. Use tool_call tags to invoke tools.`;

    return `${systemPrompt}\n\n${context}\n\nUser: ${userInput}`;
  }

  private emit(event: CLIEvent): void {
    this.eventListeners.forEach((l) => l(event));
  }

  private printWelcome(): void {
    console.log("\n" + "=".repeat(60));
    console.log("  OpenSIN CLI Agent");
    console.log("  Terminal-based AI coding assistant");
    console.log("=".repeat(60));
    console.log(`  Model: ${this.config.model}`);
    console.log(`  Workspace: ${this.config.workspacePath}`);
    console.log(`  Session: ${this.config.sessionId}`);
    console.log("  Type /help for commands, /quit to exit");
    console.log("=".repeat(60) + "\n");
  }

  private printHelp(): void {
    console.log("\nAvailable commands:");
    console.log("  /help     - Show this help");
    console.log("  /status   - Show session status");
    console.log("  /clear    - Clear conversation history");
    console.log("  /quit     - Exit the agent");
    console.log("\nJust type your request to interact with the agent.\n");
  }

  private printStatus(): void {
    const session = this.sessionManager.getActiveSession();
    if (!session) {
      console.log("No active session.");
      return;
    }

    console.log("\nSession Status:");
    console.log(`  ID: ${session.id}`);
    console.log(`  Status: ${session.status}`);
    console.log(`  Messages: ${session.messages.length}`);
    console.log(`  Tool calls: ${session.toolCalls.length}`);
    console.log(`  Tokens: ${session.tokenUsage.totalTokens}`);
    console.log(`  Est. cost: $${session.tokenUsage.estimatedCost.toFixed(4)}`);
    console.log("");
  }

  private promptInput(rl: any): Promise<string> {
    return new Promise((resolve) => {
      rl.question("\n> ", (input: string) => {
        resolve(input.trim());
      });
    });
  }
}
