export interface EnvProtectionConfig {
  blockedPatterns: string[];
  allowKeyListing: boolean;
  customBlockedPaths: string[];
}

export interface EnvKeyInfo {
  key: string;
  fingerprint: string;
  hasValue: boolean;
}

export interface ProtectionResult {
  blocked: boolean;
  filePath: string;
  reason?: string;
}
