import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedAdminRequest extends Request {
  admin?: {
    id: string;
    username: string;
    email: string;
    role: 'admin';
  };
}

export function authAdminMiddleware(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin access required' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: token invalid or expired' });
  }
}
