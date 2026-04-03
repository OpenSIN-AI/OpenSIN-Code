import { PermissionScope, PermissionGrant, PermissionCheckResult } from "./types.js";

export class PermissionEngine {
  private grants: Map<string, PermissionGrant> = new Map();
  private defaultScopes: PermissionScope[] = [];
  private grantCounter = 0;

  constructor(defaultScopes: PermissionScope[] = []) {
    this.defaultScopes = defaultScopes;
  }

  grant(
    resource: string,
    action: string,
    grantedBy: string,
    pattern?: string,
    expiresAt?: Date,
  ): PermissionGrant {
    const id = `grant-${++this.grantCounter}`;
    const grant: PermissionGrant = {
      id,
      scope: { resource, action, pattern },
      grantedAt: new Date(),
      grantedBy,
      expiresAt,
    };
    this.grants.set(id, grant);
    return grant;
  }

  revoke(grantId: string): boolean {
    return this.grants.delete(grantId);
  }

  check(resource: string, action: string, detail?: string): PermissionCheckResult {
    for (const [, grant] of this.grants) {
      if (grant.expiresAt && grant.expiresAt < new Date()) {
        this.grants.delete(grant.id);
        continue;
      }

      if (grant.scope.resource !== resource || grant.scope.action !== action) {
        continue;
      }

      if (grant.scope.pattern && detail) {
        if (!this.matchesPattern(grant.scope.pattern, detail)) {
          continue;
        }
      }

      return { allowed: true, grant };
    }

    return { allowed: false, reason: `No grant for ${action} on ${resource}` };
  }

  checkFileRead(path: string): PermissionCheckResult {
    return this.check("file", "read", path);
  }

  checkFileWrite(path: string): PermissionCheckResult {
    return this.check("file", "write", path);
  }

  checkCommand(command: string): PermissionCheckResult {
    return this.check("command", "execute", command);
  }

  checkNetwork(url: string): PermissionCheckResult {
    return this.check("network", "access", url);
  }

  listGrants(): PermissionGrant[] {
    return Array.from(this.grants.values());
  }

  revokeExpired(): number {
    let count = 0;
    for (const [id, grant] of this.grants) {
      if (grant.expiresAt && grant.expiresAt < new Date()) {
        this.grants.delete(id);
        count++;
      }
    }
    return count;
  }

  private matchesPattern(pattern: string, value: string): boolean {
    if (pattern === "*") return true;

    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\*\*/g, "___DOUBLE_STAR___")
      .replace(/\*/g, "[^/]*")
      .replace(/___DOUBLE_STAR___/g, ".*");

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(value);
  }
}
