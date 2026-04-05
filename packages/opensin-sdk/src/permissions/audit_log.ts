import { AuditEntry } from './types';

export class AuditLogger {
  private entries: AuditEntry[];

  constructor() {
    this.entries = [];
  }

  log(entry: AuditEntry): void {
    this.entries.push(entry);
  }

  getAll(): AuditEntry[] {
    return [...this.entries];
  }

  getByTool(toolName: string): AuditEntry[] {
    return this.entries.filter(e => e.toolName === toolName);
  }

  getByDecision(decision: string): AuditEntry[] {
    return this.entries.filter(e => e.decision === decision);
  }

  getSummary(): { total: number; allowed: number; denied: number; asked: number } {
    return {
      total: this.entries.length,
      allowed: this.entries.filter(e => e.decision === 'allow').length,
      denied: this.entries.filter(e => e.decision === 'deny').length,
      asked: this.entries.filter(e => e.decision === 'ask').length,
    };
  }

  clear(): void {
    this.entries = [];
  }
}
