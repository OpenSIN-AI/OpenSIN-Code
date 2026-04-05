export type DisplayMode = 'streaming' | 'static' | 'thinking';

export interface ThemeConfig {
  dark: boolean;
  colors: Record<string, string>;
}

export interface StatusBarState {
  model: string;
  tokenCount: number;
  cost: number;
  sessionName?: string;
}
