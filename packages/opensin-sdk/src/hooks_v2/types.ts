export interface HookResult<T> { data: T | null; loading: boolean; error: Error | null }
export interface PaginationState { page: number; pageSize: number; total: number; hasMore: boolean }
export interface SearchState { query: string; results: string[]; selectedIndex: number; isSearching: boolean }
export interface TerminalSize { columns: number; rows: number }
export interface MemoryUsage { rss: number; heapUsed: number; heapTotal: number; external: number }
export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged'
export interface DiffData { type: DiffType; line: number; content: string; oldLine?: number }
export interface TaskItem { id: string; content: string; status: 'pending' | 'active' | 'completed' | 'error'; priority: number }
export interface ScheduledTask { id: string; cronExpression: string; command: string; enabled: boolean; nextRun?: Date }
export interface TypeaheadOption { label: string; value: string; description?: string; category?: string }
export interface VirtualScrollItem { id: string; height: number; data: unknown }
