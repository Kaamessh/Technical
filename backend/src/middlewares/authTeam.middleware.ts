import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.js';

export interface AuthenticatedTeamRequest extends Request {
  team?: {
    id: string;
    team_name: string;
    event_id: string;
    slot_id: string | null;
    role: 'team';
  };
}

export function authTeamMiddleware(req: AuthenticatedTeamRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'team') {
      return res.status(403).json({ error: 'Forbidden: team access required' });
    }
    req.team = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: token invalid or expired' });
  }
}
