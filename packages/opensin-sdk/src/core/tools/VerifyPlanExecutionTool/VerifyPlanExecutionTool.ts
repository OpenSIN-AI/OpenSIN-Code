import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const VERIFY_PLAN_EXECUTION_TOOL_NAME = 'VerifyPlanExecution'
const DESCRIPTION = 'Verify plan execution progress and completeness'
const PROMPT = `Verify the progress and completeness of plan execution.

Use to check:
- How many steps are complete
- Overall progress percentage
- Quality score assessment
- Any issues or blockers

Args:
- planId: Plan ID to verify (default: current plan)
- checkType: 'progress', 'completeness', or 'quality'`

const inputSchema = lazySchema(() =>
  z.strictObject({
    planId: z.string().optional().describe('Plan ID to verify'),
    checkType: z
      .enum(['progress', 'completeness', 'quality'])
      .optional()
      .default('progress')
      .describe('Type of check to perform'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    planId: z.string().describe('The plan ID verified'),
    progress: z
      .number()
      .min(0)
      .max(100)
      .describe('Progress percentage'),
    completedSteps: z.number().describe('Number of completed steps'),
    totalSteps: z.number().describe('Total number of steps'),
    qualityScore: z.number().optional().describe('Quality score (0-10)'),
    issues: z.array(z.string()).describe('List of issues found'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const VerifyPlanExecutionTool = buildTool({
  name: VERIFY_PLAN_EXECUTION_TOOL_NAME,
  searchHint: 'verify plan execution progress completeness quality',
  maxResultSizeChars: 30_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return process.env.CLAUDE_CODE_VERIFY_PLAN === 'true'
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    return `VerifyPlanExecution ${input.checkType}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    return {
      planId: input.planId ?? 'current',
      progress: 0,
      completedSteps: 0,
      totalSteps: 0,
      qualityScore: input.checkType === 'quality' ? 0 : undefined,
      issues: [],
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)