/**
 * JetBrains IDE Communication Protocol
 * Defines the JSON-RPC protocol for OpenSIN ↔ JetBrains IDE communication
 */

import type {
  JetBrainsActionRequest,
  JetBrainsActionResponse,
  JetBrainsConnectionConfig,
  JetBrainsDocumentInfo,
  JetBrainsEditorState,
  JetBrainsEvent,
  JetBrainsNotification,
  JetBrainsProjectInfo,
  JetBrainsProtocolMessage,
  JetBrainsProtocolResponse,
  JetBrainsToolWindow,
} from "./types.js";

export const PROTOCOL_VERSION = "1.0.0";

export const METHODS = {
  INITIALIZE: "jetbrains/initialize",
  SHUTDOWN: "jetbrains/shutdown",
  GET_DOCUMENT: "jetbrains/document/get",
  GET_ALL_DOCUMENTS: "jetbrains/document/list",
  UPDATE_DOCUMENT: "jetbrains/document/update",
  SAVE_DOCUMENT: "jetbrains/document/save",
  GET_EDITOR_STATE: "jetbrains/editor/state",
  GET_PROJECT_INFO: "jetbrains/project/info",
  EXECUTE_ACTION: "jetbrains/action/execute",
  SHOW_NOTIFICATION: "jetbrains/notification/show",
  CREATE_TOOL_WINDOW: "jetbrains/toolwindow/create",
  UPDATE_TOOL_WINDOW: "jetbrains/toolwindow/update",
  SUBSCRIBE_EVENTS: "jetbrains/events/subscribe",
  UNSUBSCRIBE_EVENTS: "jetbrains/events/unsubscribe",
} as const;

export class JetBrainsProtocol {
  private messageId = 0;
  private config: JetBrainsConnectionConfig;
  private pendingRequests = new Map<number | string, {
    resolve: (value: JetBrainsProtocolResponse) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();

  constructor(config: JetBrainsConnectionConfig) {
    this.config = config;
  }

  createMessage(method: string, params?: Record<string, unknown>): JetBrainsProtocolMessage {
    const id = ++this.messageId;
    return {
      jsonrpc: "2.0",
      method,
      params,
      id,
    };
  }

  createResponse(id: number | string, result: unknown): JetBrainsProtocolResponse {
    return {
      jsonrpc: "2.0",
      result,
      id,
    };
  }

  createErrorResponse(id: number | string, code: number, message: string, data?: unknown): JetBrainsProtocolResponse {
    return {
      jsonrpc: "2.0",
      error: { code, message, data },
      id,
    };
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

  handleResponse(response: JetBrainsProtocolResponse): void {
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

  async initialize(pluginInfo: Record<string, string>): Promise<JetBrainsProtocolResponse> {
    return this.sendRequest(METHODS.INITIALIZE, {
      protocolVersion: PROTOCOL_VERSION,
      ...pluginInfo,
    });
  }

  async shutdown(): Promise<JetBrainsProtocolResponse> {
    return this.sendRequest(METHODS.SHUTDOWN);
  }

  async getDocument(fileUrl: string): Promise<JetBrainsDocumentInfo | null> {
    const response = await this.sendRequest(METHODS.GET_DOCUMENT, { fileUrl });
    return (response.result as JetBrainsDocumentInfo) ?? null;
  }

  async getEditorState(): Promise<JetBrainsEditorState | null> {
    const response = await this.sendRequest(METHODS.GET_EDITOR_STATE);
    return (response.result as JetBrainsEditorState) ?? null;
  }

  async getProjectInfo(): Promise<JetBrainsProjectInfo | null> {
    const response = await this.sendRequest(METHODS.GET_PROJECT_INFO);
    return (response.result as JetBrainsProjectInfo) ?? null;
  }

  async executeAction(actionId: string, parameters?: Record<string, unknown>): Promise<JetBrainsActionResponse> {
    const response = await this.sendRequest(METHODS.EXECUTE_ACTION, { actionId, parameters });
    return response.result as JetBrainsActionResponse;
  }

  async showNotification(notification: JetBrainsNotification): Promise<void> {
    await this.sendRequest(METHODS.SHOW_NOTIFICATION, notification);
  }

  async createToolWindow(toolWindow: JetBrainsToolWindow): Promise<void> {
    await this.sendRequest(METHODS.CREATE_TOOL_WINDOW, toolWindow);
  }

  async updateToolWindow(id: string, updates: Partial<JetBrainsToolWindow>): Promise<void> {
    await this.sendRequest(METHODS.UPDATE_TOOL_WINDOW, { id, ...updates });
  }

  async subscribeEvents(eventTypes: string[]): Promise<void> {
    await this.sendRequest(METHODS.SUBSCRIBE_EVENTS, { eventTypes });
  }

  async unsubscribeEvents(eventTypes: string[]): Promise<void> {
    await this.sendRequest(METHODS.UNSUBSCRIBE_EVENTS, { eventTypes });
  }

  private sendMessage(message: JetBrainsProtocolMessage): void {
    const payload = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(payload, "utf-8")}\r\n\r\n`;
    console.log(`[JetBrains Protocol] Sending: ${header}${payload}`);
  }
}
