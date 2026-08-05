import jwt from 'jsonwebtoken';
import { JwtPayloadAdmin, JwtPayloadTeam } from '../models/types';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-gamification-2026';
const JWT_EXPIRES_IN = '1d';

export function signAdminToken(payload: Omit<JwtPayloadAdmin, 'role'>): string {
  return jwt.sign({ ...payload, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signTeamToken(payload: Omit<JwtPayloadTeam, 'role'>): string {
  return jwt.sign({ ...payload, role: 'team' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
