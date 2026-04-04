/**
 * CLI Agent Types — Terminal-based AI coding like Augment Code/Kilo Code
 */

export interface CLIAgentConfig {
  sessionId: string;
  model: string;
  provider: string;
  apiKey?: string;
  workspacePath: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  interactive: boolean;
  batchMode: boolean;
  contextWindowSize: number;
  toolTimeoutMs: number;
  autoApproveTools: string[];
  verbose: boolean;
}

export interface CLIAgentSession {
  id: string;
  createdAt: number;
  lastActivity: number;
  messages: CLIMessage[];
  context: CLIContext;
  status: "active" | "paused" | "completed" | "error";
  toolCalls: ToolCallRecord[];
  tokenUsage: TokenUsage;
}

export interface CLIMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: number;
  toolCallId?: string;
  metadata?: Record<string, unknown>;
}

export interface CLIContext {
  workspacePath: string;
  activeFiles: string[];
  gitBranch?: string;
  gitStatus?: string;
  terminalOutput?: string;
  environment: Record<string, string>;
  customVariables: Record<string, string>;
}

export interface CLITool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
  requiresApproval: boolean;
}

export interface ToolCallRecord {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  result: ToolResult;
  timestamp: number;
  duration: number;
  approved: boolean;
}

export interface ToolResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  metadata?: Record<string, unknown>;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface CLICommand {
  type: "chat" | "edit" | "run" | "ask" | "review" | "commit";
  input: string;
  options?: CLICommandOptions;
}

export interface CLICommandOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  files?: string[];
  autoApprove?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
}

export interface CLIAgentState {
  session: CLIAgentSession;
  config: CLIAgentConfig;
  isStreaming: boolean;
  currentToolCall?: ToolCallRecord;
  pendingApproval?: ToolCallRecord;
  error?: string;
}

export type CLIEvent =
  | { type: "message:start"; messageId: string }
  | { type: "message:delta"; messageId: string; delta: string }
  | { type: "message:end"; messageId: string }
  | { type: "tool:start"; toolCall: ToolCallRecord }
  | { type: "tool:result"; toolCall: ToolCallRecord }
  | { type: "tool:error"; toolCall: ToolCallRecord; error: string }
  | { type: "approval:required"; toolCall: ToolCallRecord }
  | { type: "session:update"; session: CLIAgentSession }
  | { type: "error"; error: string }
  | { type: "complete" };
