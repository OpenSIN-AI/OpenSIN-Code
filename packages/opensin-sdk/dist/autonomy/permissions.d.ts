import { AutonomyLevel, AutonomyPermissions } from "./types.js";
export declare class PermissionMatrix {
    static get(level: AutonomyLevel): AutonomyPermissions;
    static canRead(level: AutonomyLevel): boolean;
    static canWrite(level: AutonomyLevel): boolean;
    static canExecute(level: AutonomyLevel): boolean;
    static requiresCommandApproval(level: AutonomyLevel): boolean;
    static requiresWriteApproval(level: AutonomyLevel): boolean;
    static canEditMultipleFiles(level: AutonomyLevel): boolean;
    static canAccessNetwork(level: AutonomyLevel): boolean;
    static maxFiles(level: AutonomyLevel): number;
    static allowsAgentInitiatedActions(level: AutonomyLevel): boolean;
    static isReadOnly(level: AutonomyLevel): boolean;
    static label(level: AutonomyLevel): string;
    static icon(level: AutonomyLevel): string;
    static description(level: AutonomyLevel): string;
}
export declare function resolvePermissions(level: AutonomyLevel): AutonomyPermissions;
//# sourceMappingURL=permissions.d.ts.map