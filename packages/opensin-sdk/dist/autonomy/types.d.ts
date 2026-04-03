export declare enum AutonomyLevel {
    Assist = "assist",
    Collaborate = "collaborate",
    Autonomous = "autonomous"
}
export interface AutonomyPermissions {
    readFile: boolean;
    writeFile: boolean;
    executeCommand: boolean;
    requireApprovalForCommand: boolean;
    requireApprovalForWrite: boolean;
    allowMultiFileEdit: boolean;
    allowFileSystemTraversal: boolean;
    allowNetworkAccess: boolean;
    maxFilesPerOperation: number;
    allowAgentInitiatedActions: boolean;
}
export interface AutonomyConfig {
    level: AutonomyLevel;
    permissions: AutonomyPermissions;
    updatedAt: number;
}
export interface AdminAutonomyPolicy {
    maxLevel: AutonomyLevel;
    enforced: boolean;
    updatedAt: number;
}
export interface AutonomyState {
    sessionLevels: Map<string, AutonomyLevel>;
    projectLevels: Map<string, AutonomyLevel>;
    adminPolicy: AdminAutonomyPolicy | null;
    defaultLevel: AutonomyLevel;
}
export interface AutonomyChangeEvent {
    sessionId?: string;
    projectPath?: string;
    previousLevel: AutonomyLevel;
    newLevel: AutonomyLevel;
    timestamp: number;
}
//# sourceMappingURL=types.d.ts.map