export interface ToolInputSchema {
  type: "object";
  properties: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
  }>;
  required?: string[];
}

export interface ToolContext {
  agentId: string;
  sessionId?: string;
  cwd: string;
  permissions: PermissionCheckResult;
}

export interface ToolResult {
  success: boolean;
  content: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface ToolHandler {
  (input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: ToolInputSchema;
  handler: ToolHandler;
  tags?: string[];
}

export interface RegisteredTool extends ToolDefinition {
  id: string;
  createdAt: Date;
}

export interface PermissionScope {
  resource: string;
  action: string;
  pattern?: string;
}

export interface PermissionGrant {
  id: string;
  scope: PermissionScope;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  grant?: PermissionGrant;
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  permissions?: PermissionScope[];
  tools?: ToolDefinition[];
  maxConcurrentTasks?: number;
  timeout?: number;
}

export interface AgentLifecycleState {
  initialized: boolean;
  running: boolean;
  error: Error | null;
  startedAt: Date | null;
  stoppedAt: Date | null;
}

export interface AgentRunResult {
  success: boolean;
  output: string;
  error?: string;
  toolCalls: ToolCallRecord[];
  duration: number;
}

export interface ToolCallRecord {
  toolId: string;
  toolName: string;
  input: Record<string, unknown>;
  result: ToolResult;
  startedAt: Date;
  completedAt: Date;
}

export interface SubAgentTask {
  id: string;
  description: string;
  agentType?: string;
  input: Record<string, unknown>;
  priority: number;
  timeout?: number;
}

export interface SubAgentResult {
  taskId: string;
  agentId: string;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

export interface OrchestrationResult {
  success: boolean;
  results: SubAgentResult[];
  mergedOutput: string;
  conflicts: ConflictRecord[];
  duration: number;
}

export interface ConflictRecord {
  taskId: string;
  type: string;
  description: string;
  resolution: string;
}

export interface TemplateOptions {
  agentName: string;
  description?: string;
  author?: string;
  version?: string;
  tools?: string[];
  permissions?: string[];
  outputDir?: string;
}

export interface AgentCreateResult {
  success: boolean;
  message: string;
  files: string[];
  outputDir: string;
}
