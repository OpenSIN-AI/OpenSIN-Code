/** Plan/Act Mode Separation — inspect before execution like Cline/Roo Code */

import {
  AgentMode,
  Plan,
  PlanApproval,
  PlanStep,
  PlanStatus,
  PlanActState,
  ExecutionEntry,
} from './types';

export class PlanActManager {
  private state: PlanActState;

  constructor(sessionId: string) {
    this.state = {
      currentMode: 'plan',
      activePlan: null,
      approval: null,
      executionLog: [],
    };
  }

  getState(): PlanActState {
    return { ...this.state };
  }

  switchToPlan(): void {
    this.state.currentMode = 'plan';
    this.state.approval = null;
  }

  switchToAct(): void {
    if (this.state.currentMode === 'plan') {
      throw new Error('Cannot switch to act mode without an approved plan');
    }
    this.state.currentMode = 'act';
  }

  createPlan(steps: Omit<PlanStep, 'id'>[], summary: string): Plan {
    const plan: Plan = {
      id: crypto.randomUUID(),
      sessionId: this.state.activePlan?.sessionId ?? '',
      mode: 'plan',
      steps: steps.map((s, i) => ({ ...s, id: `step-${i}` })),
      summary,
      createdAt: new Date(),
      status: 'draft',
    };
    this.state.activePlan = plan;
    return plan;
  }

  submitForReview(planId: string): Plan {
    const plan = this.getPlanOrFail(planId);
    plan.status = 'reviewing';
    return plan;
  }

  approvePlan(planId: string, approvedBy: string, comment?: string): PlanApproval {
    const plan = this.getPlanOrFail(planId);
    plan.status = 'approved';
    const approval: PlanApproval = {
      planId,
      approved: true,
      comment,
      approvedAt: new Date(),
      approvedBy,
    };
    this.state.approval = approval;
    this.state.currentMode = 'act';
    return approval;
  }

  rejectPlan(planId: string, reason: string): Plan {
    const plan = this.getPlanOrFail(planId);
    plan.status = 'rejected';
    this.state.approval = null;
    this.state.currentMode = 'plan';
    return plan;
  }

  async executePlan(planId: string, executor: (step: PlanStep) => Promise<string>): Promise<ExecutionEntry[]> {
    const plan = this.getPlanOrFail(planId);
    if (plan.status !== 'approved') {
      throw new Error('Plan must be approved before execution');
    }

    plan.status = 'executing';
    const results: ExecutionEntry[] = [];

    for (const step of plan.steps) {
      const entry: ExecutionEntry = {
        stepId: step.id,
        status: 'running',
        timestamp: new Date(),
      };

      try {
        const result = await executor(step);
        entry.status = 'completed';
        entry.result = result;
      } catch (error) {
        entry.status = 'failed';
        entry.error = error instanceof Error ? error.message : String(error);
      }

      results.push(entry);
      this.state.executionLog.push(entry);
    }

    plan.status = 'completed';
    return results;
  }

  getSteps(): PlanStep[] {
    return this.state.activePlan?.steps ?? [];
  }

  getExecutionLog(): ExecutionEntry[] {
    return [...this.state.executionLog];
  }

  private getPlanOrFail(planId: string): Plan {
    if (!this.state.activePlan || this.state.activePlan.id !== planId) {
      throw new Error(`Plan not found: ${planId}`);
    }
    return this.state.activePlan;
  }
}
