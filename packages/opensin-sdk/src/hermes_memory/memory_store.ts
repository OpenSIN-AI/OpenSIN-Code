/**
 * OpenSIN Hermes Memory Store — TypeScript port of Hermes memory_tool.py
 *
 * Unified memory system shared between sin-hermes-agent-main (Python) and
 * OpenSIN-Code SDK (TypeScript). Both read/write the same MEMORY.md + USER.md
 * files using the same § delimiter format.
 *
 * Branded: OpenSIN/sincode
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';

export const ENTRY_DELIMITER = '\n§\n';
export const DEFAULT_MEMORY_CHAR_LIMIT = 2200;
export const DEFAULT_USER_CHAR_LIMIT = 1375;

export interface MemoryResult {
  success: boolean;
  target?: string;
  entries?: string[];
  usage?: string;
  entry_count?: number;
  message?: string;
  error?: string;
  current_entries?: string[];
  matches?: string[];
}

export interface MemorySnapshot {
  memory: string;
  user: string;
}

const MEMORY_THREAT_PATTERNS: [RegExp, string][] = [
  [/ignore\s+(previous|all|above|prior)\s+instructions/i, 'prompt_injection'],
  [/you\s+are\s+now\s+/i, 'role_hijack'],
  [/do\s+not\s+tell\s+the\s+user/i, 'deception_hide'],
  [/system\s+prompt\s+override/i, 'sys_prompt_override'],
  [/disregard\s+(your|all|any)\s+(instructions|rules|guidelines)/i, 'disregard_rules'],
  [/act\s+as\s+(if|though)\s+you\s+(have\s+no|don't\s+have)\s+(restrictions|limits|rules)/i, 'bypass_restrictions'],
  [/curl\s+[^\n]*\$\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i, 'exfil_curl'],
  [/wget\s+[^\n]*\$\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i, 'exfil_wget'],
  [/cat\s+[^\n]*(\.env|credentials|\.netrc|\.pgpass|\.npmrc|\.pypirc)/i, 'read_secrets'],
];

function scanMemoryContent(content: string): string | null {
  for (const [pattern, label] of MEMORY_THREAT_PATTERNS) {
    if (pattern.test(content)) {
      return `Rejected: potential ${label} detected in memory content.`;
    }
  }
  return null;
}

function getHermesHome(): string {
  if (process.env.HERMES_HOME) return process.env.HERMES_HOME;
  return path.join(os.homedir(), '.hermes');
}

function getMemoryDir(): string {
  return path.join(getHermesHome(), 'memories');
}

function getOpensinMemoryDir(): string {
  return path.join(os.homedir(), '.opensin', 'memories');
}

export function getUnifiedMemoryDir(): string {
  if (process.env.HERMES_MEMORY_DIR) return process.env.HERMES_MEMORY_DIR;
  if (process.env.OPENSIN_MEMORY_DIR) return process.env.OPENSIN_MEMORY_DIR;
  const hermesDir = getMemoryDir();
  const opensinDir = getOpensinMemoryDir();
  try {
    const stats = fs.statSync(hermesDir);
    if (stats.isDirectory()) return hermesDir;
  } catch {
    // Hermes dir doesn't exist yet
  }
  return opensinDir;
}

export class MemoryStore {
  memoryEntries: string[] = [];
  userEntries: string[] = [];
  memoryCharLimit: number;
  userCharLimit: number;
  private systemPromptSnapshot: MemorySnapshot = { memory: '', user: '' };
  private memoryDir: string;

  constructor(memoryCharLimit = DEFAULT_MEMORY_CHAR_LIMIT, userCharLimit = DEFAULT_USER_CHAR_LIMIT, memoryDir?: string) {
    this.memoryCharLimit = memoryCharLimit;
    this.userCharLimit = userCharLimit;
    this.memoryDir = memoryDir || getUnifiedMemoryDir();
  }

  async loadFromDisk(): Promise<void> {
    await fs.mkdir(this.memoryDir, { recursive: true });
    this.memoryEntries = await this.readFile(path.join(this.memoryDir, 'MEMORY.md'));
    this.userEntries = await this.readFile(path.join(this.memoryDir, 'USER.md'));
    this.memoryEntries = [...new Set(this.memoryEntries)];
    this.userEntries = [...new Set(this.userEntries)];
    this.systemPromptSnapshot = {
      memory: this.renderBlock('memory', this.memoryEntries),
      user: this.renderBlock('user', this.userEntries),
    };
  }

  private async readFile(filePath: string): Promise<string[]> {
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      if (!raw.trim()) return [];
      return raw.split(ENTRY_DELIMITER).map(e => e.trim()).filter(e => e.length > 0);
    } catch {
      return [];
    }
  }

  private async writeFile(filePath: string, entries: string[]): Promise<void> {
    const content = entries.length > 0 ? entries.join(ENTRY_DELIMITER) : '';
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = path.join(dir, `.mem_${crypto.randomUUID()}.tmp`);
    try {
      await fs.writeFile(tmpPath, content, 'utf-8');
      await fs.rename(tmpPath, filePath);
    } catch (e) {
      try { await fs.unlink(tmpPath); } catch { /* ignore */ }
      throw new Error(`Failed to write memory file ${filePath}: ${e}`);
    }
  }

  private entriesFor(target: string): string[] {
    return target === 'user' ? this.userEntries : this.memoryEntries;
  }

  private setEntries(target: string, entries: string[]): void {
    if (target === 'user') { this.userEntries = entries; } else { this.memoryEntries = entries; }
  }

  private charCount(target: string): number {
    const entries = this.entriesFor(target);
    return entries.length === 0 ? 0 : entries.join(ENTRY_DELIMITER).length;
  }

  private charLimit(target: string): number {
    return target === 'user' ? this.userCharLimit : this.memoryCharLimit;
  }

  private async reloadTarget(target: string): Promise<void> {
    const fresh = await this.readFile(this.pathFor(target));
    this.setEntries(target, [...new Set(fresh)]);
  }

  private pathFor(target: string): string {
    return path.join(this.memoryDir, target === 'user' ? 'USER.md' : 'MEMORY.md');
  }

  async saveToDisk(target: string): Promise<void> {
    await fs.mkdir(this.memoryDir, { recursive: true });
    await this.writeFile(this.pathFor(target), this.entriesFor(target));
  }

  async add(target: string, content: string): Promise<MemoryResult> {
    content = content.trim();
    if (!content) return { success: false, error: 'Content cannot be empty.' };
    const scanError = scanMemoryContent(content);
    if (scanError) return { success: false, error: scanError };
    await this.reloadTarget(target);
    const entries = this.entriesFor(target);
    const limit = this.charLimit(target);
    if (entries.includes(content)) return this.successResponse(target, 'Entry already exists (no duplicate added).');
    const newEntries = [...entries, content];
    const newTotal = newEntries.join(ENTRY_DELIMITER).length;
    if (newTotal > limit) {
      const current = this.charCount(target);
      return { success: false, error: `Memory at ${current.toLocaleString()}/${limit.toLocaleString()} chars. Adding this entry (${content.length} chars) would exceed the limit. Replace or remove existing entries first.`, current_entries: entries, usage: `${current.toLocaleString()}/${limit.toLocaleString()}` };
    }
    this.setEntries(target, newEntries);
    await this.saveToDisk(target);
    return this.successResponse(target, 'Entry added.');
  }

  async replace(target: string, oldText: string, newContent: string): Promise<MemoryResult> {
    oldText = oldText.trim();
    newContent = newContent.trim();
    if (!oldText) return { success: false, error: 'old_text cannot be empty.' };
    if (!newContent) return { success: false, error: 'new_content cannot be empty. Use remove to delete entries.' };
    const scanError = scanMemoryContent(newContent);
    if (scanError) return { success: false, error: scanError };
    await this.reloadTarget(target);
    const entries = this.entriesFor(target);
    const matches = entries.map((e, i) => ({ i, e })).filter(({ e }) => e.includes(oldText));
    if (matches.length === 0) return { success: false, error: `No entry matched '${oldText}'.` };
    if (matches.length > 1) {
      const uniqueTexts = new Set(matches.map(m => m.e));
      if (uniqueTexts.size > 1) {
        const previews = matches.map(m => m.e.length > 80 ? m.e.slice(0, 80) + '...' : m.e);
        return { success: false, error: `Multiple entries matched '${oldText}'. Be more specific.`, matches: previews };
      }
    }
    const idx = matches[0].i;
    const limit = this.charLimit(target);
    const testEntries = [...entries];
    testEntries[idx] = newContent;
    const newTotal = testEntries.join(ENTRY_DELIMITER).length;
    if (newTotal > limit) return { success: false, error: `Replacement would put memory at ${newTotal.toLocaleString()}/${limit.toLocaleString()} chars. Shorten the new content or remove other entries first.` };
    entries[idx] = newContent;
    this.setEntries(target, entries);
    await this.saveToDisk(target);
    return this.successResponse(target, 'Entry replaced.');
  }

  async remove(target: string, oldText: string): Promise<MemoryResult> {
    oldText = oldText.trim();
    if (!oldText) return { success: false, error: 'old_text cannot be empty.' };
    await this.reloadTarget(target);
    const entries = this.entriesFor(target);
    const matches = entries.map((e, i) => ({ i, e })).filter(({ e }) => e.includes(oldText));
    if (matches.length === 0) return { success: false, error: `No entry matched '${oldText}'.` };
    if (matches.length > 1) {
      const uniqueTexts = new Set(matches.map(m => m.e));
      if (uniqueTexts.size > 1) {
        const previews = matches.map(m => m.e.length > 80 ? m.e.slice(0, 80) + '...' : m.e);
        return { success: false, error: `Multiple entries matched '${oldText}'. Be more specific.`, matches: previews };
      }
    }
    const idx = matches[0].i;
    entries.splice(idx, 1);
    this.setEntries(target, entries);
    await this.saveToDisk(target);
    return this.successResponse(target, 'Entry removed.');
  }

  formatForSystemPrompt(target: string): string | null {
    const block = this.systemPromptSnapshot[target];
    return block || null;
  }

  getSnapshot(): MemorySnapshot {
    return { ...this.systemPromptSnapshot };
  }

  private successResponse(target: string, message?: string): MemoryResult {
    const entries = this.entriesFor(target);
    const current = this.charCount(target);
    const limit = this.charLimit(target);
    const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
    const resp: MemoryResult = { success: true, target, entries, usage: `${pct}% — ${current.toLocaleString()}/${limit.toLocaleString()} chars`, entry_count: entries.length };
    if (message) resp.message = message;
    return resp;
  }

  private renderBlock(target: string, entries: string[]): string {
    if (entries.length === 0) return '';
    const limit = this.charLimit(target);
    const content = entries.join(ENTRY_DELIMITER);
    const current = content.length;
    const pct = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
    const header = target === 'user'
      ? `USER PROFILE (who the user is) [${pct}% — ${current.toLocaleString()}/${limit.toLocaleString()} chars]`
      : `MEMORY (your personal notes) [${pct}% — ${current.toLocaleString()}/${limit.toLocaleString()} chars]`;
    const separator = '═'.repeat(46);
    return `${separator}\n${header}\n${separator}\n${content}`;
  }
}

export function createMemoryStore(memoryDir?: string): MemoryStore {
  return new MemoryStore(DEFAULT_MEMORY_CHAR_LIMIT, DEFAULT_USER_CHAR_LIMIT, memoryDir);
}
