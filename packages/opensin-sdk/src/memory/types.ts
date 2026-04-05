export interface MemoryEntry {
  id: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
  accessCount: number
  importance: number
}

export interface MemoryProvider {
  save(entry: MemoryEntry): Promise<void>
  load(id: string): Promise<MemoryEntry | null>
  search(query: string, limit?: number): Promise<MemoryEntry[]>
  delete(id: string): Promise<boolean>
  list(tags?: string[], limit?: number): Promise<MemoryEntry[]>
}
