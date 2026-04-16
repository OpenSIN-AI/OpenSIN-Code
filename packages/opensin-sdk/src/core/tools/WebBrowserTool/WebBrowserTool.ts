import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const WEB_BROWSER_TOOL_NAME = 'WebBrowser'
const DESCRIPTION = 'Navigate and interact with web pages'
const PROMPT = `Navigate and interact with web pages using native browser automation.

Actions:
- navigate: Go to a URL
- click: Click an element by selector
- type: Type text into an element
- screenshot: Capture the current page
- extract: Extract content from the page
- evaluate: Run JavaScript on the page

Use webauto-nodriver-mcp for browser automation.`

const inputSchema = lazySchema(() =>
  z.strictObject({
    action: z
      .enum(['navigate', 'click', 'type', 'screenshot', 'extract', 'evaluate'])
      .describe('Browser action to perform'),
    url: z.string().url().optional().describe('URL for navigate action'),
    selector: z.string().optional().describe('CSS selector for click/type'),
    text: z.string().optional().describe('Text to type'),
    script: z.string().optional().describe('JavaScript to evaluate'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether action succeeded'),
    data: z.string().optional().describe('Extracted data or result'),
    error: z.string().optional().describe('Error message if failed'),
    screenshot: z.string().optional().describe('Base64 screenshot if captured'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const WebBrowserTool = buildTool({
  name: WEB_BROWSER_TOOL_NAME,
  searchHint: 'web browser navigate click extract screenshot automation',
  maxResultSizeChars: 100_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('WEB_BROWSER_TOOL')
  },
  isConcurrencySafe() {
    return false
  },
  isReadOnly(input: Input) {
    return input.action === 'navigate' || input.action === 'screenshot' || input.action === 'extract'
  },
  toAutoClassifierInput(input: Input) {
    return `WebBrowser ${input.action}${input.url ? ` ${input.url}` : ''}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    return {
      success: false,
      error: `WebBrowserTool: ${input.action} — use webauto-nodriver-mcp for browser automation`,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)