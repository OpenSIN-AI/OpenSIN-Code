import type { SafetyConfig, SafetyCheckResult } from './types.js';

export const DANGEROUS_PATTERNS = [
  /^rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+\/\s*$/,
  /^rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s+\/\*\s*$/,
  /^git\s+push\s+--force/,
  /^git\s+push\s+-f\b/,
  /^git\s+reset\s+--hard/,
  /^git\s+clean\s+-fdx/,
  /^chmod\s+-R\s+777\s+\/\s*$/,
  /^:\(\)\{\s*:\|:\s*&\s*\}\s*;/,
  />\s*\/dev\/sda/,
  /mkfs\./,
];

const DEFAULT_CONFIG: SafetyConfig = {
  blockForcePush: true,
  blockHardReset: true,
  blockRmRf: true,
  blockDangerousPatterns: [],
  requireConfirmation: true,
};

export function checkCommandSafety(command: string, config: Partial<SafetyConfig> = {}): SafetyCheckResult {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const trimmed = command.trim();
  const reasons: string[] = [];
  let severityLevel = 0;

  function setSeverity(level: number) {
    if (level > severityLevel) severityLevel = level;
  }

  if (cfg.blockForcePush && /^git\s+push\s+(--force|-f\b)/.test(trimmed)) {
    reasons.push('Force push detected — may overwrite remote history');
    setSeverity(2);
  }

  if (cfg.blockHardReset && /^git\s+reset\s+--hard/.test(trimmed)) {
    reasons.push('Hard reset detected — will discard all uncommitted changes');
    setSeverity(2);
  }

  if (cfg.blockRmRf && /^rm\s+(-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*|-[a-zA-Z]*f[a-zA-Z]*r[a-zA-Z]*)\s/.test(trimmed)) {
    reasons.push('Recursive force delete detected — may permanently delete files');
    setSeverity(3);
  }

  if (/^git\s+clean\s+-fdx/.test(trimmed)) {
    reasons.push('Git clean -fdx detected — will remove all untracked files including ignored');
    setSeverity(2);
  }

  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed.toLowerCase())) {
      reasons.push('Matches dangerous pattern: ' + pattern.source);
      setSeverity(3);
    }
  }

  for (const custom of cfg.blockDangerousPatterns) {
    try {
      if (new RegExp(custom, 'i').test(trimmed)) {
        reasons.push('Matches custom dangerous pattern: ' + custom);
        setSeverity(2);
      }
    } catch { /* skip invalid regex */ }
  }

  const severityMap: Record<number, 'low' | 'medium' | 'high' | 'critical'> = {
    0: 'low', 1: 'medium', 2: 'high', 3: 'critical',
  };

  return {
    safe: reasons.length === 0,
    command: trimmed,
    reasons,
    severity: severityMap[severityLevel] ?? 'low',
    requiresConfirmation: cfg.requireConfirmation && reasons.length > 0,
  };
}

export class SafetyNetPlugin {
  private config: SafetyConfig;

  constructor(config?: Partial<SafetyConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getConfig(): SafetyConfig { return { ...this.config }; }
  setConfig(config: Partial<SafetyConfig>): void { this.config = { ...this.config, ...config }; }

  check(command: string): SafetyCheckResult { return checkCommandSafety(command, this.config); }

  isSafe(command: string): boolean { return checkCommandSafety(command, this.config).safe; }

  getManifest() {
    return {
      id: 'safety-net', name: 'Safety Net Plugin', version: '0.1.0',
      description: 'Destructive command protection for OpenSIN CLI', author: 'OpenSIN-AI', license: 'MIT',
    };
  }
}
