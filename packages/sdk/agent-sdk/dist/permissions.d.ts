import { PermissionScope, PermissionGrant, PermissionCheckResult } from "./types.js";
export declare class PermissionEngine {
    private grants;
    private defaultScopes;
    private grantCounter;
    constructor(defaultScopes?: PermissionScope[]);
    grant(resource: string, action: string, grantedBy: string, pattern?: string, expiresAt?: Date): PermissionGrant;
    revoke(grantId: string): boolean;
    check(resource: string, action: string, detail?: string): PermissionCheckResult;
    checkFileRead(path: string): PermissionCheckResult;
    checkFileWrite(path: string): PermissionCheckResult;
    checkCommand(command: string): PermissionCheckResult;
    checkNetwork(url: string): PermissionCheckResult;
    listGrants(): PermissionGrant[];
    revokeExpired(): number;
    private matchesPattern;
}
//# sourceMappingURL=permissions.d.ts.map