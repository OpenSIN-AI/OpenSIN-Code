export interface MemoryEntry {
  id: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  accessCount: number;
  importance: number;
}

export interface MemoryConfig {
  maxEntries: number;
  maxEntriesPerCategory: number;
  minImportance: number;
  autoConsolidate: boolean;
}

export interface MemoryQuery {
  category?: string;
  minImportance?: number;
  limit?: number;
  search?: string;
}
