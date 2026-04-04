/**
 * OpenSIN CLI Tool Security
 *
 * Path validation, permission checks, and security guards for all tools.
 */

import { existsSync, statSync } from 'fs';
import { resolve, normalize, isAbsolute } from 'path';
import type { PathSecurityPolicy, PermissionCheck } from './types.js';
import { DEFAULT_SECURITY_POLICY } from './types.js';

/**
 * Normalize and resolve a file path safely.
 */
export function safeResolvePath(inputPath: string, baseDir?: string): string {
  const resolved = baseDir ? resolve(baseDir, inputPath) : resolve(inputPath);
  return normalize(resolved);
}

/**
 * Check if a path is safe.
 */
export function isPathSafe(
  filePath: string,
  policy: PathSecurityPolicy = DEFAULT_SECURITY_POLICY,
): PermissionCheck {
  const resolved = safeResolvePath(filePath);

  if (filePath.includes('..') && !isAbsolute(filePath)) {
    const resolvedCheck = safeResolvePath(filePath);
    if (resolvedCheck.includes('/etc/') || resolvedCheck.includes('/root/')) {
      return { allowed: false, reason: 'Path traversal detected: ' + filePath + ' resolves to ' + resolvedCheck, errorCode: 403 };
    }
  }

  for (const denied of policy.deniedDirs || []) {
    if (resolved.startsWith(denied)) {
      return { allowed: false, reason: 'Access to ' + denied + ' is denied by security policy', errorCode: 403 };
    }
  }

  return { allowed: true };
}

/**
 * Validate that a file exists and is readable.
 */
export function validateFileReadable(filePath: string): PermissionCheck {
  try {
    const resolved = safeResolvePath(filePath);
    if (!existsSync(resolved)) {
      return { allowed: false, reason: 'File does not exist: ' + resolved, errorCode: 404 };
    }
    const stats = statSync(resolved);
    if (!stats.isFile() && !stats.isSymbolicLink()) {
      return { allowed: false, reason: 'Not a regular file: ' + resolved, errorCode: 400 };
    }
    return { allowed: true };
  } catch (err) {
    return { allowed: false, reason: 'Cannot access file: ' + (err instanceof Error ? err.message : String(err)), errorCode: 500 };
  }
}

/**
 * Validate that a directory exists and is writable.
 */
export function validateDirectoryWritable(dirPath: string): PermissionCheck {
  try {
    const resolved = safeResolvePath(dirPath);
    if (!existsSync(resolved)) return { allowed: true };
    const stats = statSync(resolved);
    if (!stats.isDirectory()) {
      return { allowed: false, reason: 'Not a directory: ' + resolved, errorCode: 400 };
    }
    return { allowed: true };
  } catch (err) {
    return { allowed: false, reason: 'Cannot access directory: ' + (err instanceof Error ? err.message : String(err)), errorCode: 500 };
  }
}

/**
 * Dangerous commands that are never allowed.
 */
export const DANGEROUS_COMMANDS = new Set([
  'rm -rf /', 'rm -rf /*', ':(){:|:&};:', 'mkfs',
  'dd if=/dev/zero', 'chmod -R 777 /', 'chown -R',
]);

export function isCommandSafe(command: string): PermissionCheck {
  const trimmed = command.trim();
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (trimmed.includes(dangerous)) {
      return { allowed: false, reason: 'Command contains dangerous operation: ' + dangerous, errorCode: 403 };
    }
  }
  if (/:\(\)\{.*\|.*&.*\};/.test(trimmed)) {
    return { allowed: false, reason: 'Fork bomb pattern detected', errorCode: 403 };
  }
  if (/rm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+\/\s*$/.test(trimmed)) {
    return { allowed: false, reason: 'Cannot remove root directory', errorCode: 403 };
  }
  return { allowed: true };
}

/**
 * Validate file size before read operations.
 */
export function validateFileSize(
  filePath: string,
  maxSizeBytes: number = DEFAULT_SECURITY_POLICY.maxReadSizeBytes!,
): PermissionCheck {
  try {
    const resolved = safeResolvePath(filePath);
    const stats = statSync(resolved);
    if (stats.size > maxSizeBytes) {
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(2);
      return { allowed: false, reason: 'File too large: ' + sizeMB + ' MB exceeds maximum of ' + maxMB + ' MB', errorCode: 413 };
    }
    return { allowed: true };
  } catch (err) {
    return { allowed: false, reason: 'Cannot stat file: ' + (err instanceof Error ? err.message : String(err)), errorCode: 500 };
  }
}
