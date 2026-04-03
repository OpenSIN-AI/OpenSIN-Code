import { AutonomyLevel, AutonomyPermissions } from "./types.js";

const PERMISSION_MATRIX: Record<AutonomyLevel, AutonomyPermissions> = {
  [AutonomyLevel.Assist]: {
    readFile: true,
    writeFile: false,
    executeCommand: false,
    requireApprovalForCommand: true,
    requireApprovalForWrite: true,
    allowMultiFileEdit: false,
    allowFileSystemTraversal: false,
    allowNetworkAccess: false,
    maxFilesPerOperation: 1,
    allowAgentInitiatedActions: false,
  },
  [AutonomyLevel.Collaborate]: {
    readFile: true,
    writeFile: true,
    executeCommand: true,
    requireApprovalForCommand: true,
    requireApprovalForWrite: false,
    allowMultiFileEdit: true,
    allowFileSystemTraversal: true,
    allowNetworkAccess: false,
    maxFilesPerOperation: 10,
    allowAgentInitiatedActions: false,
  },
  [AutonomyLevel.Autonomous]: {
    readFile: true,
    writeFile: true,
    executeCommand: true,
    requireApprovalForCommand: false,
    requireApprovalForWrite: false,
    allowMultiFileEdit: true,
    allowFileSystemTraversal: true,
    allowNetworkAccess: true,
    maxFilesPerOperation: -1,
    allowAgentInitiatedActions: true,
  },
};

export class PermissionMatrix {
  static get(level: AutonomyLevel): AutonomyPermissions {
    return { ...PERMISSION_MATRIX[level] };
  }

  static canRead(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].readFile;
  }

  static canWrite(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].writeFile;
  }

  static canExecute(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].executeCommand;
  }

  static requiresCommandApproval(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].requireApprovalForCommand;
  }

  static requiresWriteApproval(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].requireApprovalForWrite;
  }

  static canEditMultipleFiles(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].allowMultiFileEdit;
  }

  static canAccessNetwork(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].allowNetworkAccess;
  }

  static maxFiles(level: AutonomyLevel): number {
    return PERMISSION_MATRIX[level].maxFilesPerOperation;
  }

  static allowsAgentInitiatedActions(level: AutonomyLevel): boolean {
    return PERMISSION_MATRIX[level].allowAgentInitiatedActions;
  }

  static isReadOnly(level: AutonomyLevel): boolean {
    const perms = PERMISSION_MATRIX[level];
    return !perms.writeFile && !perms.executeCommand;
  }

  static label(level: AutonomyLevel): string {
    switch (level) {
      case AutonomyLevel.Assist:
        return "Assist";
      case AutonomyLevel.Collaborate:
        return "Collaborate";
      case AutonomyLevel.Autonomous:
        return "Autonomous";
    }
  }

  static icon(level: AutonomyLevel): string {
    switch (level) {
      case AutonomyLevel.Assist:
        return "A";
      case AutonomyLevel.Collaborate:
        return "C";
      case AutonomyLevel.Autonomous:
        return "F";
    }
  }

  static description(level: AutonomyLevel): string {
    switch (level) {
      case AutonomyLevel.Assist:
        return "Read-only, suggestions only";
      case AutonomyLevel.Collaborate:
        return "Read + targeted edits, commands require approval";
      case AutonomyLevel.Autonomous:
        return "Full read/write/execute, user reviews after completion";
    }
  }
}

export function resolvePermissions(level: AutonomyLevel): AutonomyPermissions {
  return { ...PERMISSION_MATRIX[level] };
}
