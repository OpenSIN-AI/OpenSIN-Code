/**
 * CLI-specific types for the standalone CLI.
 */

export interface CliConfig {
  apiUrl: string;
  apiKey?: string;
  defaultModel: string;
  workspace: string;
  permissionMode: 'auto' | 'ask' | 'readonly';
  maxIterations: number;
  sandboxEnabled: boolean;
}

export type CliMode = 'interactive' | 'command' | 'pipe';

export interface SlashCommand {
  name: string;
  description: string;
  handler: (args: string) => Promise<void>;
}

export interface AgentState {
  sessionId: string | null;
  model: string;
  workspace: string;
  permissionMode: string;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  turnCount: number;
}
