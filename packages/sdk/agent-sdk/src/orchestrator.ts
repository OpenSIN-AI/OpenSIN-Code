import {
  SubAgentTask,
  SubAgentResult,
  OrchestrationResult,
  ConflictRecord,
} from "./types.js";

export interface AgentFactory {
  createAgent(task: SubAgentTask): Promise<AgentLike>;
}

export interface AgentLike {
  config: { id: string; name: string };
  run(input: string): Promise<{ success: boolean; output: string; error?: string }>;
  cleanup(): Promise<void>;
}

type ConflictStrategy = "first-wins" | "last-wins" | "merge" | "manual";

export class Orchestrator {
  #factory: AgentFactory;
  #activeAgents: Map<string, AgentLike> = new Map();
  #maxConcurrent: number;
  #conflictStrategy: ConflictStrategy;

  constructor(
    factory: AgentFactory,
    options?: { maxConcurrent?: number; conflictStrategy?: ConflictStrategy },
  ) {
    this.#factory = factory;
    this.#maxConcurrent = options?.maxConcurrent ?? 5;
    this.#conflictStrategy = options?.conflictStrategy ?? "merge";
  }

  async executeTasks(tasks: SubAgentTask[]): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const results: SubAgentResult[] = [];
    const conflicts: ConflictRecord[] = [];

    const batches = this.#createBatches(tasks);

    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map((task) => this.#executeTask(task)),
      );

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

  async spawnAgent(task: SubAgentTask): Promise<AgentLike> {
    const agent = await this.#factory.createAgent(task);

    if (this.#activeAgents.size >= this.#maxConcurrent) {
      throw new Error(
        `Maximum concurrent agents (${this.#maxConcurrent}) reached`,
      );
    }

    this.#activeAgents.set(task.id, agent);
    return agent;
  }

  async terminateAgent(taskId: string): Promise<void> {
    const agent = this.#activeAgents.get(taskId);
    if (agent) {
      await agent.cleanup();
      this.#activeAgents.delete(taskId);
    }
  }

  get activeAgentCount(): number {
    return this.#activeAgents.size;
  }

  async cleanup(): Promise<void> {
    const cleanupPromises = Array.from(this.#activeAgents.values()).map(
      (agent) => agent.cleanup(),
    );
    await Promise.allSettled(cleanupPromises);
    this.#activeAgents.clear();
  }

  async #executeTask(task: SubAgentTask): Promise<SubAgentResult> {
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
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        taskId: task.id,
        agentId: agent.config.id,
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
    } finally {
      await this.terminateAgent(task.id);
    }
  }

  #createBatches(tasks: SubAgentTask[]): SubAgentTask[][] {
    const sorted = [...tasks].sort((a, b) => b.priority - a.priority);
    const batches: SubAgentTask[][] = [];

    for (let i = 0; i < sorted.length; i += this.#maxConcurrent) {
      batches.push(sorted.slice(i, i + this.#maxConcurrent));
    }

    return batches;
  }

  #resolveConflicts(results: SubAgentResult[]): ConflictRecord[] {
    const conflicts: ConflictRecord[] = [];
    const outputGroups = new Map<string, SubAgentResult[]>();

    for (const result of results) {
      const key = result.output.substring(0, 50);
      const group = outputGroups.get(key) ?? [];
      group.push(result);
      outputGroups.set(key, group);
    }

    for (const [, group] of outputGroups) {
      if (group.length > 1) {
        const conflict: ConflictRecord = {
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

  #mergeResults(
    results: SubAgentResult[],
    conflicts: ConflictRecord[],
  ): string {
    const conflictTaskIds = new Set<string>();
    for (const conflict of conflicts) {
      for (const id of conflict.taskId.split(", ")) {
        conflictTaskIds.add(id);
      }
    }

    const successfulResults = results.filter(
      (r) => r.success && !conflictTaskIds.has(r.taskId),
    );

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
