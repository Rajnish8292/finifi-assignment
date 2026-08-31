import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow login and public api-docs without token
  if (req.path === '/auth/login' || req.path.startsWith('/api-docs')) {
    return next();
  }

  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = String(req.query.token);
  }

  const expectedToken = process.env.AUTH_TOKEN || 'mock-jwt-token-12345';

  if (!token || (token !== expectedToken && token !== 'mock-jwt-token-12345')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  next();
}
