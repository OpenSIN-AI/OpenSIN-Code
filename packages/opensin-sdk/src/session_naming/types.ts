export type SessionNamingStrategy = "manual" | "auto";

export interface SessionName {
  id: string;
  displayName: string;
  strategy: SessionNamingStrategy;
  createdAt: number;
  updatedAt: number;
}

export interface SessionNameConfig {
  autoNamingEnabled: boolean;
  maxNameLength: number;
  namePattern: RegExp;
}

export interface SessionNameEvent {
  sessionId: string;
  previousName?: string;
  newName: string;
  strategy: SessionNamingStrategy;
  timestamp: number;
}

export interface AutoNameRequest {
  planContent: string;
  sessionId: string;
}

export interface RenameRequest {
  sessionId: string;
  newName: string;
}
