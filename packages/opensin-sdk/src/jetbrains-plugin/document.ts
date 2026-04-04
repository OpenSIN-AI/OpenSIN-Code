/**
 * JetBrains IDE Document API
 */

import type { JetBrainsDocumentInfo, JetBrainsFileChange } from "./types.js";
import type { ProtocolClient } from "./protocol.js";

export class DocumentManager {
  private client: ProtocolClient;
  private documentCache = new Map<string, JetBrainsDocumentInfo>();
  private changeListeners: Set<(change: JetBrainsFileChange) => void> = new Set();
  private openListeners: Set<(doc: JetBrainsDocumentInfo) => void> = new Set();
  private closeListeners: Set<(fileUrl: string) => void> = new Set();

  constructor(client: ProtocolClient) {
    this.client = client;
  }

  onDocumentChange(listener: (change: JetBrainsFileChange) => void): void {
    this.changeListeners.add(listener);
  }

  onDocumentOpen(listener: (doc: JetBrainsDocumentInfo) => void): void {
    this.openListeners.add(listener);
  }

  onDocumentClose(listener: (fileUrl: string) => void): void {
    this.closeListeners.add(listener);
  }

  async getDocument(fileUrl: string, useCache = true): Promise<JetBrainsDocumentInfo | null> {
    if (useCache && this.documentCache.has(fileUrl)) {
      return this.documentCache.get(fileUrl) ?? null;
    }

    const doc = await this.client.getDocument(fileUrl);
    if (doc) {
      this.documentCache.set(fileUrl, doc);
    }
    return doc;
  }

  async listDocuments(): Promise<string[]> {
    return this.client.listDocuments();
  }

  async updateDocument(fileUrl: string, content: string, applyDiff = false): Promise<boolean> {
    const success = await this.client.updateDocument(fileUrl, content, applyDiff);
    if (success) {
      this.documentCache.delete(fileUrl);
      this.notifyChange({
        fileUrl,
        changeType: "modified",
        content,
        timestamp: Date.now(),
      });
    }
    return success;
  }

  async applyDiff(fileUrl: string, diff: string): Promise<boolean> {
    const doc = await this.getDocument(fileUrl);
    if (!doc) return false;

    const lines = doc.content.split("\n");
    const diffLines = diff.split("\n");
    let currentLine = 0;
    const result: string[] = [];

    for (const line of diffLines) {
      if (line.startsWith("---") || line.startsWith("+++") || line.startsWith("@@")) {
        if (line.startsWith("@@")) {
          const match = line.match(/-(\d+)/);
          if (match) {
            const targetLine = parseInt(match[1], 10) - 1;
            while (currentLine < targetLine && currentLine < lines.length) {
              result.push(lines[currentLine++]);
            }
          }
        }
        continue;
      }
      if (line.startsWith("-")) {
        currentLine++;
      } else if (line.startsWith("+")) {
        result.push(line.slice(1));
      } else {
        if (currentLine < lines.length) {
          result.push(lines[currentLine++]);
        }
      }
    }

    while (currentLine < lines.length) {
      result.push(lines[currentLine++]);
    }

    return this.updateDocument(fileUrl, result.join("\n"));
  }

  async saveDocument(fileUrl: string): Promise<boolean> {
    const success = await this.client.saveDocument(fileUrl);
    if (success) {
      this.documentCache.delete(fileUrl);
    }
    return success;
  }

  async createDocument(fileUrl: string, content: string, language?: string): Promise<boolean> {
    const success = await this.client.updateDocument(fileUrl, content);
    if (success) {
      const doc: JetBrainsDocumentInfo = {
        fileUrl,
        fileName: fileUrl.split("/").pop() ?? "",
        language: language ?? this.detectLanguage(fileUrl),
        content,
        cursorOffset: 0,
        selectionStart: 0,
        selectionEnd: 0,
        modified: true,
        encoding: "utf-8",
        lineSeparator: "\n",
      };
      this.documentCache.set(fileUrl, doc);
      this.notifyChange({ fileUrl, changeType: "added", content, timestamp: Date.now() });
      this.openListeners.forEach((l) => l(doc));
    }
    return success;
  }

  async deleteDocument(fileUrl: string): Promise<boolean> {
    this.documentCache.delete(fileUrl);
    this.notifyChange({ fileUrl, changeType: "deleted", timestamp: Date.now() });
    this.closeListeners.forEach((l) => l(fileUrl));
    return true;
  }

  async getOpenDocuments(): Promise<JetBrainsDocumentInfo[]> {
    const urls = await this.listDocuments();
    const docs: JetBrainsDocumentInfo[] = [];
    for (const url of urls) {
      const doc = await this.getDocument(url);
      if (doc) docs.push(doc);
    }
    return docs;
  }

  clearCache(): void {
    this.documentCache.clear();
  }

  private notifyChange(change: JetBrainsFileChange): void {
    this.changeListeners.forEach((l) => l(change));
  }

  private detectLanguage(fileUrl: string): string {
    const ext = fileUrl.split(".").pop()?.toLowerCase() ?? "";
    const langMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript JSX",
      js: "JavaScript",
      jsx: "JavaScript JSX",
      py: "Python",
      java: "Java",
      kt: "Kotlin",
      go: "Go",
      rs: "Rust",
      rb: "Ruby",
      php: "PHP",
      cs: "C#",
      cpp: "C++",
      c: "C",
      h: "C Header",
      html: "HTML",
      css: "CSS",
      scss: "SCSS",
      json: "JSON",
      xml: "XML",
      yaml: "YAML",
      yml: "YAML",
      md: "Markdown",
      sql: "SQL",
      sh: "Shell",
      bash: "Bash",
    };
    return langMap[ext] ?? "Unknown";
  }
}
