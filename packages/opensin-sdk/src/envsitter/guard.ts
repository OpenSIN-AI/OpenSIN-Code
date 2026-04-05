/**
 * OpenSIN Envsitter Guard — .env file leak protection
 * 
 * Prevents agents/tools from reading or editing sensitive .env* files
 * while allowing safe key inspection via fingerprinting.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { EnvGuardConfig, EnvKeyInfo } from './types.js';
import { DEFAULT_ENVGUARD_CONFIG } from './types.js';

export class EnvGuard {
  private config: EnvGuardConfig;

  constructor(config: Partial<EnvGuardConfig> = {}) {
    this.config = { ...DEFAULT_ENVGUARD_CONFIG, ...config };
  }

  isBlocked(filePath: string): boolean {
    const base = path.basename(filePath);
    return this.config.blockedPatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(base);
      }
      return base === pattern;
    });
  }

  validateRead(filePath: string): { allowed: boolean; reason?: string } {
    if (this.isBlocked(filePath)) {
      return { allowed: false, reason: `Access to ${path.basename(filePath)} is blocked by Envsitter Guard` };
    }
    return { allowed: true };
  }

  validateWrite(filePath: string): { allowed: boolean; reason?: string } {
    if (this.isBlocked(filePath)) {
      return { allowed: false, reason: `Cannot write to ${path.basename(filePath)} — blocked by Envsitter Guard` };
    }
    return { allowed: true };
  }

  listKeys(dirPath: string): EnvKeyInfo[] {
    if (!this.config.allowKeyInspection) return [];
    
    const keys: EnvKeyInfo[] = [];
    try {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (!this.isBlocked(file)) continue;
        const fullPath = path.join(dirPath, file);
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
              const key = trimmed.split('=')[0].trim();
              const fingerprint = crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
              keys.push({ key, fingerprint, exists: true });
            }
          }
        } catch { /* skip unreadable files */ }
      }
    } catch { /* skip unreadable dirs */ }
    
    return keys.slice(0, this.config.maxKeysToList);
  }
}
