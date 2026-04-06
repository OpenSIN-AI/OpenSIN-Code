import express, { Request, Response, Router } from 'express';
import {
  AppState,
  CreateSessionResponse,
  ListSessionsResponse,
  SessionDetailsResponse,
  SendMessageRequest,
  ErrorResponse,
  allocateSessionId,
  unixTimestampMillis,
  userMessage,
  Session,
  SessionEvent,
} from '../types';

export function createSessionRouter(state: AppState): Router {
  const router = express.Router();

  router.post('/', (req: Request, res: Response) => {
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
    res.status(201).json({ sessionId } as CreateSessionResponse);
  });

  router.get('/', (_req: Request, res: Response) => {
    const sessions = Array.from(state.sessions.values()).map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      messageCount: session.conversation.messages.length,
    }));
    sessions.sort((a, b) => a.id.localeCompare(b.id));
    res.json({ sessions } as ListSessionsResponse);
  });

  router.get('/:id', (req: Request, res: Response) => {
    const session = state.sessions.get(req.params.id);
    if (!session) {
      res.status(404).json({ error: `session '${req.params.id}' not found` } as ErrorResponse);
      return;
    }
    res.json({
      id: session.id,
      createdAt: session.createdAt,
      session: session.conversation,
    } as SessionDetailsResponse);
  });

  router.post('/:id/message', (req: Request, res: Response) => {
    const session = state.sessions.get(req.params.id);
    if (!session) {
      res.status(404).json({ error: `session '${req.params.id}' not found` } as ErrorResponse);
      return;
    }
    const payload = req.body as SendMessageRequest;
    const message = userMessage(payload.message);
    session.conversation.messages.push(message);
    res.status(204).send();
  });

  return router;
}
