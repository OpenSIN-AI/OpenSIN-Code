import * as express from 'express';
import { AppState, SessionEvent, ErrorResponse } from '../types';

export function streamingRouter(state: AppState): express.Router {
  const router = express.Router();

  router.get('/sessions/:id/events', (req: express.Request, res: express.Response) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const session = state.sessions.get(id);
    
    if (!session) {
      res.status(404).json({ error: `session '${id}' not found` } as ErrorResponse);
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const snapshotEvent: SessionEvent = {
      type: 'snapshot',
      sessionId: session.id,
      session: session.conversation,
    };
    res.write(`event: snapshot\ndata: ${JSON.stringify(snapshotEvent)}\n\n`);

    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    const handler = (event: SessionEvent) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };

    if (session.eventEmitter.on) {
      session.eventEmitter.on(handler);
    }

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  return router;
}
