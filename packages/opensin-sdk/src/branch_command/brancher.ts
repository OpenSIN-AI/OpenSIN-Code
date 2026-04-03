import { BranchState, BranchInfo, BranchHistoryEntry, BranchCommandResult, ForkAliasResult } from "./types.js";

function generateBranchId(): string {
  return `branch_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function generateBranchName(index: number): string {
  const prefixes = ["alt", "explore", "try", "dev", "feature", "experiment", "draft", "spike"];
  const prefix = prefixes[index % prefixes.length];
  return `${prefix}-${index + 1}`;
}

export class Brancher {
  private state: BranchState;
  private branchCounter: number = 0;

  constructor(sessionId: string) {
    const rootId = generateBranchId();
    this.state = {
      currentBranchId: rootId,
      rootBranchId: rootId,
      branches: new Map([
        [
          rootId,
          {
            branchId: rootId,
            name: "main",
            parentBranchId: null,
            createdAt: new Date().toISOString(),
            forkedFromMessageId: "root",
            children: [],
            messageCount: 0,
          },
        ],
      ]),
      sessionId,
    };
  }

  getState(): BranchState {
    return {
      ...this.state,
      branches: new Map(this.state.branches),
    };
  }

  branch(forkFromMessageId: string, name?: string): BranchCommandResult {
    const currentBranch = this.state.branches.get(this.state.currentBranchId);
    if (!currentBranch) {
      return { success: false, branch: null, message: "No active branch found" };
    }

    const newBranchId = generateBranchId();
    const branchName = name ?? generateBranchName(this.branchCounter++);

    const newBranch: BranchHistoryEntry = {
      branchId: newBranchId,
      name: branchName,
      parentBranchId: this.state.currentBranchId,
      createdAt: new Date().toISOString(),
      forkedFromMessageId,
      children: [],
      messageCount: 0,
    };

    this.state.branches.set(newBranchId, newBranch);
    currentBranch.children.push(newBranchId);
    this.state.currentBranchId = newBranchId;

    const branchInfo: BranchInfo = {
      branchId: newBranchId,
      name: branchName,
      parentBranchId: currentBranch.branchId,
      createdAt: newBranch.createdAt,
      forkedFromMessageId,
      messageCount: 0,
      isActive: true,
    };

    return {
      success: true,
      branch: branchInfo,
      message: `Created and switched to branch "${branchName}" from message ${forkFromMessageId}`,
    };
  }

  fork(forkFromMessageId: string, name?: string): ForkAliasResult {
    const result = this.branch(forkFromMessageId, name);
    return {
      success: result.success,
      branch: result.branch,
      message: result.message,
      aliasNote: "/fork is an alias for /branch - both create conversation forks",
    };
  }

  switchToBranch(branchId: string): BranchCommandResult {
    const branch = this.state.branches.get(branchId);
    if (!branch) {
      return { success: false, branch: null, message: `Branch "${branchId}" not found` };
    }

    this.state.currentBranchId = branchId;

    const branchInfo: BranchInfo = {
      branchId: branch.branchId,
      name: branch.name,
      parentBranchId: branch.parentBranchId,
      createdAt: branch.createdAt,
      forkedFromMessageId: branch.forkedFromMessageId,
      messageCount: branch.messageCount,
      isActive: true,
    };

    return {
      success: true,
      branch: branchInfo,
      message: `Switched to branch "${branch.name}"`,
    };
  }

  switchToBranchByName(name: string): BranchCommandResult {
    for (const [, branch] of this.state.branches) {
      if (branch.name === name) {
        return this.switchToBranch(branch.branchId);
      }
    }
    return { success: false, branch: null, message: `No branch named "${name}" found` };
  }

  listBranches(): BranchHistoryEntry[] {
    return Array.from(this.state.branches.values());
  }

  getBranchTree(): BranchHistoryEntry[] {
    return this.buildTree(this.state.rootBranchId);
  }

  deleteBranch(branchId: string): BranchCommandResult {
    if (branchId === this.state.rootBranchId) {
      return { success: false, branch: null, message: "Cannot delete the root branch" };
    }

    const branch = this.state.branches.get(branchId);
    if (!branch) {
      return { success: false, branch: null, message: `Branch "${branchId}" not found` };
    }

    const parentBranch = branch.parentBranchId
      ? this.state.branches.get(branch.parentBranchId)
      : null;
    if (parentBranch) {
      parentBranch.children = parentBranch.children.filter((id) => id !== branchId);
    }

    this.state.branches.delete(branchId);

    if (this.state.currentBranchId === branchId) {
      this.state.currentBranchId = branch.parentBranchId ?? this.state.rootBranchId;
    }

    return {
      success: true,
      branch: null,
      message: `Deleted branch "${branch.name}"`,
    };
  }

  recordMessage(branchId?: string): void {
    const targetId = branchId ?? this.state.currentBranchId;
    const branch = this.state.branches.get(targetId);
    if (branch) {
      branch.messageCount += 1;
    }
  }

  private buildTree(branchId: string): BranchHistoryEntry[] {
    const branch = this.state.branches.get(branchId);
    if (!branch) return [];

    const result = [branch];
    for (const childId of branch.children) {
      result.push(...this.buildTree(childId));
    }
    return result;
  }
}
