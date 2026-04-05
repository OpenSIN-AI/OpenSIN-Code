import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { EnvProtectionConfig, EnvKeyInfo, ProtectionResult } from './types.js';

const DEFAULT_CONFIG: EnvProtectionConfig = {
  blockedPatterns: ['.env', '.env.local', '.env.*', '.env.production', '.env.staging'],
  allowKeyListing: true,
  customBlockedPaths: [],
};

export const ENV_FILE_PATTERN = /\.env(\..+)?$/;

export function isEnvFile(filePath: string): boolean {
  const base = path.basename(filePath);
  return ENV_FILE_PATTERN.test(base);
}

export function protectEnvFiles(filePath: string, config: Partial<EnvProtectionConfig> = {}): ProtectionResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const resolved = path.resolve(filePath);
  const base = path.basename(resolved);

  if (isEnvFile(resolved)) {
    return { blocked: true, filePath: resolved, reason: `Access to .env file blocked: ${base}` };
  }

  for (const custom of cfg.customBlockedPaths) {
    if (resolved.startsWith(path.resolve(custom))) {
      return { blocked: true, filePath: resolved, reason: `Access to custom blocked path blocked: ${custom}` };
    }
  }

  return { blocked: false, filePath: resolved };
}

export function listEnvKeys(envFilePath: string): EnvKeyInfo[] {
  if (!isEnvFile(envFilePath)) return [];
  try {
    const content = fs.readFileSync(envFilePath, 'utf8');
    const lines = content.split('\n');
    const keys: EnvKeyInfo[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.substring(0, eqIndex).trim();
      const value = trimmed.substring(eqIndex + 1).trim().replace(/^["']|["']$/g, '');
      const fingerprint = value ? crypto.createHash('sha256').update(value).digest('hex').substring(0, 8) : '';
      keys.push({ key, fingerprint, hasValue: value.length > 0 });
    }
    return keys;
  } catch {
    return [];
  }
}

export class EnvsitterPlugin {
  private config: EnvProtectionConfig;

  constructor(config?: Partial<EnvProtectionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): EnvProtectionConfig { return { ...this.config }; }
  setConfig(config: Partial<EnvProtectionConfig>): void { this.config = { ...this.config, ...config }; }

  check(filePath: string): ProtectionResult { return protectEnvFiles(filePath, this.config); }
  listKeys(envFilePath: string): EnvKeyInfo[] { return listEnvKeys(envFilePath); }

  getManifest() {
    return {
      id: 'envsitter', name: 'Envsitter Guard Plugin', version: '0.1.0',
      description: '.env file protection for OpenSIN CLI', author: 'OpenSIN-AI', license: 'MIT',
    };
  }
}
