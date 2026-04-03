import type { AgentCreateResult } from "../types.js";
export declare function handleAgentCreateCommand(name: string, options?: {
    description?: string;
    author?: string;
    version?: string;
    tools?: string[];
    permissions?: string[];
    outputDir?: string;
}): Promise<AgentCreateResult>;
export declare function parseAgentCommand(input: string): {
    action: string;
    args: string[];
};
//# sourceMappingURL=agent.d.ts.map