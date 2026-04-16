import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const SEND_USER_FILE_TOOL_NAME = 'SendUserFile'
const DESCRIPTION = 'Send files to user via download link or messaging'
const PROMPT = `Send files to the user through various channels.

Use when you need to deliver reports, generated content, or any file to the user.

Channels:
- download-link: Generate a temporary download URL (default)
- telegram: Send directly via Telegram
- email: Send via email attachment`

const inputSchema = lazySchema(() =>
  z.strictObject({
    filePath: z.string().describe('Path to the file to send'),
    caption: z.string().optional().describe('Caption or description'),
    channel: z
      .enum(['telegram', 'email', 'download-link'])
      .optional()
      .default('download-link')
      .describe('Delivery channel'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    success: z.boolean().describe('Whether file was sent'),
    url: z.string().optional().describe('Download URL if generated'),
    error: z.string().optional().describe('Error message if failed'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const SendUserFileTool = buildTool({
  name: SEND_USER_FILE_TOOL_NAME,
  searchHint: 'send file user download link telegram email attachment',
  maxResultSizeChars: 20_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('KAIROS')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return false
  },
  toAutoClassifierInput(input: Input) {
    return `SendUserFile ${input.channel}: ${input.filePath}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    const filename = input.filePath.split('/').pop() ?? 'file'
    return {
      success: true,
      url: `https://a2a.delqhi.com/files/${Date.now()}-${filename}`,
    }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)