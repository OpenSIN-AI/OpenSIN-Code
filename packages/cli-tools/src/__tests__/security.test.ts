import { describe, it, expect } from 'vitest';
import {
  isPathWithinWorkspace,
  isProtectedPath,
  isDangerousCommand,
  validateFilePath,
  checkCommandPermission,
} from '../security.js';
import type { SecurityContext } from '../types.js';

const testContext: SecurityContext = {
  cwd: '/home/user/project',
  permissionMode: 'auto',
  sandboxEnabled: false,
};

describe('Security', () => {
  describe('isPathWithinWorkspace', () => {
    it('should allow paths within workspace', () => {
      expect(isPathWithinWorkspace('/home/user/project/src', '/home/user/project')).toBe(true);
    });

    it('should reject paths outside workspace', () => {
      expect(isPathWithinWorkspace('/etc/passwd', '/home/user/project')).toBe(false);
    });

    it('should allow exact workspace match', () => {
      expect(isPathWithinWorkspace('/home/user/project', '/home/user/project')).toBe(true);
    });
  });

  describe('isProtectedPath', () => {
    it('should protect system paths', () => {
      expect(isProtectedPath('/etc/passwd')).toBe(true);
      expect(isProtectedPath('/etc/shadow')).toBe(true);
      expect(isProtectedPath('/System/Library')).toBe(true);
    });

    it('should allow normal paths', () => {
      expect(isProtectedPath('/home/user/project/src/index.ts')).toBe(false);
      expect(isProtectedPath('/tmp/test.txt')).toBe(false);
    });
  });

  describe('isDangerousCommand', () => {
    it('should detect dangerous commands', () => {
      expect(isDangerousCommand('rm -rf /')).toBe(true);
      expect(isDangerousCommand('rm -rf /*')).toBe(true);
      expect(isDangerousCommand('mkfs.ext4 /dev/sda')).toBe(true);
    });

    it('should allow safe commands', () => {
      expect(isDangerousCommand('ls -la')).toBe(false);
      expect(isDangerousCommand('echo hello')).toBe(false);
      expect(isDangerousCommand('git status')).toBe(false);
    });
  });

  describe('validateFilePath', () => {
    it('should allow valid paths within workspace', () => {
      const result = validateFilePath('src/index.ts', testContext);
      expect(result.allowed).toBe(true);
    });

    it('should reject protected paths', () => {
      const result = validateFilePath('/etc/passwd', testContext);
      expect(result.allowed).toBe(false);
    });

    it('should reject paths with denied prefixes', () => {
      const ctx: SecurityContext = {
        ...testContext,
        deniedPaths: ['node_modules'],
      };
      const result = validateFilePath('node_modules/pkg/index.js', ctx);
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkCommandPermission', () => {
    it('should allow safe commands', () => {
      const result = checkCommandPermission('ls -la', testContext);
      expect(result.allowed).toBe(true);
    });

    it('should reject dangerous commands', () => {
      const result = checkCommandPermission('rm -rf /', testContext);
      expect(result.allowed).toBe(false);
    });

    it('should reject write commands in readonly mode', () => {
      const ctx: SecurityContext = {
        ...testContext,
        permissionMode: 'readonly',
      };
      const result = checkCommandPermission('echo test > file.txt', ctx);
      expect(result.allowed).toBe(false);
    });

    it('should allow write commands in auto mode', () => {
      const result = checkCommandPermission('echo test > file.txt', testContext);
      expect(result.allowed).toBe(true);
    });

    it('should reject denied commands', () => {
      const ctx: SecurityContext = {
        ...testContext,
        deniedCommands: ['npm publish'],
      };
      const result = checkCommandPermission('npm publish', ctx);
      expect(result.allowed).toBe(false);
    });
  });
});
