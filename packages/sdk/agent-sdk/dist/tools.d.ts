import { ToolDefinition, RegisteredTool, ToolContext, ToolResult } from "./types.js";
export declare class ToolRegistry {
    private tools;
    private toolCounter;
    register(definition: ToolDefinition): RegisteredTool;
    unregister(name: string): boolean;
    get(name: string): RegisteredTool | undefined;
    list(): RegisteredTool[];
    listByTag(tag: string): RegisteredTool[];
    execute(name: string, input: Record<string, unknown>, context: ToolContext): Promise<ToolResult>;
    has(name: string): boolean;
    clear(): void;
    private validate;
    private validateInput;
}
//# sourceMappingURL=tools.d.ts.map