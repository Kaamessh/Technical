import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { supabase } from '../services/supabaseClient';

export interface AuthenticatedTeamRequest extends Request {
  team?: {
    id: string;
    team_name: string;
    event_id: string;
    slot_id: string | null;
    role: 'team';
  };
}

export async function authTeamMiddleware(req: AuthenticatedTeamRequest, res: Response, next: NextFunction) {
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

    // Always fetch latest team record from DB to get updated slot_id
    const { data: team, error } = await supabase
      .from('teams')
      .select('id, team_name, event_id, slot_id')
      .eq('id', decoded.id)
      .single();

    if (error || !team) {
      return res.status(401).json({ error: 'Team no longer exists or database query failed' });
    }

    req.team = {
      id: team.id,
      team_name: team.team_name,
      event_id: team.event_id,
      slot_id: team.slot_id,
      role: 'team',
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: token invalid or expired' });
  }
}
