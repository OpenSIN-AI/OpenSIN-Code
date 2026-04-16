import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const SUGGEST_BACKGROUND_PR_TOOL_NAME = 'SuggestBackgroundPR'
const DESCRIPTION = 'Suggest background PRs for the codebase'
const PROMPT = `Analyze the codebase and suggest PRs that could be done in the background.

Use to find:
- Refactoring opportunities
- Dependency updates
- Test coverage improvements
- Documentation gaps

Scope: 'repo' (current repo) or 'org' (entire organization)`

const inputSchema = lazySchema(() =>
  z.strictObject({
    scope: z
      .enum(['repo', 'org'])
      .optional()
      .default('repo')
      .describe('Scope for suggestions'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    suggestions: z
      .array(
        z.object({
          title: z.string().describe('PR title'),
          description: z.string().describe('PR description'),
          files: z.array(z.string()).describe('Affected files'),
          estimatedComplexity: z
            .enum(['low', 'medium', 'high'])
            .describe('Estimated complexity'),
        }),
      )
      .describe('List of PR suggestions'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const SuggestBackgroundPRTool = buildTool({
  name: SUGGEST_BACKGROUND_PR_TOOL_NAME,
  searchHint: 'suggest background pr refactor improvement',
  maxResultSizeChars: 40_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return process.env.USER_TYPE === 'ant'
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    return `SuggestBackgroundPR ${input.scope}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    return {
      suggestions: [
        {
          title: 'Add error boundary to React components',
          description:
            'Wrap all React components with error boundaries for better error handling',
          files: ['src/components/**/*.tsx'],
          estimatedComplexity: 'medium' as const,
        },
        {
          title: 'Update dependencies to latest versions',
          description: 'Run update and fix any breaking changes',
          files: ['package.json'],
          estimatedComplexity: 'low' as const,
        },
      ],
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)