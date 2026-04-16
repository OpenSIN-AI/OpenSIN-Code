import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const WORKFLOW_TOOL_NAME = 'Workflow'
const DESCRIPTION = 'Execute bundled workflows (create-react-app, setup-ci, etc.)'
const PROMPT = `Execute bundled workflow scripts for common tasks.

Available workflows:
- create-react-app: Create a new React app with TypeScript
- setup-ci: Setup CI/CD pipeline
- init-monorepo: Initialize a monorepo with workspaces

Args:
- workflow: Name of the workflow to run
- params: Key-value parameters for the workflow`

const inputSchema = lazySchema(() =>
  z.strictObject({
    workflow: z.string().describe('Name of the workflow to execute'),
    params: z
      .record(z.string(), z.string())
      .optional()
      .describe('Workflow parameters'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether workflow succeeded'),
    output: z.string().describe('Workflow output log'),
    filesCreated: z
      .array(z.string())
      .describe('Files created by workflow'),
    nextSteps: z
      .array(z.string())
      .describe('Suggested next steps'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

const BUNDLED_WORKFLOWS: Record<
  string,
  { description: string; steps: string[] }
> = {
  'create-react-app': {
    description: 'Create a new React app with TypeScript and testing',
    steps: ['bun create vite my-app --template react-ts', 'cd my-app', 'bun install'],
  },
  'setup-ci': {
    description: 'Setup CI/CD pipeline for the project',
    steps: ['mkdir -p .github/workflows', 'create workflow file'],
  },
  'init-monorepo': {
    description: 'Initialize a monorepo with workspaces',
    steps: ['create package.json with workspaces', 'create tsconfig.json', 'add shared config'],
  },
}

export const WorkflowTool = buildTool({
  name: WORKFLOW_TOOL_NAME,
  searchHint: 'workflow execute script create-react-app setup-ci init-monorepo',
  maxResultSizeChars: 50_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('WORKFLOW_SCRIPTS')
  },
  isConcurrencySafe() {
    return false
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input: Input) {
    return `Workflow ${input.workflow}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    const wf = BUNDLED_WORKFLOWS[input.workflow]
    if (!wf) {
      return {
        success: false,
        output: `Unknown workflow: ${input.workflow}`,
        filesCreated: [],
        nextSteps: [],
      }
    }
    return {
      success: true,
      output: `Workflow: ${wf.description}\nSteps:\n${wf.steps.join('\n')}`,
      filesCreated: [],
      nextSteps: wf.steps.slice(1),
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)