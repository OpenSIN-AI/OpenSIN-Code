import * as express from 'express';
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
} from '../types';

export function createSessionRouter(state: AppState): express.Router {
  const router = express.Router();

  router.post('/', (req: express.Request, res: express.Response) => {
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

  router.get('/', (_req: express.Request, res: express.Response) => {
    const sessions = Array.from(state.sessions.values()).map((session) => ({
      id: session.id,
      createdAt: session.createdAt,
      messageCount: session.conversation.messages.length,
    }));
    sessions.sort((a, b) => a.id.localeCompare(b.id));
    res.json({ sessions } as ListSessionsResponse);
  });

  router.get('/:id', (req: express.Request, res: express.Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = state.sessions.get(id);
    if (!session) {
      res.status(404).json({ error: `session '${id}' not found` } as ErrorResponse);
      return;
    }
    res.json({
      id: session.id,
      createdAt: session.createdAt,
      session: session.conversation,
    } as SessionDetailsResponse);
  });

  router.post('/:id/message', (req: express.Request, res: express.Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = state.sessions.get(id);
    if (!session) {
      res.status(404).json({ error: `session '${id}' not found` } as ErrorResponse);
      return;
    }
    const payload = req.body as SendMessageRequest;
    const message = userMessage(payload.message);
    session.conversation.messages.push(message);
    res.status(204).send();
  });

  return router;
}
