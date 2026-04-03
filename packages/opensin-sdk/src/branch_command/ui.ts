import { Brancher } from "./brancher.js";
import { BranchHistoryEntry, BranchInfo } from "./types.js";

export class BranchUI {
  private brancher: Brancher;

  constructor(brancher: Brancher) {
    this.brancher = brancher;
  }

  renderBranchList(): string {
    const branches = this.brancher.listBranches();
    const state = this.brancher.getState();
    const tree = this.brancher.getBranchTree();

    let output = "Conversation Branches\n";
    output += "=".repeat(40) + "\n\n";

    for (const branch of tree) {
      const indent = this.getIndentLevel(branch, tree);
      const prefix = "  ".repeat(indent);
      const isActive = branch.branchId === state.currentBranchId;
      const marker = isActive ? "[*] " : "[ ] ";
      const name = isActive ? `${branch.name} (active)` : branch.name;
      const parentInfo = branch.parentBranchId ? ` <- ${this.getParentName(branch.parentBranchId, branches)}` : " (root)";

      output += `${prefix}${marker}${name}${parentInfo}\n`;
      output += `${prefix}   messages: ${branch.messageCount} | created: ${new Date(branch.createdAt).toLocaleString()}\n`;
    }

    output += "\n";
    output += `Current: ${this.getCurrentBranchName()}\n`;
    output += `Total branches: ${branches.length}\n`;

    return output;
  }

  renderBranchCreated(branch: BranchInfo): string {
    return [
      `Branch created: "${branch.name}"`,
      `   ID: ${branch.branchId}`,
      `   Forked from message: ${branch.forkedFromMessageId}`,
      `   You are now on this branch.`,
    ].join("\n");
  }

  renderSwitched(branch: BranchInfo): string {
    return `Switched to branch "${branch.name}"`;
  }

  renderDeleted(name: string): string {
    return `Branch "${name}" deleted`;
  }

  renderError(message: string): string {
    return `Error: ${message}`;
  }

  private getIndentLevel(branch: BranchHistoryEntry, tree: BranchHistoryEntry[]): number {
    let level = 0;
    let currentParent = branch.parentBranchId;
    while (currentParent) {
      level++;
      const parent = tree.find((b) => b.branchId === currentParent);
      currentParent = parent?.parentBranchId ?? null;
    }
    return level;
  }

  private getParentName(parentId: string, branches: BranchHistoryEntry[]): string {
    const parent = branches.find((b) => b.branchId === parentId);
    return parent?.name ?? "unknown";
  }

  private getCurrentBranchName(): string {
    const state = this.brancher.getState();
    const current = state.branches.get(state.currentBranchId);
    return current?.name ?? "unknown";
  }
}
