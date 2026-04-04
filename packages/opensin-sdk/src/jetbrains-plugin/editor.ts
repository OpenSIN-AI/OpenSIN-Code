/**
 * JetBrains IDE Editor API
 */

import type { JetBrainsEditorState, JetBrainsDocumentInfo } from "./types.js";
import type { ProtocolClient } from "./protocol.js";

export class EditorManager {
  private client: ProtocolClient;
  private stateListeners: Set<(state: JetBrainsEditorState) => void> = new Set();
  private caretListeners: Set<(pos: { line: number; column: number }) => void> = new Set();
  private selectionListeners: Set<(range: { start: number; end: number }) => void> = new Set();

  constructor(client: ProtocolClient) {
    this.client = client;
  }

  onStateChange(listener: (state: JetBrainsEditorState) => void): void {
    this.stateListeners.add(listener);
  }

  onCaretMove(listener: (pos: { line: number; column: number }) => void): void {
    this.caretListeners.add(listener);
  }

  onSelectionChange(listener: (range: { start: number; end: number }) => void): void {
    this.selectionListeners.add(listener);
  }

  async getState(): Promise<JetBrainsEditorState | null> {
    const state = await this.client.getEditorState();
    if (state) {
      this.stateListeners.forEach((l) => l(state));
    }
    return state;
  }

  async navigateToFile(fileUrl: string, line?: number, column?: number): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/navigate", {
      fileUrl,
      line,
      column,
    });
    return !response.error;
  }

  async replaceRange(fileUrl: string, startOffset: number, endOffset: number, newText: string): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/replace", {
      fileUrl,
      startOffset,
      endOffset,
      newText,
    });
    return !response.error;
  }

  async insertText(fileUrl: string, offset: number, text: string): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/insert", {
      fileUrl,
      offset,
      text,
    });
    return !response.error;
  }

  async foldRegion(fileUrl: string, startLine: number, endLine: number): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/fold", {
      fileUrl,
      startLine,
      endLine,
    });
    return !response.error;
  }

  async unfoldRegion(fileUrl: string, startLine: number, endLine: number): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/unfold", {
      fileUrl,
      startLine,
      endLine,
    });
    return !response.error;
  }

  async getActiveDocument(): Promise<JetBrainsDocumentInfo | null> {
    const state = await this.getState();
    return state?.activeDocument ?? null;
  }

  async setCaretPosition(fileUrl: string, line: number, column: number): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/navigate", {
      fileUrl,
      line,
      column,
    });
    if (!response.error) {
      this.caretListeners.forEach((l) => l({ line, column }));
    }
    return !response.error;
  }

  async setSelection(fileUrl: string, startOffset: number, endOffset: number): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/navigate", {
      fileUrl,
      startOffset,
      endOffset,
    });
    if (!response.error) {
      this.selectionListeners.forEach((l) => l({ start: startOffset, end: endOffset }));
    }
    return !response.error;
  }

  async getVisibleArea(): Promise<{ startLine: number; endLine: number } | null> {
    const state = await this.getState();
    return state?.visibleArea ?? null;
  }

  async setEditorMode(mode: "code" | "diff" | "preview"): Promise<boolean> {
    const response = await this.client.sendRequest("jetbrains/editor/state", { mode });
    return !response.error;
  }

  handleStateUpdate(state: JetBrainsEditorState): void {
    this.stateListeners.forEach((l) => l(state));
    this.caretListeners.forEach((l) => l(state.caretPosition));
  }
}
