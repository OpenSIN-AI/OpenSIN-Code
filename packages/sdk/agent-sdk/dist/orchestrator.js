export class Orchestrator {
    #factory;
    #activeAgents = new Map();
    #maxConcurrent;
    #conflictStrategy;
    constructor(factory, options) {
        this.#factory = factory;
        this.#maxConcurrent = options?.maxConcurrent ?? 5;
        this.#conflictStrategy = options?.conflictStrategy ?? "merge";
    }
    async executeTasks(tasks) {
        const startTime = Date.now();
        const results = [];
        const conflicts = [];
        const batches = this.#createBatches(tasks);
        for (const batch of batches) {
            const batchResults = await Promise.all(batch.map((task) => this.#executeTask(task)));
            for (const result of batchResults) {
                results.push(result);
            }
        }
        const resolvedConflicts = this.#resolveConflicts(results);
        conflicts.push(...resolvedConflicts);
        const mergedOutput = this.#mergeResults(results, conflicts);
        return {
            success: results.every((r) => r.success),
            results,
            mergedOutput,
            conflicts,
            duration: Date.now() - startTime,
        };
    }
    async spawnAgent(task) {
        const agent = await this.#factory.createAgent(task);
        if (this.#activeAgents.size >= this.#maxConcurrent) {
            throw new Error(`Maximum concurrent agents (${this.#maxConcurrent}) reached`);
        }
        this.#activeAgents.set(task.id, agent);
        return agent;
    }
    async terminateAgent(taskId) {
        const agent = this.#activeAgents.get(taskId);
        if (agent) {
            await agent.cleanup();
            this.#activeAgents.delete(taskId);
        }
    }
    get activeAgentCount() {
        return this.#activeAgents.size;
    }
    async cleanup() {
        const cleanupPromises = Array.from(this.#activeAgents.values()).map((agent) => agent.cleanup());
        await Promise.allSettled(cleanupPromises);
        this.#activeAgents.clear();
    }
    async #executeTask(task) {
        const agent = await this.spawnAgent(task);
        const startTime = Date.now();
        try {
            const result = await agent.run(JSON.stringify(task.input));
            const duration = Date.now() - startTime;
            return {
                taskId: task.id,
                agentId: agent.config.id,
                success: result.success,
                output: result.output,
                error: result.error,
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            return {
                taskId: task.id,
                agentId: agent.config.id,
                success: false,
                output: "",
                error: error instanceof Error ? error.message : String(error),
                duration,
            };
        }
        finally {
            await this.terminateAgent(task.id);
        }
    }
    #createBatches(tasks) {
        const sorted = [...tasks].sort((a, b) => b.priority - a.priority);
        const batches = [];
        for (let i = 0; i < sorted.length; i += this.#maxConcurrent) {
            batches.push(sorted.slice(i, i + this.#maxConcurrent));
        }
        return batches;
    }
    #resolveConflicts(results) {
        const conflicts = [];
        const outputGroups = new Map();
        for (const result of results) {
            const key = result.output.substring(0, 50);
            const group = outputGroups.get(key) ?? [];
            group.push(result);
            outputGroups.set(key, group);
        }
        for (const [, group] of outputGroups) {
            if (group.length > 1) {
                const conflict = {
                    taskId: group.map((r) => r.taskId).join(", "),
                    type: "output-overlap",
                    description: `${group.length} agents produced similar output`,
                    resolution: this.#conflictStrategy,
                };
                conflicts.push(conflict);
            }
        }
        return conflicts;
    }
    #mergeResults(results, conflicts) {
        const conflictTaskIds = new Set();
        for (const conflict of conflicts) {
            for (const id of conflict.taskId.split(", ")) {
                conflictTaskIds.add(id);
            }
        }
        const successfulResults = results.filter((r) => r.success && !conflictTaskIds.has(r.taskId));
        switch (this.#conflictStrategy) {
            case "first-wins": {
                const first = results.find((r) => r.success);
                return first?.output ?? "";
            }
            case "last-wins": {
                const reversed = [...results].reverse();
                const last = reversed.find((r) => r.success);
                return last?.output ?? "";
            }
            case "merge":
                return successfulResults
                    .map((r) => `## Task: ${r.taskId}\n\n${r.output}`)
                    .join("\n\n---\n\n");
            case "manual":
                return results
                    .filter((r) => r.success)
                    .map((r) => `## Task: ${r.taskId}\n\n${r.output}`)
                    .join("\n\n---\n\n");
            default:
                return successfulResults.map((r) => r.output).join("\n");
        }
    }
}
//# sourceMappingURL=orchestrator.js.map