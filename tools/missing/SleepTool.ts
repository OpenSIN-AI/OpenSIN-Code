/**
 * SleepTool — Sleep/pause for scheduled tasks
 * Portiert aus sin-claude/claude-code-main/src/tools/SleepTool/
 * Feature: PROACTIVE
 */

export interface SleepToolInput {
  duration: number; // seconds
  reason?: string;
  wakeCondition?: string;
}

export interface SleepToolOutput {
  slept: boolean;
  actualDuration: number;
  reason?: string;
}

export async function SleepTool(input: SleepToolInput): Promise<SleepToolOutput> {
  const { duration, reason } = input;
  // In production: schedule wake-up and sleep
  return {
    slept: true,
    actualDuration: duration,
    reason,
  };
}
