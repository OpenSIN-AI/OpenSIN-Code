/**
 * OpenSIN CLI Tool Security
 */

import * as path from 'path';
import * as fs from 'fs';
import type { PermissionCheck, SecurityContext } from './types.js';

export const DANGEROUS_COMMANDS = new Set([
  'rm -rf /', 'rm -rf /*', 'mkfs', 'dd if=', '> /dev/sda',
  'chmod -R 777 /', 'chmod -R 777 /*', 'chown -R', ':(){:|:&};:',
]);

export const PROTECTED_PATHS = [
  '/etc/passwd', '/etc/shadow', '/etc/sudoers', '/etc/ssh',
  '/root/.ssh', '/System', '/usr/bin', '/usr/sbin', '/usr/lib',
  '/bin', '/sbin', '/lib',
];

export function isPathWithinWorkspace(filePath: string, workspace: string): boolean {
  const resolvedFile = path.resolve(filePath);
  const resolvedWorkspace = path.resolve(workspace);
  return resolvedFile.startsWith(resolvedWorkspace + path.sep) || resolvedFile === resolvedWorkspace;
}

export function isProtectedPath(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return PROTECTED_PATHS.some(p => resolved.startsWith(p + path.sep) || resolved === p);
}

export function isDangerousCommand(command: string): boolean {
  const normalized = command.trim().toLowerCase();
  for (const dangerous of DANGEROUS_COMMANDS) {
    if (normalized.includes(dangerous.toLowerCase())) return true;
  }
  const patterns = [
    /^rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+\/\s*$/,
    /^rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+\/\*\s*$/,
    /:\(\)\{\s*:\|:\s*&\s*\}\s*;/,
    />\s*\/dev\/sda/, />\s*\/dev\/hd/, /mkfs\./,
  ];
  for (const pattern of patterns) {
    if (pattern.test(normalized)) return true;
  }
  return false;
}

export function validateFilePath(filePath: string, context: SecurityContext): PermissionCheck {
  let resolved: string;
  try { resolved = path.resolve(context.cwd, filePath); } catch {
    return { allowed: false, reason: 'Invalid path: ' + filePath, errorCode: 1 };
  }
  if (resolved.includes('..') && !isPathWithinWorkspace(resolved, context.cwd)) {
    return { allowed: false, reason: 'Path traversal detected: ' + filePath, errorCode: 2 };
  }
  if (isProtectedPath(resolved)) {
    return { allowed: false, reason: 'Access to protected path denied: ' + resolved, errorCode: 3 };
  }
  if (context.deniedPaths) {
    for (const denied of context.deniedPaths) {
      if (resolved.startsWith(path.resolve(context.cwd, denied))) {
        return { allowed: false, reason: 'Path is in a denied directory: ' + resolved, errorCode: 4 };
      }
    }
  }
  return { allowed: true };
}

export function checkCommandPermission(command: string, context: SecurityContext): PermissionCheck {
  if (context.permissionMode === 'readonly') {
    const writeCommands = ['>', '>>', 'tee', 'cat >', 'echo >', 'sed -i', 'cp ', 'mv ', 'rm ', 'mkdir ', 'touch '];
    for (const wc of writeCommands) {
      if (command.includes(wc)) {
        return { allowed: false, reason: 'Write operations not allowed in readonly mode', errorCode: 5 };
      }
    }
  }
  if (isDangerousCommand(command)) {
    return { allowed: false, reason: 'Command contains dangerous pattern: ' + command, errorCode: 6 };
  }
  if (context.deniedCommands) {
    for (const denied of context.deniedCommands) {
      if (command.startsWith(denied)) {
        return { allowed: false, reason: 'Command is denied: ' + command, errorCode: 7 };
      }
    }
  }
  return { allowed: true };
}

export async function ensureDirectoryExists(dirPath: string, context: SecurityContext): Promise<{ success: boolean; error?: string }> {
  const resolved = path.resolve(context.cwd, dirPath);
  const permission = validateFilePath(resolved, context);
  if (!permission.allowed) return { success: false, error: permission.reason };
  try {
    if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to create directory: ' + (error instanceof Error ? error.message : String(error)) };
  }
}
