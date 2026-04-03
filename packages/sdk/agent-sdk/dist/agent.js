import { ToolRegistry } from "./tools.js";
import { PermissionEngine } from "./permissions.js";
export class Agent {
    config;
    toolRegistry;
    permissionEngine;
    #state = {
        initialized: false,
        running: false,
        error: null,
        startedAt: null,
        stoppedAt: null,
    };
    #toolCallHistory = [];
    #errorHandlers = [];
    constructor(config) {
        this.config = config;
        this.toolRegistry = new ToolRegistry();
        this.permissionEngine = new PermissionEngine(config.permissions ?? []);
        if (config.tools) {
            for (const tool of config.tools) {
                this.toolRegistry.register(tool);
            }
        }
    }
    get state() {
        return { ...this.#state };
    }
    get toolCallHistory() {
        return [...this.#toolCallHistory];
    }
    async initialize() {
        if (this.#state.initialized) {
            return;
        }
        try {
            await this.onInit();
            this.#state.initialized = true;
        }
        catch (error) {
            this.#state.error = error instanceof Error ? error : new Error(String(error));
            this.#handleError(this.#state.error);
            throw this.#state.error;
        }
    }
    async run(input) {
        if (!this.#state.initialized) {
            await this.initialize();
        }
        if (this.#state.running) {
            throw new Error("Agent is already running");
        }
        this.#state.running = true;
        this.#state.startedAt = new Date();
        this.#state.error = null;
        const startTime = Date.now();
        try {
            const output = await this.onRun(input);
            const duration = Date.now() - startTime;
            return {
                success: true,
                output,
                toolCalls: [...this.#toolCallHistory],
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const err = error instanceof Error ? error : new Error(String(error));
            this.#state.error = err;
            this.#handleError(err);
            return {
                success: false,
                output: "",
                error: err.message,
                toolCalls: [...this.#toolCallHistory],
                duration,
            };
        }
        finally {
            this.#state.running = false;
            this.#state.stoppedAt = new Date();
        }
    }
    async cleanup() {
        try {
            await this.onCleanup();
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.#handleError(err);
            throw err;
        }
        finally {
            this.#state.initialized = false;
            this.#state.running = false;
            this.#state.stoppedAt = new Date();
            this.#toolCallHistory = [];
        }
    }
    async executeTool(toolName, input) {
        const tool = this.toolRegistry.get(toolName);
        if (!tool) {
            return {
                success: false,
                content: "",
                error: `Tool "${toolName}" not found`,
            };
        }
        const permissions = this.#buildPermissionContext(toolName);
        const context = {
            agentId: this.config.id,
            cwd: process.cwd(),
            permissions,
        };
        const startedAt = new Date();
        const result = await this.toolRegistry.execute(toolName, input, context);
        const completedAt = new Date();
        const record = {
            toolId: tool.id,
            toolName,
            input,
            result,
            startedAt,
            completedAt,
        };
        this.#toolCallHistory.push(record);
        return result;
    }
    registerTool(definition) {
        this.toolRegistry.register(definition);
    }
    onError(handler) {
        this.#errorHandlers.push(handler);
    }
    #buildPermissionContext(toolName) {
        return {
            allowed: true,
            reason: `Tool "${toolName}" execution permitted`,
        };
    }
    #handleError(error) {
        for (const handler of this.#errorHandlers) {
            try {
                handler(error, this);
            }
            catch {
                // Error handlers should not throw
            }
        }
    }
}
//# sourceMappingURL=agent.js.map