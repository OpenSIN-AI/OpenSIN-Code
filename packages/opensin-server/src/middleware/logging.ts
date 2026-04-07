import * as express from 'express';

export const loggingMiddleware: express.RequestHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}
