import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const SUBSCRIBE_PR_TOOL_NAME = 'SubscribePR'
const DESCRIPTION = 'Subscribe to GitHub PR notifications'
const PROMPT = `Subscribe to GitHub pull request notifications.

Use to:
- Subscribe to PR updates for a specific repo
- Unsubscribe from PR notifications
- List current subscriptions

Actions:
- subscribe: Subscribe to a PR (requires repo and prNumber)
- unsubscribe: Unsubscribe from a PR
- list: List all active subscriptions`

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z
      .enum(['subscribe', 'unsubscribe', 'list'])
      .describe('Action to perform'),
    repo: z.string().optional().describe('Repository (owner/repo)'),
    prNumber: z
      .number()
      .int()
      .optional()
      .describe('PR number to subscribe to'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether action succeeded'),
    subscriptions: z
      .array(
        z.object({
          repo: z.string().describe('Repository name'),
          pr: z.number().describe('PR number'),
          events: z.array(z.string()).describe('Subscribed events'),
        }),
      )
      .optional()
      .describe('List of subscriptions (for list action)'),
    error: z.string().optional().describe('Error message if failed'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

const subscriptions: Array<{ repo: string; pr: number; events: string[] }> = []

export const SubscribePRTool = buildTool({
  name: SUBSCRIBE_PR_TOOL_NAME,
  searchHint: 'subscribe github pr notification webhook',
  maxResultSizeChars: 20_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('KAIROS_GITHUB_WEBHOOKS')
  },
  isConcurrencySafe() {
    return false
  },
  isReadOnly(input: Input) {
    return input.action === 'list'
  },
  toAutoClassifierInput(input: Input) {
    return `SubscribePR ${input.action}${input.repo ? ` ${input.repo}` : ''}${input.prNumber ? ` #${input.prNumber}` : ''}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    if (input.action === 'list') {
      return { success: true, subscriptions: [...subscriptions] }
    }
    if (input.action === 'subscribe' && input.repo && input.prNumber) {
      const existing = subscriptions.findIndex(
        s => s.repo === input.repo && s.pr === input.prNumber,
      )
      if (existing === -1) {
        subscriptions.push({
          repo: input.repo,
          pr: input.prNumber,
          events: ['updated', 'reviewed', 'merged', 'closed'],
        })
      }
      return { success: true }
    }
    if (input.action === 'unsubscribe' && input.repo && input.prNumber) {
      const idx = subscriptions.findIndex(
        s => s.repo === input.repo && s.pr === input.prNumber,
      )
      if (idx !== -1) subscriptions.splice(idx, 1)
      return { success: true }
    }
    return { success: false, error: 'Invalid action or missing parameters' }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)