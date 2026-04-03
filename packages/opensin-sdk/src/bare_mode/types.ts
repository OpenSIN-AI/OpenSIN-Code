export interface BareModeConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  disableHooks: boolean;
  disableLSP: boolean;
  disablePluginSync: boolean;
  disableSkillWalks: boolean;
  disableAutoMemory: boolean;
  disableOAuth: boolean;
  disableKeychain: boolean;
}

export interface BareModeResult {
  success: boolean;
  data: unknown;
  duration: number;
  skipped: string[];
}

export interface BareModeError {
  code: string;
  message: string;
  detail?: string;
}
