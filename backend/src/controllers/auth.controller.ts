import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../services/supabaseClient.js';
import { signAdminToken, signTeamToken } from '../utils/jwt.js';
import { normalizeTeamName } from '../utils/caseInsensitive.js';

const AUTHORIZED_ADMIN_EMAIL = 'kaamesh712006@gmail.com';

export async function adminRegister(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Strict Email Constraint: Only kaamesh712006@gmail.com is allowed
    if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({
        error: `Registration denied. Only '${AUTHORIZED_ADMIN_EMAIL}' is authorized as administrator.`,
      });
    }

    // 2. Lock Registration: Check if an admin account already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id, email')
      .limit(1);

    if (existingAdmin && existingAdmin.length > 0) {
      return res.status(400).json({
        error: `Admin account '${AUTHORIZED_ADMIN_EMAIL}' has already been registered. Registration is locked. Please sign in.`,
      });
    }

    // 3. Hash password chosen during registration and insert
    const password_hash = await bcrypt.hash(password, 10);
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        username,
        email: normalizedEmail,
        password_hash,
      })
      .select('id, username, email, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const token = signAdminToken({ id: admin.id, username: admin.username, email: admin.email });
    return res.status(201).json({ admin, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Enforce email constraint
    if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({
        error: `Access denied. Only '${AUTHORIZED_ADMIN_EMAIL}' is authorized as administrator.`,
      });
    }

    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error || !admin) {
      return res.status(401).json({
        error: `No registered admin found for '${AUTHORIZED_ADMIN_EMAIL}'. Please register first.`,
      });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password. Please check your admin credentials.' });
    }

    const token = signAdminToken({ id: admin.id, username: admin.username, email: admin.email });
    return res.json({
      admin: { id: admin.id, username: admin.username, email: admin.email, created_at: admin.created_at },
      token,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function teamRegister(req: Request, res: Response) {
  try {
    const { team_name, password, event_id } = req.body;
    if (!team_name || !password) {
      return res.status(400).json({ error: 'Team name and password required' });
    }

    let targetEventId = event_id;
    if (!targetEventId) {
      const { data: activeEvent } = await supabase
        .from('events')
        .select('id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!activeEvent) {
        return res.status(400).json({ error: 'No active event found. Admin must create/activate an event first.' });
      }
      targetEventId = activeEvent.id;
    }

    const normalized = normalizeTeamName(team_name);
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('event_id', targetEventId)
      .eq('team_name_normalized', normalized)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Team name already registered for this event (case-insensitive match).' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        event_id: targetEventId,
        team_name,
        password_hash,
      })
      .select('id, event_id, team_name, slot_id, registered_at')
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const token = signTeamToken({
      id: team.id,
      team_name: team.team_name,
      event_id: team.event_id,
      slot_id: team.slot_id,
    });

    return res.status(201).json({ team, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function teamLogin(req: Request, res: Response) {
  try {
    const { team_name, password, event_id } = req.body;
    if (!team_name || !password) {
      return res.status(400).json({ error: 'Team name and password required' });
    }

    const normalized = normalizeTeamName(team_name);
    let query = supabase.from('teams').select('*').eq('team_name_normalized', normalized);
    if (event_id) {
      query = query.eq('event_id', event_id);
    }

    const { data: teams, error } = await query;
    if (error || !teams || teams.length === 0) {
      return res.status(401).json({ error: 'Invalid team name or password' });
    }

    const team = teams[0];
    const valid = await bcrypt.compare(password, team.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid team name or password' });
    }

    const token = signTeamToken({
      id: team.id,
      team_name: team.team_name,
      event_id: team.event_id,
      slot_id: team.slot_id,
    });

    return res.json({
      team: {
        id: team.id,
        event_id: team.event_id,
        team_name: team.team_name,
        slot_id: team.slot_id,
        registered_at: team.registered_at,
      },
      token,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
