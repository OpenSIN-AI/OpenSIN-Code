import * as express from 'express';

// Augment Express Request to include user property
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
    };
  }
}

export const authMiddleware: express.RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (req.path.startsWith('/auth/login') || req.path === '/health') {
    next();
    return;
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    req.user = {
      id: 'user-1',
      email: 'user@example.com',
    };
  }

  next();
}
