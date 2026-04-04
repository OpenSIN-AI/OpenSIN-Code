export interface ToolDefinition { name: string; description: string; inputSchema: Record<string, unknown>; handler: (input: Record<string, unknown>) => Promise<ToolResult> }
export interface ToolResult { content: Array<{ type: string; text: string }>; isError?: boolean }
export interface ToolCall { id: string; name: string; input: Record<string, unknown>; status: 'pending' | 'running' | 'completed' | 'error'; result?: ToolResult; startedAt?: number; completedAt?: number }
export type ToolCategory = 'communication' | 'planning' | 'execution' | 'information' | 'automation' | 'utility'
