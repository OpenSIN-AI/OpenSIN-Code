import type {
  PermissionScope,
  PermissionGrant,
  PermissionCheckResult,
} from './types.js';

export class PermissionManager {
  private scopes: PermissionScope[];
  private grants: Map<string, PermissionGrant> = new Map();
  private grantCounter = 0;

  constructor(scopes: PermissionScope[] = []) {
    this.scopes = scopes;
  }

  addScope(scope: PermissionScope): void {
    this.scopes.push(scope);
  }

  removeScope(resource: string, action: string): boolean {
    const index = this.scopes.findIndex(
      (s) => s.resource === resource && s.action === action
    );
    if (index === -1) return false;
    this.scopes.splice(index, 1);
    return true;
  }

  getScopes(): PermissionScope[] {
    return [...this.scopes];
  }

  checkPermission(scope: PermissionScope): PermissionCheckResult {
    const matchingScope = this.scopes.find((s) => {
      if (s.resource !== scope.resource) return false;
      if (s.action !== scope.action) return false;
      if (s.pattern && scope.pattern) {
        const regex = new RegExp(s.pattern);
        return regex.test(scope.pattern);
      }
      return !s.pattern;
    });

    if (!matchingScope) {
      return {
        allowed: false,
        reason: `No matching permission scope for ${scope.resource}:${scope.action}`,
      };
    }

    const existingGrant = this.findGrantForScope(scope);
    if (existingGrant) {
      if (existingGrant.expiresAt && existingGrant.expiresAt < new Date()) {
        this.grants.delete(existingGrant.id);
        return {
          allowed: false,
          reason: 'Permission grant has expired',
        };
      }
      return {
        allowed: true,
        grant: existingGrant,
      };
    }

    return {
      allowed: true,
      reason: 'Scope exists but no explicit grant',
    };
  }

  grantPermission(
    scope: PermissionScope,
    grantedBy: string,
    expiresAt?: Date
  ): PermissionGrant {
    this.grantCounter++;
    const grant: PermissionGrant = {
      id: `grant_${this.grantCounter}`,
      scope,
      grantedAt: new Date(),
      grantedBy,
      expiresAt,
    };
    this.grants.set(grant.id, grant);
    return grant;
  }

  revokePermission(grantId: string): boolean {
    return this.grants.delete(grantId);
  }

  getGrants(): PermissionGrant[] {
    return Array.from(this.grants.values());
  }

  private findGrantForScope(scope: PermissionScope): PermissionGrant | undefined {
    for (const grant of this.grants.values()) {
      if (
        grant.scope.resource === scope.resource &&
        grant.scope.action === scope.action
      ) {
        if (grant.scope.pattern && scope.pattern) {
          const regex = new RegExp(grant.scope.pattern);
          if (!regex.test(scope.pattern)) continue;
        }
        return grant;
      }
    }
    return undefined;
  }
}

export function checkPermission(
  manager: PermissionManager,
  scope: PermissionScope
): PermissionCheckResult {
  return manager.checkPermission(scope);
}

export function grantPermission(
  manager: PermissionManager,
  scope: PermissionScope,
  grantedBy: string,
  expiresAt?: Date
): PermissionGrant {
  return manager.grantPermission(scope, grantedBy, expiresAt);
}

export function revokePermission(
  manager: PermissionManager,
  grantId: string
): boolean {
  return manager.revokePermission(grantId);
}
