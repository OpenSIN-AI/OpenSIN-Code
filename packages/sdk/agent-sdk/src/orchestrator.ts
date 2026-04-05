import type {
  SubAgentTask,
  SubAgentResult,
  OrchestrationResult,
  ConflictRecord,
} from './types.js';

export class Orchestrator {
  private tasks: SubAgentTask[] = [];
  private results: SubAgentResult[] = [];
  private conflicts: ConflictRecord[] = [];

  addTask(task: SubAgentTask): void {
    this.tasks.push(task);
  }

  addTasks(tasks: SubAgentTask[]): void {
    this.tasks.push(...tasks);
  }

  getTasks(): SubAgentTask[] {
    return [...this.tasks];
  }

  getResults(): SubAgentResult[] {
    return [...this.results];
  }

  getConflicts(): ConflictRecord[] {
    return [...this.conflicts];
  }

  clear(): void {
    this.tasks = [];
    this.results = [];
    this.conflicts = [];
  }

  async runParallel(
    executor: (task: SubAgentTask) => Promise<SubAgentResult>
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.results = [];
    this.conflicts = [];

    const promises = this.tasks.map((task) =>
      executor(task).catch((error) => ({
        taskId: task.id,
        agentId: task.agentType || 'unknown',
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration: 0,
      }))
    );

    const settled = await Promise.allSettled(promises);

    for (const result of settled) {
      if (result.status === 'fulfilled') {
        this.results.push(result.value);
      }
    }

    this.detectConflicts();

    return {
      success: this.results.every((r) => r.success),
      results: this.results,
      mergedOutput: this.results.map((r) => r.output).join('\n---\n'),
      conflicts: this.conflicts,
      duration: Date.now() - startTime,
    };
  }

  async runSequential(
    executor: (task: SubAgentTask) => Promise<SubAgentResult>
  ): Promise<OrchestrationResult> {
    const startTime = Date.now();
    this.results = [];
    this.conflicts = [];

    for (const task of this.tasks) {
      try {
        const result = await executor(task);
        this.results.push(result);

        if (!result.success) {
          this.detectConflicts();
          return {
            success: false,
            results: this.results,
            mergedOutput: this.results.map((r) => r.output).join('\n---\n'),
            conflicts: this.conflicts,
            duration: Date.now() - startTime,
          };
        }
      } catch (error) {
        this.results.push({
          taskId: task.id,
          agentId: task.agentType || 'unknown',
          success: false,
          output: '',
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        });
        this.detectConflicts();
        return {
          success: false,
          results: this.results,
          mergedOutput: this.results.map((r) => r.output).join('\n---\n'),
          conflicts: this.conflicts,
          duration: Date.now() - startTime,
        };
      }
    }

    this.detectConflicts();

    return {
      success: true,
      results: this.results,
      mergedOutput: this.results.map((r) => r.output).join('\n---\n'),
      conflicts: this.conflicts,
      duration: Date.now() - startTime,
    };
  }

  private detectConflicts(): void {
    this.conflicts = [];

    const outputMap = new Map<string, SubAgentResult[]>();
    for (const result of this.results) {
      if (result.success && result.output) {
        const key = result.output.slice(0, 50);
        if (!outputMap.has(key)) {
          outputMap.set(key, []);
        }
        outputMap.get(key)!.push(result);
      }
    }

    for (const [key, results] of outputMap.entries()) {
      if (results.length > 1) {
        this.conflicts.push({
          taskId: results.map((r) => r.taskId).join(', '),
          type: 'duplicate_output',
          description: `Multiple agents produced similar output: "${key}..."`,
          resolution: 'Keep first result, discard duplicates',
        });
      }
    }
  }
}

export function createOrchestrator(): Orchestrator {
  return new Orchestrator();
}

export async function runParallel(
  tasks: SubAgentTask[],
  executor: (task: SubAgentTask) => Promise<SubAgentResult>
): Promise<OrchestrationResult> {
  const orchestrator = new Orchestrator();
  orchestrator.addTasks(tasks);
  return orchestrator.runParallel(executor);
}

export async function runSequential(
  tasks: SubAgentTask[],
  executor: (task: SubAgentTask) => Promise<SubAgentResult>
): Promise<OrchestrationResult> {
  const orchestrator = new Orchestrator();
  orchestrator.addTasks(tasks);
  return orchestrator.runSequential(executor);
}
