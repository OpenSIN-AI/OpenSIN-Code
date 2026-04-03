import { BareModeConfig, BareModeError } from "./types.js";

export const DEFAULT_BARE_CONFIG: BareModeConfig = {
  apiKey: "",
  baseUrl: "http://localhost:8000",
  timeout: 30000,
  maxRetries: 2,
  disableHooks: true,
  disableLSP: true,
  disablePluginSync: true,
  disableSkillWalks: true,
  disableAutoMemory: true,
  disableOAuth: true,
  disableKeychain: true,
};

export function validateBareMode(config: Partial<BareModeConfig>): BareModeError | null {
  if (!config.apiKey && !process.env.SIN_API_KEY) {
    return {
      code: "BARE_NO_API_KEY",
      message: "--bare mode requires SIN_API_KEY environment variable or apiKey config",
      detail: "OAuth and keychain authentication are disabled in bare mode. Provide an API key.",
    };
  }

  if (config.timeout !== undefined && config.timeout < 1000) {
    return {
      code: "BARE_TIMEOUT_TOO_LOW",
      message: "Timeout must be at least 1000ms",
    };
  }

  if (config.maxRetries !== undefined && config.maxRetries < 0) {
    return {
      code: "BARE_INVALID_RETRIES",
      message: "maxRetries must be non-negative",
    };
  }

  return null;
}
