/**
 * JetBrains IDE Plugin Types — Full IDE support like Windsurf/Kilo Code
 */

export interface JetBrainsPluginInfo {
  pluginId: string;
  name: string;
  version: string;
  ideName: string;
  ideVersion: string;
  platform: string;
  supportedFeatures: string[];
}

export interface JetBrainsConnectionConfig {
  host: string;
  port: number;
  protocol: "http" | "https" | "ws" | "wss";
  authToken?: string;
  timeoutMs: number;
  reconnectAttempts: number;
  reconnectDelayMs: number;
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
  encoding: string;
  lineSeparator: string;
}

export interface JetBrainsEditorState {
  activeDocument: JetBrainsDocumentInfo | null;
  openDocuments: string[];
  caretPosition: { line: number; column: number };
  visibleArea: { startLine: number; endLine: number };
  splitMode: boolean;
  editorMode: "code" | "diff" | "preview";
}

export interface JetBrainsProjectInfo {
  name: string;
  basePath: string;
  modules: JetBrainsModuleInfo[];
  vcsRoots: string[];
  sdkName: string;
  languageLevel: string;
}

export interface JetBrainsModuleInfo {
  name: string;
  contentRoots: string[];
  type: string;
  dependencies: string[];
}

export interface JetBrainsTerminalState {
  terminalId: string;
  title: string;
  workingDirectory: string;
  shellType: string;
  running: boolean;
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
  icon?: string;
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
  | "editor.split.changed"
  | "project.opened"
  | "project.closed"
  | "project.modules.changed"
  | "toolwindow.shown"
  | "toolwindow.hidden"
  | "terminal.created"
  | "terminal.closed"
  | "run.configuration.started"
  | "run.configuration.stopped"
  | "vcs.branch.changed"
  | "vcs.status.changed";

export interface JetBrainsEvent {
  type: JetBrainsEventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface JetBrainsFileChange {
  fileUrl: string;
  changeType: "added" | "modified" | "deleted" | "renamed";
  oldFileUrl?: string;
  content?: string;
  timestamp: number;
}

export interface JetBrainsLifecycleState {
  phase: "initializing" | "ready" | "shutting_down" | "terminated";
  startTime: number;
  lastActivity: number;
  connectionStatus: "disconnected" | "connecting" | "connected" | "reconnecting";
  errorCount: number;
  lastError?: string;
}
