import express, { Request, Response, Router, NextFunction } from 'express';
import cors from 'cors';

import {
  AppState,
  Session,
  SessionEvent,
  CreateSessionResponse,
  ListSessionsResponse,
  SessionDetailsResponse,
  SendMessageRequest,
  ErrorResponse,
  ConversationMessage,
  createAppState,
  allocateSessionId,
  unixTimestampMillis,
  userMessage,
} from './types';
import { createSessionRouter } from './routes/sessions';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';

const app = express();
const state = createAppState();

app.use(express.json());
app.use(cors());
app.use(loggingMiddleware);
app.use(authMiddleware);

app.use('/sessions', createSessionRouter(state));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: unixTimestampMillis() });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' } as ErrorResponse);
});

function notFound(res: Response, message: string): void {
  res.status(404).json({ error: message } as ErrorResponse);
}

export function createSession(state: AppState): CreateSessionResponse {
  const sessionId = allocateSessionId(state);
  const session: Session = {
    id: sessionId,
    createdAt: unixTimestampMillis(),
    conversation: { messages: [] },
    eventEmitter: {
      emit: () => {},
      on: () => () => {},
    },
  };
  state.sessions.set(sessionId, session);
  return { sessionId };
}

export function listSessions(state: AppState): ListSessionsResponse {
  const sessions = Array.from(state.sessions.values()).map((session) => ({
    id: session.id,
    createdAt: session.createdAt,
    messageCount: session.conversation.messages.length,
  }));
  sessions.sort((a, b) => a.id.localeCompare(b.id));
  return { sessions };
}

export function getSession(state: AppState, sessionId: string): SessionDetailsResponse | null {
  const session = state.sessions.get(sessionId);
  if (!session) return null;
  return {
    id: session.id,
    createdAt: session.createdAt,
    session: session.conversation,
  };
}

export function sendMessage(state: AppState, sessionId: string, message: string): boolean {
  const session = state.sessions.get(sessionId);
  if (!session) return false;
  const conversationMessage = userMessage(message);
  session.conversation.messages.push(conversationMessage);
  return true;
}

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`OpenSIN Server running on port ${PORT}`);
  });
}

export { app, state };
