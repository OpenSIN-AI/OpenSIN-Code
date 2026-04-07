export interface BareModeConfig {
  enabled: boolean;
  skipOnboarding: boolean;
  minimalPrompt: boolean;
  noBranding: boolean;
  rawOutput: boolean;
}

export interface BareModeResult {
  output: string;
  tokensUsed: number;
  duration: number;
}
