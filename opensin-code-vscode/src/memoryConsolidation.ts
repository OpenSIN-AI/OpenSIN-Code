import * as vscode from 'vscode';

export interface MemoryEntry {
  id: string;
  timestamp: number;
  type: 'code_change' | 'decision' | 'context' | 'error' | 'insight';
  content: string;
  filePath?: string;
  tags: string[];
}

export interface MemorySummary {
  id: string;
  timestamp: number;
  topic: string;
  entries: string[];
  keyDecisions: string[];
  context: string;
}

export class MemoryConsolidation {
  private entries: MemoryEntry[];
  private summaries: MemorySummary[];
  private context: vscode.ExtensionContext;
  private outputChannel: vscode.OutputChannel;
  private autoConsolidateTimer: vscode.Disposable | null = null;

  constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    this.context = context;
    this.outputChannel = outputChannel;
    this.entries = (context.workspaceState.get<MemoryEntry[]>('opensin.memory.entries') || []);
    this.summaries = (context.workspaceState.get<MemorySummary[]>('opensin.memory.summaries') || []);
  }

  addEntry(entry: Omit<MemoryEntry, 'id' | 'timestamp'>): MemoryEntry {
    const fullEntry: MemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now()
    };

    this.entries.push(fullEntry);
    this.persistEntries();
    this.outputChannel.appendLine(`[${new Date().toISOString()}] MEMORY ENTRY: ${fullEntry.type} — ${fullEntry.content.substring(0, 80)}...`);
    return fullEntry;
  }

  async consolidate(): Promise<{ consolidatedCount: number; summaryCount: number } | undefined> {
    if (this.entries.length === 0) {
      return undefined;
    }

    const entriesToConsolidate = [...this.entries];
    this.entries = [];
    this.persistEntries();

    const groupedByType = new Map<string, MemoryEntry[]>();
    for (const entry of entriesToConsolidate) {
      const group = groupedByType.get(entry.type) || [];
      group.push(entry);
      groupedByType.set(entry.type, group);
    }

    const newSummaries: MemorySummary[] = [];
    for (const [type, groupEntries] of groupedByType) {
      const summary: MemorySummary = {
        id: `summary-${Date.now()}-${type}`,
        timestamp: Date.now(),
        topic: `${type} session (${groupEntries.length} entries)`,
        entries: groupEntries.map(e => e.content),
        keyDecisions: groupEntries
          .filter(e => e.type === 'decision' || e.type === 'insight')
          .map(e => e.content),
        context: groupEntries
          .filter(e => e.type === 'context')
          .map(e => e.content)
          .join('\n')
      };
      newSummaries.push(summary);
    }

    this.summaries.push(...newSummaries);
    this.persistSummaries();

    this.outputChannel.appendLine(
      `[${new Date().toISOString()}] MEMORY CONSOLIDATED: ${entriesToConsolidate.length} entries → ${newSummaries.length} summaries`
    );

    return {
      consolidatedCount: entriesToConsolidate.length,
      summaryCount: newSummaries.length
    };
  }

  getRecentEntries(count: number = 20): MemoryEntry[] {
    return this.entries
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count);
  }

  getSummaries(): MemorySummary[] {
    return this.summaries;
  }

  searchEntries(query: string): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.entries.filter(
      e => e.content.toLowerCase().includes(lowerQuery) ||
           e.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
           (e.filePath && e.filePath.toLowerCase().includes(lowerQuery))
    );
  }

  getMemoryCount(): number {
    return this.entries.length + this.summaries.length;
  }

  healthCheck(): boolean {
    try {
      this.context.workspaceState.get('opensin.memory.entries');
      return true;
    } catch {
      return false;
    }
  }

  setupAutoConsolidation(): void {
    const autoConsolidate = vscode.workspace.getConfiguration('opensin').get('memoryAutoConsolidate', true);
    if (!autoConsolidate) return;

    const onWillSave = vscode.workspace.onWillSaveTextDocument(async (e) => {
      const doc = e.document;
      if (doc.uri.scheme === 'file') {
        this.addEntry({
          type: 'code_change',
          content: `Saved: ${doc.fileName}`,
          filePath: doc.fileName,
          tags: ['save', doc.languageId]
        });
      }
    });

    const onTerminalOutput = vscode.window.onDidOpenTerminal((terminal) => {
      if (terminal.name === 'OpenSIN CLI') {
        this.addEntry({
          type: 'context',
          content: `Terminal opened: ${terminal.name}`,
          tags: ['terminal']
        });
      }
    });

    this.context.subscriptions.push(onWillSave, onTerminalOutput);
    this.outputChannel.appendLine(`[${new Date().toISOString()}] AUTO-CONSOLIDATION ENABLED`);
  }

  private persistEntries(): void {
    this.context.workspaceState.update('opensin.memory.entries', this.entries);
  }

  private persistSummaries(): void {
    this.context.workspaceState.update('opensin.memory.summaries', this.summaries);
  }

  clearAll(): void {
    this.entries = [];
    this.summaries = [];
    this.persistEntries();
    this.persistSummaries();
    this.outputChannel.appendLine(`[${new Date().toISOString()}] MEMORY CLEARED`);
  }
}
