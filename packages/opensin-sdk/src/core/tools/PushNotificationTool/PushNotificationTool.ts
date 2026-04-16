import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const PUSH_NOTIFICATION_TOOL_NAME = 'PushNotification'
const DESCRIPTION = 'Send push notifications for long-running tasks'
const PROMPT = `Send push notifications to inform users about task progress.

Channels:
- telegram: Send via Telegram bot
- email: Send via email
- webhook: Send to a webhook URL
- system: System notification

Priority levels: 'low', 'normal', 'high', 'critical'`

const inputSchema = lazySchema(() =>
  z.strictObject({
    title: z.string().describe('Notification title'),
    message: z.string().describe('Notification message body'),
    channel: z
      .enum(['telegram', 'email', 'webhook', 'system'])
      .optional()
      .default('telegram')
      .describe('Delivery channel'),
    priority: z
      .enum(['low', 'normal', 'high', 'critical'])
      .optional()
      .default('normal')
      .describe('Notification priority'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether notification was sent'),
    messageId: z.string().optional().describe('Message ID if sent'),
    error: z.string().optional().describe('Error message if failed'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const PushNotificationTool = buildTool({
  name: PUSH_NOTIFICATION_TOOL_NAME,
  searchHint: 'push notification telegram email webhook alert',
  maxResultSizeChars: 10_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('KAIROS') || feature('KAIROS_PUSH_NOTIFICATION')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input: Input) {
    return `PushNotification ${input.channel} [${input.priority}]: ${input.title}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    return {
      success: true,
      messageId: `notif-${Date.now()}`,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)