/**
 * JetBrains IDE Plugin Protocol — JSON-RPC protocol for IDE communication
 */

import type {
  JetBrainsProtocolMessage,
  JetBrainsProtocolResponse,
  JetBrainsConnectionConfig,
  JetBrainsDocumentInfo,
  JetBrainsEditorState,
  JetBrainsProjectInfo,
  JetBrainsActionResponse,
  JetBrainsNotification,
  JetBrainsToolWindow,
  JetBrainsTerminalState,
} from "./types.js";

export const PROTOCOL_VERSION = "2.0.0";

export const METHODS = {
  INITIALIZE: "jetbrains/initialize",
  SHUTDOWN: "jetbrains/shutdown",
  PING: "jetbrains/ping",

  DOCUMENT_GET: "jetbrains/document/get",
  DOCUMENT_LIST: "jetbrains/document/list",
  DOCUMENT_UPDATE: "jetbrains/document/update",
  DOCUMENT_SAVE: "jetbrains/document/save",
  DOCUMENT_CREATE: "jetbrains/document/create",
  DOCUMENT_DELETE: "jetbrains/document/delete",
  DOCUMENT_DIFF: "jetbrains/document/diff",

  EDITOR_STATE: "jetbrains/editor/state",
  EDITOR_NAVIGATE: "jetbrains/editor/navigate",
  EDITOR_REPLACE: "jetbrains/editor/replace",
  EDITOR_INSERT: "jetbrains/editor/insert",
  EDITOR_FOLD: "jetbrains/editor/fold",
  EDITOR_UNFOLD: "jetbrains/editor/unfold",

  PROJECT_INFO: "jetbrains/project/info",
  PROJECT_SEARCH: "jetbrains/project/search",
  PROJECT_FILE_TREE: "jetbrains/project/fileTree",
  PROJECT_SETTINGS: "jetbrains/project/settings",

  TERMINAL_CREATE: "jetbrains/terminal/create",
  TERMINAL_EXECUTE: "jetbrains/terminal/execute",
  TERMINAL_CLOSE: "jetbrains/terminal/close",
  TERMINAL_LIST: "jetbrains/terminal/list",

  ACTION_EXECUTE: "jetbrains/action/execute",
  ACTION_LIST: "jetbrains/action/list",

  NOTIFICATION_SHOW: "jetbrains/notification/show",
  NOTIFICATION_DISMISS: "jetbrains/notification/dismiss",

  TOOLWINDOW_CREATE: "jetbrains/toolwindow/create",
  TOOLWINDOW_UPDATE: "jetbrains/toolwindow/update",
  TOOLWINDOW_HIDE: "jetbrains/toolwindow/hide",

  EVENTS_SUBSCRIBE: "jetbrains/events/subscribe",
  EVENTS_UNSUBSCRIBE: "jetbrains/events/unsubscribe",

  VCS_STATUS: "jetbrains/vcs/status",
  VCS_BRANCH: "jetbrains/vcs/branch",
  VCS_COMMIT: "jetbrains/vcs/commit",
} as const;

export class ProtocolClient {
  private messageId = 0;
  private config: JetBrainsConnectionConfig;
  private pendingRequests = new Map<
    number | string,
    {
      resolve: (value: JetBrainsProtocolResponse) => void;
      reject: (error: Error) => void;
      timeout: ReturnType<typeof setTimeout>;
    }
  >();
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectCount = 0;
  private onMessage?: (message: unknown) => void;
  private onEvent?: (event: unknown) => void;

  constructor(config: JetBrainsConnectionConfig) {
    this.config = config;
  }

  setOnMessage(handler: (message: unknown) => void): void {
    this.onMessage = handler;
  }

  setOnEvent(handler: (event: unknown) => void): void {
    this.onEvent = handler;
  }

  createMessage(method: string, params?: Record<string, unknown>): JetBrainsProtocolMessage {
    const id = ++this.messageId;
    return { jsonrpc: "2.0", method, params, id };
  }

  createResponse(id: number | string, result: unknown): JetBrainsProtocolResponse {
    return { jsonrpc: "2.0", result, id };
  }

  createErrorResponse(id: number | string, code: number, message: string, data?: unknown): JetBrainsProtocolResponse {
    return { jsonrpc: "2.0", error: { code, message, data }, id };
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      const url = `${this.config.protocol}://${this.config.host}:${this.config.port}/opensin`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.reconnectCount = 0;
        resolve(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.id && this.pendingRequests.has(data.id)) {
            this.handleResponse(data);
          } else if (this.onMessage) {
            this.onMessage(data);
          } else if (data.method && data.method.startsWith("jetbrains/event")) {
            this.onEvent?.(data.params);
          }
        } catch {
          /* ignore parse errors */
        }
      };

      this.ws.onclose = () => {
        this.handleReconnect();
      };

      this.ws.onerror = () => {
        resolve(false);
      };
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.pendingRequests.forEach((p) => clearTimeout(p.timeout));
    this.pendingRequests.clear();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async sendRequest(method: string, params?: Record<string, unknown>): Promise<JetBrainsProtocolResponse> {
    const message = this.createMessage(method, params);
    const id = message.id!;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request ${id} timed out after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      this.pendingRequests.set(id, { resolve, reject, timeout });
      this.sendMessage(message);
    });
  }

  private handleResponse(response: JetBrainsProtocolResponse): void {
    if (response.id === undefined) return;
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(response.error.message));
    } else {
      pending.resolve(response);
    }
  }

  private sendMessage(message: JetBrainsProtocolMessage): void {
    const payload = JSON.stringify(message);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      throw new Error("WebSocket connection is not open");
    }
  }

  private handleReconnect(): void {
    if (this.reconnectCount >= this.config.reconnectAttempts) return;
    this.reconnectCount++;
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(() => {});
    }, this.config.reconnectDelayMs);
  }

  async initialize(pluginInfo: Record<string, string>): Promise<JetBrainsProtocolResponse> {
    return this.sendRequest(METHODS.INITIALIZE, {
      protocolVersion: PROTOCOL_VERSION,
      ...pluginInfo,
    });
  }

  async shutdown(): Promise<JetBrainsProtocolResponse> {
    return this.sendRequest(METHODS.SHUTDOWN);
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.sendRequest(METHODS.PING);
      return !res.error;
    } catch {
      return false;
    }
  }

  async getDocument(fileUrl: string): Promise<JetBrainsDocumentInfo | null> {
    const response = await this.sendRequest(METHODS.DOCUMENT_GET, { fileUrl });
    return (response.result as JetBrainsDocumentInfo) ?? null;
  }

  async listDocuments(): Promise<string[]> {
    const response = await this.sendRequest(METHODS.DOCUMENT_LIST);
    return (response.result as string[]) ?? [];
  }

  async updateDocument(fileUrl: string, content: string, applyDiff = false): Promise<boolean> {
    const response = await this.sendRequest(METHODS.DOCUMENT_UPDATE, { fileUrl, content, applyDiff });
    return !(response as any).error;
  }

  async saveDocument(fileUrl: string): Promise<boolean> {
    const response = await this.sendRequest(METHODS.DOCUMENT_SAVE, { fileUrl });
    return !(response as any).error;
  }

  async getEditorState(): Promise<JetBrainsEditorState | null> {
    const response = await this.sendRequest(METHODS.EDITOR_STATE);
    return (response.result as JetBrainsEditorState) ?? null;
  }

  async getProjectInfo(): Promise<JetBrainsProjectInfo | null> {
    const response = await this.sendRequest(METHODS.PROJECT_INFO);
    return (response.result as JetBrainsProjectInfo) ?? null;
  }

  async executeAction(actionId: string, parameters?: Record<string, unknown>): Promise<JetBrainsActionResponse> {
    const response = await this.sendRequest(METHODS.ACTION_EXECUTE, { actionId, parameters });
    return response.result as JetBrainsActionResponse;
  }

  async showNotification(notification: JetBrainsNotification): Promise<void> {
    await this.sendRequest(METHODS.NOTIFICATION_SHOW, notification);
  }

  async createToolWindow(toolWindow: JetBrainsToolWindow): Promise<void> {
    await this.sendRequest(METHODS.TOOLWINDOW_CREATE, toolWindow);
  }

  async updateToolWindow(id: string, updates: Partial<JetBrainsToolWindow>): Promise<void> {
    await this.sendRequest(METHODS.TOOLWINDOW_UPDATE, { id, ...updates });
  }

  async subscribeEvents(eventTypes: string[]): Promise<void> {
    await this.sendRequest(METHODS.EVENTS_SUBSCRIBE, { eventTypes });
  }

  async unsubscribeEvents(eventTypes: string[]): Promise<void> {
    await this.sendRequest(METHODS.EVENTS_UNSUBSCRIBE, { eventTypes });
  }

  async searchProject(query: string, fileMask?: string): Promise<string[]> {
    const response = await this.sendRequest(METHODS.PROJECT_SEARCH, { query, fileMask });
    return (response.result as string[]) ?? [];
  }

  async getFileTree(rootPath?: string): Promise<Record<string, unknown>[]> {
    const response = await this.sendRequest(METHODS.PROJECT_FILE_TREE, { rootPath });
    return (response.result as Record<string, unknown>[]) ?? [];
  }

  async createTerminal(workingDirectory?: string): Promise<JetBrainsTerminalState | null> {
    const response = await this.sendRequest(METHODS.TERMINAL_CREATE, { workingDirectory });
    return (response.result as JetBrainsTerminalState) ?? null;
  }

  async executeInTerminal(terminalId: string, command: string): Promise<string> {
    const response = await this.sendRequest(METHODS.TERMINAL_EXECUTE, { terminalId, command });
    return (response.result as string) ?? "";
  }
}

export class ProtocolSerializer {
  static serialize(message: JetBrainsProtocolMessage): string {
    const payload = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(payload, "utf-8")}\r\n\r\n`;
    return header + payload;
  }

  static deserialize(raw: string): JetBrainsProtocolMessage | JetBrainsProtocolResponse | null {
    const headerMatch = raw.match(/Content-Length:\s*(\d+)\r\n\r\n/);
    if (!headerMatch) return null;
    const length = parseInt(headerMatch[1], 10);
    const body = raw.slice(headerMatch[0].length, headerMatch[0].length + length);
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
}
