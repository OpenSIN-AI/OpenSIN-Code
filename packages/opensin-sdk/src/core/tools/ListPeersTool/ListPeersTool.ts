import { feature } from 'bun:bundle'
import { z } from 'zod/v4'
import type { ToolUseContext } from '../../Tool'
import { buildTool, type ToolDef } from '../../Tool'
import { lazySchema } from '../../utils/lazySchema'

const LIST_PEERS_TOOL_NAME = 'ListPeers'
const DESCRIPTION = 'Discover other agents/peers in the A2A network'
const PROMPT = `Discover and list other agents/peers available in the network.

Use to find:
- Available A2A agents
- Their capabilities and status
- Filter by capability or status

Args:
- filter.capability: Filter by capability (e.g., 'ui', 'api', 'design')
- filter.status: Filter by status ('online', 'offline', 'busy')`

const inputSchema = lazySchema(() =>
  z.strictObject({
    filter: z
      .strictObject({
        capability: z.string().optional().describe('Filter by capability'),
        status: z.enum(['online', 'offline', 'busy']).optional().describe('Filter by status'),
      })
      .optional()
      .describe('Filter criteria'),
  }),
)

const outputSchema = lazySchema(() =>
  z.object({
    peers: z
      .array(
        z.object({
          id: z.string().describe('Peer identifier'),
          name: z.string().describe('Peer name'),
          capabilities: z
            .array(z.string())
            .describe('List of capabilities'),
          status: z
            .enum(['online', 'offline', 'busy'])
            .describe('Current status'),
          lastSeen: z.string().describe('ISO timestamp of last activity'),
        }),
      )
      .describe('List of matching peers'),
  }),
)

type Input = z.infer<ReturnType<typeof inputSchema>>
type Output = z.infer<ReturnType<typeof outputSchema>>

export const ListPeersTool = buildTool({
  name: LIST_PEERS_TOOL_NAME,
  searchHint: 'list peers agents discover network a2a',
  maxResultSizeChars: 40_000,
  get inputSchema() {
    return inputSchema()
  },
  get outputSchema() {
    return outputSchema()
  },
  isEnabled() {
    return feature('UDS_INBOX')
  },
  isConcurrencySafe() {
    return true
  },
  isReadOnly() {
    return true
  },
  toAutoClassifierInput(input: Input) {
    const f = input.filter
    return `ListPeers${f?.capability ? ` ${f.capability}` : ''}${f?.status ? ` ${f.status}` : ''}`
  },
  async description() {
    return DESCRIPTION
  },
  async prompt() {
    return PROMPT
  },
  async call(input: Input, _context: ToolUseContext) {
    const now = new Date().toISOString()
    const allPeers = [
      { id: 'a2a-sin-frontend', name: 'A2A-SIN-Frontend', capabilities: ['ui', 'design', 'frontend'], status: 'online' as const, lastSeen: now },
      { id: 'a2a-sin-backend', name: 'A2A-SIN-Backend', capabilities: ['api', 'database', 'backend'], status: 'online' as const, lastSeen: now },
    ]

    let filtered = allPeers
    if (input.filter?.capability) {
      filtered = filtered.filter(p =>
        p.capabilities.some(c =>
          c.toLowerCase().includes(input.filter!.capability!.toLowerCase()),
        ),
      )
    }
    if (input.filter?.status) {
      filtered = filtered.filter(p => p.status === input.filter!.status)
    }

    return { peers: filtered }
  },
} satisfies ToolDef<ReturnType<typeof inputSchema>, ReturnType<typeof outputSchema>>)