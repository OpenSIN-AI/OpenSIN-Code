import * as express from 'express';

interface AuthRequest extends express.Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authRouter(): express.Router {
  const router = express.Router();

  router.post('/login', (req: AuthRequest, res: express.Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }
    res.json({
      token: 'sin-token-' + Date.now(),
      user: { id: 'user-1', email },
    });
  });

  router.post('/logout', (_req: AuthRequest, res: express.Response) => {
    res.json({ success: true });
  });

  router.get('/me', (req: AuthRequest, res: express.Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json(req.user);
  });

  return router;
}
