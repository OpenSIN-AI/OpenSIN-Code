import { describe, it, expect, beforeEach } from 'vitest';
import { PermissionManager, checkPermission, grantPermission, revokePermission } from '../permissions.js';

describe('PermissionManager', () => {
  let manager: PermissionManager;

  beforeEach(() => {
    manager = new PermissionManager();
  });

  it('should check permission with no scopes (deny)', () => {
    const result = manager.checkPermission({
      resource: 'bash',
      action: 'execute',
    });
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeTruthy();
  });

  it('should allow when scope matches', () => {
    manager.addScope({ resource: 'bash', action: 'execute' });
    const result = manager.checkPermission({
      resource: 'bash',
      action: 'execute',
    });
    expect(result.allowed).toBe(true);
  });

  it('should deny when scope does not match', () => {
    manager.addScope({ resource: 'read', action: 'execute' });
    const result = manager.checkPermission({
      resource: 'bash',
      action: 'execute',
    });
    expect(result.allowed).toBe(false);
  });

  it('should add and remove scopes', () => {
    manager.addScope({ resource: 'test', action: 'run' });
    expect(manager.getScopes()).toHaveLength(1);

    manager.removeScope('test', 'run');
    expect(manager.getScopes()).toHaveLength(0);
  });

  it('should grant and revoke permissions', () => {
    manager.addScope({ resource: 'write', action: 'execute' });

    const grant = manager.grantPermission(
      { resource: 'write', action: 'execute' },
      'admin'
    );
    expect(grant.id).toBeTruthy();
    expect(grant.grantedBy).toBe('admin');

    const result = manager.checkPermission({ resource: 'write', action: 'execute' });
    expect(result.allowed).toBe(true);
    expect(result.grant).toBeDefined();

    manager.revokePermission(grant.id);
    const afterRevoke = manager.checkPermission({ resource: 'write', action: 'execute' });
    expect(afterRevoke.allowed).toBe(true);
    expect(afterRevoke.grant).toBeUndefined();
  });

  it('should expire grants', () => {
    manager.addScope({ resource: 'temp', action: 'execute' });

    const expired = new Date(Date.now() - 1000);
    manager.grantPermission(
      { resource: 'temp', action: 'execute' },
      'admin',
      expired
    );

    const result = manager.checkPermission({ resource: 'temp', action: 'execute' });
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('should get all grants', () => {
    manager.addScope({ resource: 'a', action: 'x' });
    manager.addScope({ resource: 'b', action: 'y' });
    manager.grantPermission({ resource: 'a', action: 'x' }, 'admin');
    manager.grantPermission({ resource: 'b', action: 'y' }, 'admin');
    expect(manager.getGrants()).toHaveLength(2);
  });
});

describe('Permission helper functions', () => {
  it('checkPermission should delegate to manager', () => {
    const manager = new PermissionManager([{ resource: 'r', action: 'a' }]);
    const result = checkPermission(manager, { resource: 'r', action: 'a' });
    expect(result.allowed).toBe(true);
  });

  it('grantPermission should delegate to manager', () => {
    const manager = new PermissionManager();
    manager.addScope({ resource: 'r', action: 'a' });
    const grant = grantPermission(manager, { resource: 'r', action: 'a' }, 'user');
    expect(grant.id).toBeTruthy();
  });

  it('revokePermission should delegate to manager', () => {
    const manager = new PermissionManager();
    manager.addScope({ resource: 'r', action: 'a' });
    const grant = manager.grantPermission({ resource: 'r', action: 'a' }, 'user');
    expect(revokePermission(manager, grant.id)).toBe(true);
  });
});
