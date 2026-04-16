/**
 * SleepTool — Sleep/wait for scheduled tasks
 * Feature: PROACTIVE | KAIROS
 * Pattern: buildTool with lazySchema, feature gating
 */
import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const SLEEP_TOOL_NAME = 'Sleep'
const DESCRIPTION = 'Wait for a specified duration'
const PROMPT = `Wait for a specified duration. The user can interrupt the sleep at any time.

Use this when the user tells you to sleep or rest, when you have nothing to do, or when you're waiting for something.

You may receive periodic check-in prompts — look for useful work to do before sleeping.
You can call this concurrently with other tools — it won't interfere with them.
Prefer this over \`Bash(sleep ...)\` — it doesn't hold a shell process.
Each wake-up costs an API call, but the prompt cache expires after 5 minutes of inactivity — balance accordingly.`

const inputSchema = lazySchema(() =>
  z.strictObject({
    duration: z
      .number()
      .int()
      .min(1)
      .max(300)
      .describe('Duration to sleep in seconds (1-300)'),
    reason: z.string().optional().describe('Why the agent is sleeping'),
    wakeCondition: z
      .string()
      .optional()
      .describe('Optional condition to wake early'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    slept: z.boolean().describe('Whether the sleep completed'),
    actualDuration: z
      .number()
      .describe('Actual duration slept in seconds'),
    reason: z.string().optional().describe('The reason for sleeping'),
    interrupted: z.boolean().describe('Whether sleep was interrupted early'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const SleepTool = buildTool({
  name: SLEEP_TOOL_NAME,
  searchHint: 'sleep wait rest delay pause scheduled',
  maxResultSizeChars: 10_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('PROACTIVE') || feature('KAIROS')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    return `Sleep ${input.duration}s${input.reason ? ` - ${input.reason}` : ''}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, context: ToolUseContext) {
    const { duration, reason } = input
    const startTime = Date.now()
    const maxDuration = duration * 1000

    // Sleep with periodic checks for interruption
    // We yield control every 5 seconds to allow for check-ins
    const CHECK_INTERVAL = 5000
    let elapsed = 0
    let interrupted = false

    while (elapsed < maxDuration) {
      const sleepTime = Math.min(CHECK_INTERVAL, maxDuration - elapsed)

      // Wait with abort support
      await new Promise<void>(resolve => {
        const timer = setTimeout(resolve, sleepTime)
        context.abortController.signal.addEventListener('abort', () => {
          clearTimeout(timer)
          resolve()
        })
      })

      elapsed = Date.now() - startTime

      if (context.abortController.signal.aborted) {
        interrupted = true
        break
      }
    }

    const actualDuration = (Date.now() - startTime) / 1000

    return {
      slept: true,
      actualDuration,
      reason: reason ?? null,
      interrupted,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)