import { Router, Request, Response } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authRouter() {
  const router = Router();

  router.post('/login', (req: AuthRequest, res: Response) => {
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

  router.post('/logout', (_req: AuthRequest, res: Response) => {
    res.json({ success: true });
  });

  router.get('/me', (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    res.json(req.user);
  });

  return router;
}
