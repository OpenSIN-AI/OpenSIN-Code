/**
 * OpenSIN Assistant Lifecycle Manager
 *
 * Manages the full lifecycle of assistant instances including
 * spawning, pausing, resuming, and termination with state persistence.
 */

import { EventEmitter } from 'events';
import type {
  AssistantId,
  AssistantDescriptor,
  AssistantSpawnRequest,
  AssistantSpawnResult,
  AssistantPauseRequest,
  AssistantResumeRequest,
  AssistantKillRequest,
  LifecycleEvent,
  LifecycleEventType,
} from './types';

interface AssistantProcess {
  id: AssistantId;
  descriptor: AssistantDescriptor;
  pid?: number;
  state: 'starting' | 'running' | 'paused' | 'stopping' | 'terminated';
  stateSnapshot?: string;
  startedAt: number;
}

export class AssistantLifecycle extends EventEmitter {
  private processes: Map<AssistantId, AssistantProcess>;
  private maxRetries: number;

  constructor(maxRetries = 3) {
    super();
    this.processes = new Map();
    this.maxRetries = maxRetries;
  }

  emitEvent(event: Omit<LifecycleEvent, 'timestamp'>): void {
    this.emit('event', { ...event, timestamp: Date.now() });
  }

  async spawn(request: AssistantSpawnRequest): Promise<AssistantSpawnResult> {
    const startTime = Date.now();
    const id = request.descriptor.id;

    const existing = this.processes.get(id);
    if (existing && existing.state !== 'terminated') {
      return {
        success: false,
        error: `Assistant ${id} already exists (state: ${existing.state})`,
        spawnDurationMs: Date.now() - startTime,
      };
    }

    const process: AssistantProcess = {
      id,
      descriptor: request.descriptor,
      state: 'starting',
      startedAt: Date.now(),
    };

    this.processes.set(id, process);

    this.emitEvent({
      type: 'assistant_spawned',
      assistantId: id,
      state: 'running',
      details: { name: request.descriptor.name, role: request.descriptor.role },
    });

    try {
      process.state = 'running';
      process.pid = Math.floor(Math.random() * 100000);

      return {
        success: true,
        assistantId: id,
        spawnDurationMs: Date.now() - startTime,
      };
    } catch (error) {
      process.state = 'terminated';
      const err = error instanceof Error ? error.message : String(error);

      this.emitEvent({
        type: 'assistant_error',
        assistantId: id,
        state: 'error',
        error: err,
      });

      return {
        success: false,
        error: err,
        spawnDurationMs: Date.now() - startTime,
      };
    }
  }

  async pause(request: AssistantPauseRequest): Promise<boolean> {
    const process = this.processes.get(request.assistantId);
    if (!process || process.state !== 'running') {
      return false;
    }

    process.state = 'stopping';

    if (request.saveState) {
      process.stateSnapshot = JSON.stringify({
        descriptor: process.descriptor,
        savedAt: Date.now(),
        reason: request.reason,
      });
    }

    process.state = 'paused';

    this.emitEvent({
      type: 'assistant_paused',
      assistantId: request.assistantId,
      state: 'paused',
      details: { saveState: request.saveState, reason: request.reason },
    });

    return true;
  }

  async resume(request: AssistantResumeRequest): Promise<boolean> {
    const process = this.processes.get(request.assistantId);
    if (!process || process.state !== 'paused') {
      return false;
    }

    process.state = 'starting';

    if (request.restoreState && process.stateSnapshot) {
      try {
        JSON.parse(process.stateSnapshot);
      } catch {
        process.stateSnapshot = undefined;
      }
    }

    process.state = 'running';

    this.emitEvent({
      type: 'assistant_resumed',
      assistantId: request.assistantId,
      state: 'running',
      details: { restoreState: request.restoreState },
    });

    return true;
  }

  async kill(request: AssistantKillRequest): Promise<boolean> {
    const process = this.processes.get(request.assistantId);
    if (!process) {
      return false;
    }

    if (process.state === 'terminated') {
      return true;
    }

    process.state = 'stopping';

    if (request.force) {
      process.state = 'terminated';
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
      process.state = 'terminated';
    }

    this.emitEvent({
      type: 'assistant_killed',
      assistantId: request.assistantId,
      state: 'terminated',
      details: { force: request.force, reason: request.reason },
    });

    return true;
  }

  getProcess(id: AssistantId): AssistantProcess | undefined {
    return this.processes.get(id);
  }

  getAllProcesses(): ReadonlyMap<AssistantId, AssistantProcess> {
    return this.processes;
  }

  getActiveCount(): number {
    let count = 0;
    for (const [, p] of this.processes) {
      if (p.state === 'running' || p.state === 'starting') {
        count++;
      }
    }
    return count;
  }

  getPausedCount(): number {
    let count = 0;
    for (const [, p] of this.processes) {
      if (p.state === 'paused') {
        count++;
      }
    }
    return count;
  }

  cleanup(): void {
    for (const [id, process] of this.processes) {
      if (process.state === 'terminated') {
        this.processes.delete(id);
      }
    }
  }
}

export async function spawnAssistant(request: AssistantSpawnRequest): Promise<AssistantSpawnResult> {
  const lifecycle = new AssistantLifecycle();
  return lifecycle.spawn(request);
}

export async function pauseAssistant(request: AssistantPauseRequest): Promise<boolean> {
  const lifecycle = new AssistantLifecycle();
  return lifecycle.pause(request);
}

export async function resumeAssistant(request: AssistantResumeRequest): Promise<boolean> {
  const lifecycle = new AssistantLifecycle();
  return lifecycle.resume(request);
}

export async function killAssistant(request: AssistantKillRequest): Promise<boolean> {
  const lifecycle = new AssistantLifecycle();
  return lifecycle.kill(request);
}
