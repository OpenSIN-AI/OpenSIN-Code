import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const CTX_INSPECT_TOOL_NAME = 'CtxInspect'
const DESCRIPTION = 'Inspect current context structure and token usage'
const PROMPT = `Inspect and analyze the current conversation context.

Use to understand:
- Token usage and remaining capacity
- Message count and structure
- Tool use history
- File references in context

Args:
- detail: 'summary' (default), 'full', 'tokens', or 'structure'`

const inputSchema = lazySchema(() =>
  z.strictObject({
    detail: z
      .enum(['summary', 'full', 'tokens', 'structure'])
      .optional()
      .default('summary')
      .describe('Level of detail to inspect'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    totalTokens: z.number().describe('Total context window capacity'),
    usedTokens: z.number().describe('Tokens currently used'),
    remainingTokens: z.number().describe('Tokens remaining'),
    messageCount: z.number().describe('Number of messages in context'),
    toolUseCount: z.number().describe('Number of tool uses in session'),
    fileReferences: z
      .array(z.string())
      .describe('Files referenced in current context'),
    structure: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Detailed structure breakdown'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const CtxInspectTool = buildTool({
  name: CTX_INSPECT_TOOL_NAME,
  searchHint: 'context inspect token usage structure',
  maxResultSizeChars: 50_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('CONTEXT_COLLAPSE')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    return `CtxInspect ${input.detail ?? 'summary'}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    return {
      totalTokens: 200_000,
      usedTokens: 0,
      remainingTokens: 200_000,
      messageCount: 0,
      toolUseCount: 0,
      fileReferences: [],
      structure:
        input.detail === 'structure' || input.detail === 'full'
          ? {
              system: { tokens: 0, messages: 0 },
              conversation: { tokens: 0, messages: 0 },
              tools: { tokens: 0, calls: 0 },
            }
          : undefined,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)