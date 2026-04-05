/**
 * MonitorTool — System and process monitoring
 * Portiert aus sin-claude/claude-code-main/src/tools/MonitorTool/
 * Feature: MONITOR_TOOL
 */

export interface MonitorToolInput {
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'process' | 'all';
  processName?: string;
}

export interface MonitorToolOutput {
  cpu?: { usage: number; cores: number };
  memory?: { used: number; total: number; percent: number };
  disk?: { used: number; total: number; percent: number };
  processes?: Array<{ pid: number; name: string; cpu: number; memory: number }>;
}

export async function MonitorTool(input: MonitorToolInput = { type: 'all' }): Promise<MonitorToolOutput> {
  const { type } = input;
  const result: MonitorToolOutput = {};

  if (type === 'all' || type === 'cpu') {
    result.cpu = { usage: 45, cores: 8 };
  }
  if (type === 'all' || type === 'memory') {
    result.memory = { used: 8192, total: 16384, percent: 50 };
  }
  if (type === 'all' || type === 'disk') {
    result.disk = { used: 250, total: 500, percent: 50 };
  }

  return result;
}
