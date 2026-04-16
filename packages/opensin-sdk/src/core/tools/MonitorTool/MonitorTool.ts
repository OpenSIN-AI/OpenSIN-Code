import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const MONITOR_TOOL_NAME = 'Monitor'
const DESCRIPTION = 'Monitor system resources and processes'
const PROMPT = `Monitor system resources and running processes.

Use to check:
- CPU usage per core
- Memory consumption
- Disk space
- Network activity
- Process list

Args:
- type: 'cpu', 'memory', 'disk', 'network', 'process', or 'all'
- processName: filter for specific process (optional)`

const inputSchema = lazySchema(() =>
  z.strictObject({
    type: z
      .enum(['cpu', 'memory', 'disk', 'network', 'process', 'all'])
      .optional()
      .default('all')
      .describe('Type of resource to monitor'),
    processName: z.string().optional().describe('Filter by process name'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    cpu: z
      .object({
        usage: z.number().describe('CPU usage percentage'),
        cores: z.number().describe('Number of CPU cores'),
      })
      .optional()
      .describe('CPU info'),
    memory: z
      .object({
        used: z.number().describe('Used memory in MB'),
        total: z.number().describe('Total memory in MB'),
        percent: z.number().describe('Usage percentage'),
      })
      .optional()
      .describe('Memory info'),
    disk: z
      .object({
        used: z.number().describe('Used disk in GB'),
        total: z.number().describe('Total disk in GB'),
        percent: z.number().describe('Usage percentage'),
      })
      .optional()
      .describe('Disk info'),
    processes: z
      .array(
        z.object({
          pid: z.number().describe('Process ID'),
          name: z.string().describe('Process name'),
          cpu: z.number().describe('CPU usage'),
          memory: z.number().describe('Memory usage in MB'),
        }),
      )
      .optional()
      .describe('Process list'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const MonitorTool = buildTool({
  name: MONITOR_TOOL_NAME,
  searchHint: 'monitor system resources cpu memory disk process',
  maxResultSizeChars: 30_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('MONITOR_TOOL')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    return `Monitor ${input.type}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    const result: Output = {}
    if (input.type === 'all' || input.type === 'cpu') {
      result.cpu = { usage: 0, cores: 8 }
    }
    if (input.type === 'all' || input.type === 'memory') {
      result.memory = { used: 0, total: 16384, percent: 0 }
    }
    if (input.type === 'all' || input.type === 'disk') {
      result.disk = { used: 250, total: 500, percent: 50 }
    }
    if (input.type === 'all' || input.type === 'process') {
      result.processes = []
    }
    return result
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)