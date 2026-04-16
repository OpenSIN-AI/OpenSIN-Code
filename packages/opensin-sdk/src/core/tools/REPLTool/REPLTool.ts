import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const REPL_TOOL_NAME = 'REPL'
const DESCRIPTION = 'Interactive REPL mode for code execution'
const PROMPT = `Enter interactive REPL mode to execute code snippets and inspect results.

Languages: javascript, typescript, python, bash

In REPL mode, only safe tools are available: Bash, Glob, Grep, Read, Write, Edit`

const inputSchema = lazySchema(() =>
  z.strictObject({
    code: z.string().describe('Code to execute'),
    language: z
      .enum(['javascript', 'typescript', 'python', 'bash'])
      .optional()
      .default('javascript')
      .describe('Language for execution'),
    context: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Context variables to pass'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    result: z.string().describe('Execution result'),
    error: z.string().optional().describe('Error if execution failed'),
    executionTime: z.number().describe('Execution time in ms'),
    context: z
      .record(z.string(), z.unknown())
      .describe('Updated context'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const REPLTool = buildTool({
  name: REPL_TOOL_NAME,
  searchHint: 'repl code execution javascript typescript python bash',
  maxResultSizeChars: 100_000,
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
    return false
  },
  isReadOnly(input: Input) {
    return input.language === 'bash' && !input.code.includes('rm')
  },
  toAutoClassifierInput(input: Input) {
    return `REPL ${input.language}: ${input.code.slice(0, 50)}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    const startTime = Date.now()
    return {
      result: '',
      executionTime: Date.now() - startTime,
      context: input.context ?? {},
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)