import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
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
