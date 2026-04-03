export interface BranchInfo {
  branchId: string;
  name: string;
  parentBranchId: string | null;
  createdAt: string;
  forkedFromMessageId: string;
  messageCount: number;
  isActive: boolean;
}

export interface BranchHistoryEntry {
  branchId: string;
  name: string;
  parentBranchId: string | null;
  createdAt: string;
  forkedFromMessageId: string;
  children: string[];
  messageCount: number;
}

export interface BranchState {
  currentBranchId: string;
  rootBranchId: string;
  branches: Map<string, BranchHistoryEntry>;
  sessionId: string;
}

export interface BranchCommandResult {
  success: boolean;
  branch: BranchInfo | null;
  message: string;
}

export interface ForkAliasResult {
  success: boolean;
  branch: BranchInfo | null;
  message: string;
  aliasNote: string;
}
