/**
 * JetBrains IDE Plugin Manager — handles plugin lifecycle and IDE communication
 */

import type {
  JetBrainsConnectionConfig,
  JetBrainsDocumentInfo,
  JetBrainsEditorState,
  JetBrainsEvent,
  JetBrainsEventType,
  JetBrainsNotification,
  JetBrainsPluginInfo,
  JetBrainsProjectInfo,
  JetBrainsToolWindow,
} from "./types.js";
import { JetBrainsProtocol, METHODS, PROTOCOL_VERSION } from "./protocol.js";

export interface JetBrainsPluginOptions {
  connection: JetBrainsConnectionConfig;
  pluginId: string;
  name: string;
  version: string;
  onEvent?: (event: JetBrainsEvent) => void;
  onError?: (error: Error) => void;
}

export class JetBrainsPlugin {
  private protocol: JetBrainsProtocol;
  private pluginInfo: JetBrainsPluginInfo;
  private initialized = false;
  private eventListeners = new Map<JetBrainsEventType, Set<(event: JetBrainsEvent) => void>>();
  private onEvent?: (event: JetBrainsEvent) => void;
  private onError?: (error: Error) => void;

  constructor(options: JetBrainsPluginOptions) {
    this.protocol = new JetBrainsProtocol(options.connection);
    this.pluginInfo = {
      pluginId: options.pluginId,
      name: options.name,
      version: options.version,
      ideName: "IntelliJ IDEA",
      ideVersion: "2026.1",
      platform: "jvm",
    };
    this.onEvent = options.onEvent;
    this.onError = options.onError;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      const response = await this.protocol.initialize({
        pluginId: this.pluginInfo.pluginId,
        name: this.pluginInfo.name,
        version: this.pluginInfo.version,
        protocolVersion: PROTOCOL_VERSION,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      this.initialized = true;
      return true;
    } catch (error) {
      this.onError?.(error as Error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) return;
    await this.protocol.shutdown();
    this.initialized = false;
  }

  async getActiveDocument(): Promise<JetBrainsDocumentInfo | null> {
    this.ensureInitialized();
    const state = await this.protocol.getEditorState();
    return state?.activeDocument ?? null;
  }

  async getEditorState(): Promise<JetBrainsEditorState | null> {
    this.ensureInitialized();
    return this.protocol.getEditorState();
  }

  async getProjectInfo(): Promise<JetBrainsProjectInfo | null> {
    this.ensureInitialized();
    return this.protocol.getProjectInfo();
  }

  async executeAction(actionId: string, parameters?: Record<string, unknown>): Promise<boolean> {
    this.ensureInitialized();
    const response = await this.protocol.executeAction(actionId, parameters);
    return response.success;
  }

  async showNotification(notification: JetBrainsNotification): Promise<void> {
    this.ensureInitialized();
    await this.protocol.showNotification(notification);
  }

  async createToolWindow(toolWindow: JetBrainsToolWindow): Promise<void> {
    this.ensureInitialized();
    await this.protocol.createToolWindow(toolWindow);
  }

  async updateToolWindow(id: string, updates: Partial<JetBrainsToolWindow>): Promise<void> {
    this.ensureInitialized();
    await this.protocol.updateToolWindow(id, updates);
  }

  async subscribeEvents(eventTypes: JetBrainsEventType[]): Promise<void> {
    this.ensureInitialized();
    await this.protocol.subscribeEvents(eventTypes);

    for (const eventType of eventTypes) {
      if (!this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, new Set());
      }
    }
  }

  async unsubscribeEvents(eventTypes: JetBrainsEventType[]): Promise<void> {
    this.ensureInitialized();
    await this.protocol.unsubscribeEvents(eventTypes);

    for (const eventType of eventTypes) {
      this.eventListeners.delete(eventType);
    }
  }

  on(eventType: JetBrainsEventType, listener: (event: JetBrainsEvent) => void): void {
    let listeners = this.eventListeners.get(eventType);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(eventType, listeners);
    }
    listeners.add(listener);
  }

  off(eventType: JetBrainsEventType, listener: (event: JetBrainsEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    listeners?.delete(listener);
  }

  handleEvent(event: JetBrainsEvent): void {
    this.onEvent?.(event);
    const listeners = this.eventListeners.get(event.type as JetBrainsEventType);
    listeners?.forEach((listener) => listener(event));
  }

  getPluginInfo(): JetBrainsPluginInfo {
    return { ...this.pluginInfo };
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("JetBrains plugin not initialized. Call initialize() first.");
    }
  }
}
