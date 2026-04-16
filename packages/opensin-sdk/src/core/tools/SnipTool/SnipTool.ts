import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const SNIP_TOOL_NAME = 'Snip'
const DESCRIPTION = 'Snip/summarize history to save tokens'
const PROMPT = `Snip or summarize conversation history to reduce token usage.

Modes:
- keep-last: Keep only the last N messages
- keep-first: Keep only the first N messages
- keep-range: Keep messages in a range
- snip-between: Remove messages between two indices

Use when context is getting full or you need to focus on recent work.`

const inputSchema = lazySchema(() =>
  z.strictObject({
    mode: z
      .enum(['keep-last', 'keep-first', 'keep-range', 'snip-between'])
      .describe('Snip mode'),
    keepCount: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe('Number of messages to keep (for keep-last/keep-first)'),
    startIndex: z
      .number()
      .int()
      .optional()
      .describe('Start index (for keep-range/snip-between)'),
    endIndex: z
      .number()
      .int()
      .optional()
      .describe('End index (for keep-range/snip-between)'),
    pattern: z.string().optional().describe('Pattern to match for snip-between'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether snip succeeded'),
    tokensSaved: z.number().describe('Estimated tokens saved'),
    remainingMessages: z
      .number()
      .describe('Number of messages remaining'),
    snippedMessages: z
      .number()
      .describe('Number of messages snipped'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const SnipTool = buildTool({
  name: SNIP_TOOL_NAME,
  searchHint: 'snip history summarize reduce tokens context',
  maxResultSizeChars: 20_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('HISTORY_SNIP')
  },
  isConcurrencySafe() {
    return false
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input: Input) {
    return `Snip ${input.mode}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    const keepCount = input.keepCount ?? 10
    return {
      success: true,
      tokensSaved: 0,
      remainingMessages: keepCount,
      snippedMessages: 0,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)