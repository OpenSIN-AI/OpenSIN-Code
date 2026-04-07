import { InterruptState } from './types';

export function restoreContext(state: InterruptState): string | null {
  if (!state.contextSnapshot) {
    return null;
  }
  return state.contextSnapshot;
}

export function shouldRestore(state: InterruptState): boolean {
  return state.active && !!state.contextSnapshot;
}

export function formatRestoreMessage(prompt: string | null): string {
  if (!prompt) {
    return 'Session interrupted. What would you like to do?';
  }
  return `Session interrupted. Your pending prompt was: "${prompt}"`;
}
