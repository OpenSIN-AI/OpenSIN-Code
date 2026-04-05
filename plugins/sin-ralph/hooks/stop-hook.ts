/**
 * sin-ralph — Stop Hook for Ralph Loop
 * Intercepts exit attempts and re-feeds the prompt until completion
 * Portiert aus sin-claude/claude-code-main/plugins/ralph-wiggum/
 */

import * as fs from 'fs';
import * as path from 'path';

export interface RalphState {
  active: boolean;
  prompt: string;
  currentIteration: number;
  maxIterations: number;
  completionPromise: string;
  cancelled: boolean;
  lastTranscript: string;
}

const STATE_FILE = '.opensin/ralph-state.json';

function loadState(): RalphState | null {
  try {
    const content = fs.readFileSync(STATE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function saveState(state: RalphState): void {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

export async function ralphStopHook(input: { reason?: string; transcript_path?: string }): Promise<Record<string, unknown>> {
  const state = loadState();
  if (!state || !state.active || state.cancelled) {
    return {};
  }

  // Read transcript to check for completion promise
  let transcript = '';
  if (input.transcript_path) {
    try {
      transcript = fs.readFileSync(input.transcript_path, 'utf-8');
    } catch {
      // Ignore
    }
  }

  state.lastTranscript = transcript;
  state.currentIteration += 1;

  // Check max iterations
  if (state.currentIteration >= state.maxIterations) {
    state.active = false;
    saveState(state);
    return {
      systemMessage: `🛑 **Ralph Loop: Max iterations reached (${state.maxIterations})**\n\nThe loop ran ${state.currentIteration} times without detecting the completion promise "${state.completionPromise}".\n\nConsider:\n- Increasing --max-iterations\n- Refining your prompt\n- Breaking the task into smaller steps`,
    };
  }

  // Check for completion promise
  if (transcript.includes(state.completionPromise)) {
    state.active = false;
    saveState(state);
    return {
      systemMessage: `✅ **Ralph Loop: Completion detected!**\n\nThe completion promise "${state.completionPromise}" was found after ${state.currentIteration} iterations.`,
    };
  }

  // Check for cancel flag
  if (state.cancelled) {
    state.active = false;
    saveState(state);
    return {};
  }

  saveState(state);

  // Block exit and re-feed the prompt
  return {
    decision: 'block',
    reason: `🔄 **Ralph Loop: Iteration ${state.currentIteration}/${state.maxIterations}**\n\nCompletion promise not yet detected. Re-feeding prompt:\n\n> ${state.prompt.substring(0, 200)}${state.prompt.length > 200 ? '...' : ''}`,
    systemMessage: `🔄 **Ralph Loop: Iteration ${state.currentIteration}/${state.maxIterations}**\n\nContinue working on the task. The completion promise "${state.completionPromise}" has not been detected yet.\n\nOriginal prompt: ${state.prompt}`,
  };
}

export function startRalphLoop(prompt: string, maxIterations: number = 50, completionPromise: string = 'COMPLETE'): void {
  const state: RalphState = {
    active: true,
    prompt,
    currentIteration: 0,
    maxIterations,
    completionPromise,
    cancelled: false,
    lastTranscript: '',
  };
  saveState(state);
}

export function cancelRalphLoop(): boolean {
  const state = loadState();
  if (!state || !state.active) return false;
  state.cancelled = true;
  saveState(state);
  return true;
}
