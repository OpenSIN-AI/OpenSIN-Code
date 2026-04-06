export type SessionId = string;
export type SessionStore = Map<SessionId, Session>;

export interface AppState {
  sessions: SessionStore;
  nextSessionId: number;
}

export interface Session {
  id: SessionId;
  createdAt: number;
  conversation: RuntimeSession;
  eventEmitter: EventEmitter;
}

export interface RuntimeSession {
  messages: ConversationMessage[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SessionEvent {
  type: 'snapshot' | 'message';
  sessionId: SessionId;
  session?: RuntimeSession;
  message?: ConversationMessage;
}

export interface ErrorResponse {
  error: string;
}

export interface CreateSessionResponse {
  sessionId: SessionId;
}

export interface SessionSummary {
  id: SessionId;
  createdAt: number;
  messageCount: number;
}

export interface ListSessionsResponse {
  sessions: SessionSummary[];
}

export interface SessionDetailsResponse {
  id: SessionId;
  createdAt: number;
  session: RuntimeSession;
}

export interface SendMessageRequest {
  message: string;
}

export type ApiError = [number, ErrorResponse];
export type ApiResult<T> = T;

export interface EventEmitter {
  emit(event: SessionEvent): void;
  on(handler: (event: SessionEvent) => void): () => void;
}

export function createAppState(): AppState {
  return {
    sessions: new Map(),
    nextSessionId: 1,
  };
}

export function allocateSessionId(state: AppState): SessionId {
  const id = state.nextSessionId++;
  return `session-${id}`;
}

export function unixTimestampMillis(): number {
  return Date.now();
}

export function userMessage(content: string): ConversationMessage {
  return { role: 'user', content };
}

export function assistantMessage(content: string): ConversationMessage {
  return { role: 'assistant', content };
}
