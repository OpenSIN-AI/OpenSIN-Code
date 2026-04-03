import {
  SessionName,
  SessionNameEvent,
  SessionNamingStrategy,
  SessionNameConfig,
  RenameRequest,
} from "./types.js";

const DEFAULT_CONFIG: SessionNameConfig = {
  autoNamingEnabled: true,
  maxNameLength: 50,
  namePattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
};

export class SessionNamer {
  private names: Map<string, SessionName> = new Map();
  private config: SessionNameConfig;
  private listeners: Array<(event: SessionNameEvent) => void> = [];

  constructor(config?: Partial<SessionNameConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setName(sessionId: string, name: string, strategy: SessionNamingStrategy = "manual"): SessionName {
    const sanitized = this.sanitizeName(name);
    const now = Date.now();
    const existing = this.names.get(sessionId);

    const sessionName: SessionName = {
      id: sessionId,
      displayName: sanitized,
      strategy,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.names.set(sessionId, sessionName);

    const event: SessionNameEvent = {
      sessionId,
      previousName: existing?.displayName,
      newName: sanitized,
      strategy,
      timestamp: now,
    };

    this.notifyListeners(event);
    return sessionName;
  }

  getName(sessionId: string): SessionName | undefined {
    return this.names.get(sessionId);
  }

  rename(request: RenameRequest): SessionName {
    return this.setName(request.sessionId, request.newName, "manual");
  }

  hasName(sessionId: string): boolean {
    return this.names.has(sessionId);
  }

  getAllNames(): Map<string, SessionName> {
    return new Map(this.names);
  }

  onChange(listener: (event: SessionNameEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private sanitizeName(name: string): string {
    let sanitized = name.trim();
    if (sanitized.length > this.config.maxNameLength) {
      sanitized = sanitized.slice(0, this.config.maxNameLength).trim() + "…";
    }
    return sanitized || "Untitled Session";
  }

  private notifyListeners(event: SessionNameEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    }
  }
}
