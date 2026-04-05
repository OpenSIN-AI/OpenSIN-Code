import { StatusBarState, ThemeConfig } from './types.js';

const DEFAULT_THEME: ThemeConfig = {
  dark: true,
  colors: {
    model: '#60a5fa',
    tokens: '#a78bfa',
    cost: '#34d399',
    session: '#fbbf24',
  },
};

export function renderStatusBar(state: StatusBarState, theme: ThemeConfig = DEFAULT_THEME): string {
  const parts: string[] = [];
  
  if (state.model) {
    parts.push(`Model: ${state.model}`);
  }
  if (state.tokenCount > 0) {
    parts.push(`Tokens: ${state.tokenCount.toLocaleString()}`);
  }
  if (state.cost > 0) {
    parts.push(`Cost: $${state.cost.toFixed(4)}`);
  }
  if (state.sessionName) {
    parts.push(`Session: ${state.sessionName}`);
  }

  return parts.join(' | ');
}

export function renderStatusLine(state: StatusBarState, theme: ThemeConfig = DEFAULT_THEME): string {
  const bar = renderStatusBar(state, theme);
  const width = process.stdout.columns || 80;
  const padding = ' '.repeat(Math.max(0, width - bar.length));
  return `\r${bar}${padding}`;
}
