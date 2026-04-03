import { AutonomyLevel } from "./types.js";
const PERMISSION_MATRIX = {
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
    static get(level) {
        return { ...PERMISSION_MATRIX[level] };
    }
    static canRead(level) {
        return PERMISSION_MATRIX[level].readFile;
    }
    static canWrite(level) {
        return PERMISSION_MATRIX[level].writeFile;
    }
    static canExecute(level) {
        return PERMISSION_MATRIX[level].executeCommand;
    }
    static requiresCommandApproval(level) {
        return PERMISSION_MATRIX[level].requireApprovalForCommand;
    }
    static requiresWriteApproval(level) {
        return PERMISSION_MATRIX[level].requireApprovalForWrite;
    }
    static canEditMultipleFiles(level) {
        return PERMISSION_MATRIX[level].allowMultiFileEdit;
    }
    static canAccessNetwork(level) {
        return PERMISSION_MATRIX[level].allowNetworkAccess;
    }
    static maxFiles(level) {
        return PERMISSION_MATRIX[level].maxFilesPerOperation;
    }
    static allowsAgentInitiatedActions(level) {
        return PERMISSION_MATRIX[level].allowAgentInitiatedActions;
    }
    static isReadOnly(level) {
        const perms = PERMISSION_MATRIX[level];
        return !perms.writeFile && !perms.executeCommand;
    }
    static label(level) {
        switch (level) {
            case AutonomyLevel.Assist:
                return "Assist";
            case AutonomyLevel.Collaborate:
                return "Collaborate";
            case AutonomyLevel.Autonomous:
                return "Autonomous";
        }
    }
    static icon(level) {
        switch (level) {
            case AutonomyLevel.Assist:
                return "A";
            case AutonomyLevel.Collaborate:
                return "C";
            case AutonomyLevel.Autonomous:
                return "F";
        }
    }
    static description(level) {
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
export function resolvePermissions(level) {
    return { ...PERMISSION_MATRIX[level] };
}
//# sourceMappingURL=permissions.js.map