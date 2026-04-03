export class PermissionEngine {
    grants = new Map();
    defaultScopes = [];
    grantCounter = 0;
    constructor(defaultScopes = []) {
        this.defaultScopes = defaultScopes;
    }
    grant(resource, action, grantedBy, pattern, expiresAt) {
        const id = `grant-${++this.grantCounter}`;
        const grant = {
            id,
            scope: { resource, action, pattern },
            grantedAt: new Date(),
            grantedBy,
            expiresAt,
        };
        this.grants.set(id, grant);
        return grant;
    }
    revoke(grantId) {
        return this.grants.delete(grantId);
    }
    check(resource, action, detail) {
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
    checkFileRead(path) {
        return this.check("file", "read", path);
    }
    checkFileWrite(path) {
        return this.check("file", "write", path);
    }
    checkCommand(command) {
        return this.check("command", "execute", command);
    }
    checkNetwork(url) {
        return this.check("network", "access", url);
    }
    listGrants() {
        return Array.from(this.grants.values());
    }
    revokeExpired() {
        let count = 0;
        for (const [id, grant] of this.grants) {
            if (grant.expiresAt && grant.expiresAt < new Date()) {
                this.grants.delete(id);
                count++;
            }
        }
        return count;
    }
    matchesPattern(pattern, value) {
        if (pattern === "*")
            return true;
        const regexPattern = pattern
            .replace(/\./g, "\\.")
            .replace(/\*\*/g, "___DOUBLE_STAR___")
            .replace(/\*/g, "[^/]*")
            .replace(/___DOUBLE_STAR___/g, ".*");
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(value);
    }
}
//# sourceMappingURL=permissions.js.map