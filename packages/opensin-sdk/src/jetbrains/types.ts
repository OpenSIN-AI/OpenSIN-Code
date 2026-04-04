/**
 * JetBrains IDE Plugin Types — Multi-IDE Support like Windsurf JetBrains
 */

export interface JetBrainsPluginInfo {
  pluginId: string;
  name: string;
  version: string;
  ideName: string;
  ideVersion: string;
  platform: string;
}

export interface JetBrainsConnectionConfig {
  host: string;
  port: number;
  protocol: "http" | "https" | "ws" | "wss";
  authToken?: string;
  timeoutMs: number;
}

export interface JetBrainsDocumentInfo {
  fileUrl: string;
  fileName: string;
  language: string;
  content: string;
  cursorOffset: number;
  selectionStart: number;
  selectionEnd: number;
  modified: boolean;
}

export interface JetBrainsEditorState {
  activeDocument: JetBrainsDocumentInfo | null;
  openDocuments: string[];
  caretPosition: { line: number; column: number };
  visibleArea: { startLine: number; endLine: number };
}

export interface JetBrainsProjectInfo {
  name: string;
  basePath: string;
  modules: JetBrainsModuleInfo[];
  vcsRoots: string[];
}

export interface JetBrainsModuleInfo {
  name: string;
  contentRoots: string[];
  type: string;
}

export interface JetBrainsActionRequest {
  actionId: string;
  parameters?: Record<string, unknown>;
}

export interface JetBrainsActionResponse {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface JetBrainsNotification {
  type: "info" | "warning" | "error";
  title: string;
  message: string;
  actions?: string[];
}

export interface JetBrainsToolWindow {
  id: string;
  title: string;
  content: string;
  anchor: "left" | "right" | "bottom" | "top";
  visible: boolean;
}

export interface JetBrainsProtocolMessage {
  jsonrpc: "2.0";
  method: string;
  params?: Record<string, unknown>;
  id?: number | string;
}

export interface JetBrainsProtocolResponse {
  jsonrpc: "2.0";
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  id?: number | string;
}

export type JetBrainsEventType =
  | "document.opened"
  | "document.closed"
  | "document.changed"
  | "document.saved"
  | "editor.caret.moved"
  | "editor.selection.changed"
  | "project.opened"
  | "project.closed"
  | "toolwindow.shown"
  | "toolwindow.hidden";

export interface JetBrainsEvent {
  type: JetBrainsEventType;
  timestamp: string;
  data: Record<string, unknown>;
}
