import { describe, it, expect, beforeEach } from 'vitest';
import { Orchestrator, createOrchestrator, runParallel, runSequential } from '../orchestrator.js';

describe('Orchestrator', () => {
  let orchestrator: Orchestrator;

  beforeEach(() => {
    orchestrator = new Orchestrator();
  });

  const mockExecutor = async (task: any) => ({
    taskId: task.id,
    agentId: 'test-agent',
    success: true,
    output: `Result for ${task.id}`,
    duration: 10,
  });

  it('should add and get tasks', () => {
    orchestrator.addTask({ id: 't1', description: 'Task 1', input: {}, priority: 1 });
    expect(orchestrator.getTasks()).toHaveLength(1);
  });

  it('should add multiple tasks', () => {
    orchestrator.addTasks([
      { id: 't1', description: 'Task 1', input: {}, priority: 1 },
      { id: 't2', description: 'Task 2', input: {}, priority: 2 },
    ]);
    expect(orchestrator.getTasks()).toHaveLength(2);
  });

  it('should run parallel tasks', async () => {
    orchestrator.addTasks([
      { id: 't1', description: 'Task 1', input: {}, priority: 1 },
      { id: 't2', description: 'Task 2', input: {}, priority: 2 },
    ]);

    const result = await orchestrator.runParallel(mockExecutor);
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('should run sequential tasks', async () => {
    orchestrator.addTasks([
      { id: 't1', description: 'Task 1', input: {}, priority: 1 },
      { id: 't2', description: 'Task 2', input: {}, priority: 2 },
    ]);

    const result = await orchestrator.runSequential(mockExecutor);
    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(2);
  });

  it('should handle task failures in parallel', async () => {
    orchestrator.addTask({ id: 'fail', description: 'Fail', input: {}, priority: 1 });

    const result = await orchestrator.runParallel(async () => ({
      taskId: 'fail',
      agentId: 'test',
      success: false,
      output: '',
      error: 'Task failed',
      duration: 0,
    }));

    expect(result.success).toBe(false);
  });

  it('should stop sequential on first failure', async () => {
    orchestrator.addTasks([
      { id: 't1', description: 'Task 1', input: {}, priority: 1 },
      { id: 't2', description: 'Task 2', input: {}, priority: 2 },
    ]);

    let callCount = 0;
    const result = await orchestrator.runSequential(async (task) => {
      callCount++;
      if (task.id === 't1') {
        return { taskId: 't1', agentId: 'test', success: false, output: '', duration: 0 };
      }
      return { taskId: task.id, agentId: 'test', success: true, output: 'ok', duration: 0 };
    });

    expect(result.success).toBe(false);
    expect(callCount).toBe(1);
  });

  it('should handle executor errors', async () => {
    orchestrator.addTask({ id: 'err', description: 'Error', input: {}, priority: 1 });

    const result = await orchestrator.runParallel(async () => {
      throw new Error('Executor error');
    });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].success).toBe(false);
    expect(result.results[0].error).toBe('Executor error');
  });

  it('should clear all state', () => {
    orchestrator.addTask({ id: 't1', description: 'Task 1', input: {}, priority: 1 });
    orchestrator.clear();
    expect(orchestrator.getTasks()).toHaveLength(0);
    expect(orchestrator.getResults()).toHaveLength(0);
    expect(orchestrator.getConflicts()).toHaveLength(0);
  });
});

describe('Orchestrator helpers', () => {
  it('createOrchestrator should return new instance', () => {
    const o = createOrchestrator();
    expect(o).toBeInstanceOf(Orchestrator);
  });

  it('runParallel should execute tasks', async () => {
    const result = await runParallel(
      [{ id: 't1', description: 'T1', input: {}, priority: 1 }],
      async (task) => ({ taskId: task.id, agentId: 'test', success: true, output: 'ok', duration: 0 })
    );
    expect(result.success).toBe(true);
  });

  it('runSequential should execute tasks', async () => {
    const result = await runSequential(
      [{ id: 't1', description: 'T1', input: {}, priority: 1 }],
      async (task) => ({ taskId: task.id, agentId: 'test', success: true, output: 'ok', duration: 0 })
    );
    expect(result.success).toBe(true);
  });
});
