/**
 * JetBrains IDE Plugin Lifecycle Management
 */

import type { JetBrainsConnectionConfig, JetBrainsLifecycleState, JetBrainsEvent, JetBrainsEventType } from "./types.js";
import { ProtocolClient, METHODS } from "./protocol.js";

type LifecyclePhase = JetBrainsLifecycleState["phase"];
type ConnectionStatus = JetBrainsLifecycleState["connectionStatus"];

export class LifecycleManager {
  private state: JetBrainsLifecycleState = {
    phase: "initializing",
    startTime: Date.now(),
    lastActivity: Date.now(),
    connectionStatus: "disconnected",
    errorCount: 0,
  };
  private client: ProtocolClient;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private onStateChange?: (state: JetBrainsLifecycleState) => void;
  private onEvent?: (event: JetBrainsEvent) => void;

  constructor(client: ProtocolClient) {
    this.client = client;
  }

  setStateChangeListener(listener: (state: JetBrainsLifecycleState) => void): void {
    this.onStateChange = listener;
  }

  setEventListener(listener: (event: JetBrainsEvent) => void): void {
    this.onEvent = listener;
  }

  async start(config: JetBrainsConnectionConfig): Promise<boolean> {
    this.updateState({ phase: "initializing", connectionStatus: "connecting" });

    try {
      this.client.setOnEvent((raw) => {
        const event = raw as JetBrainsEvent;
        this.state.lastActivity = Date.now();
        this.onEvent?.(event);
      });

      const connected = await this.client.connect();
      if (!connected) {
        this.updateState({ phase: "terminated", connectionStatus: "disconnected", errorCount: this.state.errorCount + 1 });
        return false;
      }

      const initResponse = await this.client.initialize({
        pluginId: "opensin-jetbrains",
        name: "OpenSIN",
        version: "1.0.0",
        protocolVersion: "2.0.0",
      });

      if (initResponse.error) {
        this.updateState({ phase: "terminated", connectionStatus: "disconnected", errorCount: this.state.errorCount + 1, lastError: initResponse.error.message });
        return false;
      }

      this.updateState({ phase: "ready", connectionStatus: "connected" });
      this.startHealthCheck(config);
      return true;
    } catch (error) {
      this.updateState({
        phase: "terminated",
        connectionStatus: "disconnected",
        errorCount: this.state.errorCount + 1,
        lastError: (error as Error).message,
      });
      return false;
    }
  }

  async stop(): Promise<void> {
    this.updateState({ phase: "shutting_down" });
    this.stopHealthCheck();

    try {
      await this.client.shutdown();
    } catch {
      /* ignore shutdown errors */
    }

    this.client.disconnect();
    this.updateState({ phase: "terminated", connectionStatus: "disconnected" });
  }

  getState(): JetBrainsLifecycleState {
    return { ...this.state };
  }

  isReady(): boolean {
    return this.state.phase === "ready" && this.state.connectionStatus === "connected";
  }

  async subscribeEvents(eventTypes: JetBrainsEventType[]): Promise<void> {
    if (!this.isReady()) throw new Error("Lifecycle not ready");
    await this.client.subscribeEvents(eventTypes);
  }

  async unsubscribeEvents(eventTypes: JetBrainsEventType[]): Promise<void> {
    if (!this.isReady()) throw new Error("Lifecycle not ready");
    await this.client.unsubscribeEvents(eventTypes);
  }

  private updateState(partial: Partial<JetBrainsLifecycleState>): void {
    this.state = { ...this.state, ...partial, lastActivity: Date.now() };
    this.onStateChange?.(this.state);
  }

  private startHealthCheck(config: JetBrainsConnectionConfig): void {
    this.healthCheckInterval = setInterval(async () => {
      if (!this.isReady()) return;
      const alive = await this.client.ping();
      if (!alive) {
        this.updateState({ connectionStatus: "reconnecting", errorCount: this.state.errorCount + 1 });
        try {
          const reconnected = await this.client.connect();
          if (reconnected) {
            this.updateState({ connectionStatus: "connected" });
          } else {
            this.updateState({ connectionStatus: "disconnected" });
          }
        } catch {
          this.updateState({ connectionStatus: "disconnected" });
        }
      }
    }, Math.min(config.timeoutMs, 30000));
  }

  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}
