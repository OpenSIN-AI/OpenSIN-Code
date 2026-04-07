import { BareModeConfig } from './types';

const DEFAULT_BARE_MODE_CONFIG: BareModeConfig = {
  enabled: false,
  skipOnboarding: true,
  minimalPrompt: true,
  noBranding: true,
  rawOutput: true,
};

export function getBareModeConfig(): BareModeConfig {
  const envEnabled = process.env.OPENSIN_BARE_MODE === '1';
  return {
    ...DEFAULT_BARE_MODE_CONFIG,
    enabled: envEnabled,
  };
}

export function isBareModeEnabled(): boolean {
  return getBareModeConfig().enabled;
}
