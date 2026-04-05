/**
 * OpenSIN Envsitter Guard Types
 */

export interface EnvGuardConfig {
  blockedPatterns: string[];
  allowKeyInspection: boolean;
  maxKeysToList: number;
}

export const DEFAULT_ENVGUARD_CONFIG: EnvGuardConfig = {
  blockedPatterns: ['.env', '.env.*', '.env.local', '.env.production', '.env.development'],
  allowKeyInspection: true,
  maxKeysToList: 50,
};

export interface EnvKeyInfo {
  key: string;
  fingerprint: string;
  exists: boolean;
}
