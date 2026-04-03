import { SubAgentTask, OrchestrationResult } from "./types.js";
export interface AgentFactory {
    createAgent(task: SubAgentTask): Promise<AgentLike>;
}
export interface AgentLike {
    config: {
        id: string;
        name: string;
    };
    run(input: string): Promise<{
        success: boolean;
        output: string;
        error?: string;
    }>;
    cleanup(): Promise<void>;
}
type ConflictStrategy = "first-wins" | "last-wins" | "merge" | "manual";
export declare class Orchestrator {
    #private;
    constructor(factory: AgentFactory, options?: {
        maxConcurrent?: number;
        conflictStrategy?: ConflictStrategy;
    });
    executeTasks(tasks: SubAgentTask[]): Promise<OrchestrationResult>;
    spawnAgent(task: SubAgentTask): Promise<AgentLike>;
    terminateAgent(taskId: string): Promise<void>;
    get activeAgentCount(): number;
    cleanup(): Promise<void>;
}
export {};
//# sourceMappingURL=orchestrator.d.ts.map