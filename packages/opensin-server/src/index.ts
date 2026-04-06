import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

import { createAppState, AppState, ErrorResponse } from './types';
import { createSessionRouter } from './routes/sessions';
import { authRouter } from './routes/auth';
import { toolsRouter } from './routes/tools';
import { streamingRouter } from './routes/streaming';
import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';

function createApp(state: AppState) {
  const app = express();

  app.use(express.json());
  app.use(cors());
  app.use(loggingMiddleware);
  app.use(authMiddleware);

  app.use('/auth', authRouter());
  app.use('/sessions', createSessionRouter(state));
  app.use('/tools', toolsRouter());
  app.use('/api', streamingRouter(state));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' } as ErrorResponse);
  });

  return app;
}

const PORT = process.env.PORT || 3000;
const state = createAppState();
const app = createApp(state);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`OpenSIN Server running on port ${PORT}`);
  });
}

export { app, state, createApp };
