import type { ToolCall, ToolResult, ParallelConfig } from './types'

const DEFAULT_CONFIG: ParallelConfig = {
  maxWorkers: 8,
  neverParallel: new Set(['clarify']),
  readOnlyTools: new Set(['read_file', 'search_files', 'glob', 'grep']),
  pathScopedTools: new Set(['read_file', 'write_file', 'edit']),
}

export class ParallelToolExecutor {
  private config: ParallelConfig

  constructor(config?: Partial<ParallelConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  shouldParallelize(calls: ToolCall[]): boolean {
    if (calls.length <= 1) return false
    if (calls.some((c) => this.config.neverParallel.has(c.name))) return false
    const reservedPaths = new Set<string>()
    for (const call of calls) {
      if (this.config.readOnlyTools.has(call.name)) continue
      if (this.config.pathScopedTools.has(call.name)) {
        const path = this.extractPath(call.input)
        if (!path) return false
        if (reservedPaths.has(path)) return false
        reservedPaths.add(path)
        continue
      }
      return false
    }
    return true
  }

  async executeParallel(calls: ToolCall[], handler: (call: ToolCall) => Promise<ToolResult>): Promise<ToolResult[]> {
    const results: ToolResult[] = []
    if (!this.shouldParallelize(calls)) {
      for (const call of calls) {
        const start = Date.now()
        try {
          const result = await handler(call)
          results.push({ ...result, duration: Date.now() - start })
        } catch (error) {
          results.push({ id: call.id, name: call.name, output: error instanceof Error ? error.message : String(error), isError: true, duration: Date.now() - start })
        }
      }
      return results
    }
    const chunks: ToolCall[][] = []
    for (let i = 0; i < calls.length; i += this.config.maxWorkers) chunks.push(calls.slice(i, i + this.config.maxWorkers))
    for (const chunk of chunks) {
      const promises = chunk.map(async (call) => {
        const start = Date.now()
        try {
          const result = await handler(call)
          return { ...result, duration: Date.now() - start }
        } catch (error) {
          return { id: call.id, name: call.name, output: error instanceof Error ? error.message : String(error), isError: true, duration: Date.now() - start }
        }
      })
      results.push(...await Promise.all(promises))
    }
    return results
  }

  private extractPath(input: Record<string, unknown>): string | null {
    return (input.path ?? input.file ?? input.filePath) as string | null
  }
}

export function createParallelExecutor(config?: Partial<ParallelConfig>): ParallelToolExecutor { return new ParallelToolExecutor(config) }
