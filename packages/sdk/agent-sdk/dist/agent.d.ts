import { AgentConfig, AgentLifecycleState, AgentRunResult, ToolCallRecord, ToolDefinition, ToolResult } from "./types.js";
import { ToolRegistry } from "./tools.js";
import { PermissionEngine } from "./permissions.js";
export declare abstract class Agent {
    #private;
    readonly config: AgentConfig;
    readonly toolRegistry: ToolRegistry;
    readonly permissionEngine: PermissionEngine;
    constructor(config: AgentConfig);
    get state(): Readonly<AgentLifecycleState>;
    get toolCallHistory(): ReadonlyArray<ToolCallRecord>;
    initialize(): Promise<void>;
    run(input: string): Promise<AgentRunResult>;
    cleanup(): Promise<void>;
    executeTool(toolName: string, input: Record<string, unknown>): Promise<ToolResult>;
    registerTool(definition: ToolDefinition): void;
    onError(handler: (error: Error, agent: Agent) => void): void;
    protected abstract onInit(): Promise<void>;
    protected abstract onRun(input: string): Promise<string>;
    protected abstract onCleanup(): Promise<void>;
}
//# sourceMappingURL=agent.d.ts.map