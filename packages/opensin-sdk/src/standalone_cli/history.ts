/**
 * Command History — Persistent command history with up/down navigation.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const HISTORY_FILE = path.join(os.homedir(), '.opensin', 'cli_history.json');
const MAX_HISTORY = 1000;

export class CommandHistory {
  private entries: string[] = [];
  private currentIndex = -1;
  private tempInput = '';

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        this.entries = parsed.entries || [];
      }
    } catch {
      this.entries = [];
    }
  }

  save(): void {
    try {
      const dir = path.dirname(HISTORY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify({ entries: this.entries }, null, 2));
    } catch {
      // Silently fail
    }
  }

  add(command: string): void {
    const trimmed = command.trim();
    if (!trimmed) return;
    if (this.entries[this.entries.length - 1] === trimmed) return;
    this.entries.push(trimmed);
    if (this.entries.length > MAX_HISTORY) {
      this.entries = this.entries.slice(-MAX_HISTORY);
    }
    this.currentIndex = -1;
    this.save();
  }

  up(currentInput: string): string {
    if (this.entries.length === 0) return currentInput;
    if (this.currentIndex === -1) {
      this.tempInput = currentInput;
      this.currentIndex = this.entries.length - 1;
    } else if (this.currentIndex > 0) {
      this.currentIndex--;
    }
    return this.entries[this.currentIndex] || currentInput;
  }

  down(): string {
    if (this.currentIndex === -1) return '';
    if (this.currentIndex >= this.entries.length - 1) {
      this.currentIndex = -1;
      return this.tempInput;
    }
    this.currentIndex++;
    return this.entries[this.currentIndex] || '';
  }

  getEntries(): string[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries = [];
    this.currentIndex = -1;
    this.save();
  }

  get size(): number {
    return this.entries.length;
  }
}
