import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const TERMINAL_CAPTURE_TOOL_NAME = 'TerminalCapture'
const DESCRIPTION = 'Capture terminal output for context'
const PROMPT = `Capture and analyze terminal output.

Use to:
- Capture output from a specific command
- Get the last N lines of terminal output
- Filter output by pattern

Args:
- command: Command to run and capture (optional - if empty, captures last output)
- lines: Number of lines to capture (default 100)
- filter: Regex pattern to filter output (optional)`

const inputSchema = lazySchema(() =>
  z.strictObject({
    command: z.string().optional().describe('Command to execute and capture'),
    lines: z
      .number()
      .int()
      .min(1)
      .max(10000)
      .optional()
      .default(100)
      .describe('Number of lines to capture'),
    filter: z.string().optional().describe('Regex filter for output lines'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    output: z.string().describe('Captured terminal output'),
    exitCode: z.number().describe('Exit code of the command'),
    duration: z.number().describe('Execution duration in ms'),
    truncated: z.boolean().describe('Whether output was truncated'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const TerminalCaptureTool = buildTool({
  name: TERMINAL_CAPTURE_TOOL_NAME,
  searchHint: 'terminal capture output log command execution',
  maxResultSizeChars: 50_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('TERMINAL_PANEL')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    return `TerminalCapture${input.command ? ` ${input.command.slice(0, 30)}` : ''}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    return {
      output: '',
      exitCode: 0,
      duration: 0,
      truncated: false,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)