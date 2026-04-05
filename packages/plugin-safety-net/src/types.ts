export interface SafetyConfig {
  blockForcePush: boolean;
  blockHardReset: boolean;
  blockRmRf: boolean;
  blockDangerousPatterns: string[];
  requireConfirmation: boolean;
}

export interface SafetyCheckResult {
  safe: boolean;
  command: string;
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  requiresConfirmation: boolean;
}
