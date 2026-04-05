export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult {
  id: string
  name: string
  output: string
  isError: boolean
  duration: number
}

export interface ParallelConfig {
  maxWorkers: number
  neverParallel: Set<string>
  readOnlyTools: Set<string>
  pathScopedTools: Set<string>
}
