import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../services/supabaseClient';
import { signAdminToken, signTeamToken } from '../utils/jwt';
import { normalizeTeamName } from '../utils/caseInsensitive';

const AUTHORIZED_ADMIN_EMAIL = 'kaamesh712006@gmail.com';

export async function adminRegister(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Restrict admin registration strictly to kaamesh712006@gmail.com
    if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Invalid admin registration email.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Query existing admin without .single() to avoid PGRST116 error when 0 rows exist
    const { data: existingAdmins } = await supabase
      .from('admins')
      .select('id')
      .eq('email', normalizedEmail);

    let admin;
    if (existingAdmins && existingAdmins.length > 0) {
      const existingId = existingAdmins[0].id;
      const { data: updatedList, error: updateErr } = await supabase
        .from('admins')
        .update({ username, password_hash })
        .eq('id', existingId)
        .select('id, username, email, created_at');

      if (updateErr || !updatedList || updatedList.length === 0) {
        return res.status(500).json({ error: updateErr?.message || 'Failed to update admin account.' });
      }
      admin = updatedList[0];
    } else {
      const { data: createdList, error: createErr } = await supabase
        .from('admins')
        .insert({ username, email: normalizedEmail, password_hash })
        .select('id, username, email, created_at');

      if (createErr || !createdList || createdList.length === 0) {
        return res.status(500).json({ error: createErr?.message || 'Failed to create admin account.' });
      }
      admin = createdList[0];
    }

    const token = signAdminToken({ id: admin.id, username: admin.username, email: admin.email });
    return res.status(200).json({ admin, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error during registration.' });
  }
}

export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== AUTHORIZED_ADMIN_EMAIL) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const { data: admins, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', normalizedEmail);

    if (error || !admins || admins.length === 0) {
      return res.status(401).json({ error: 'Admin account not found. Please register first.' });
    }

    const admin = admins[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid admin credentials.' });
    }

    const token = signAdminToken({ id: admin.id, username: admin.username, email: admin.email });
    return res.json({
      admin: { id: admin.id, username: admin.username, email: admin.email, created_at: admin.created_at },
      token,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error during login.' });
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
      const { data: activeEvents } = await supabase
        .from('events')
        .select('id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!activeEvents || activeEvents.length === 0) {
        return res.status(400).json({ error: 'No active event found. Admin must create/activate an event first.' });
      }
      targetEventId = activeEvents[0].id;
    }

    const normalized = normalizeTeamName(team_name);
    const { data: existingTeams } = await supabase
      .from('teams')
      .select('id')
      .eq('event_id', targetEventId)
      .eq('team_name_normalized', normalized);

    if (existingTeams && existingTeams.length > 0) {
      return res.status(400).json({ error: 'Team name already registered for this event (case-insensitive match).' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data: createdTeams, error } = await supabase
      .from('teams')
      .insert({
        event_id: targetEventId,
        team_name,
        password_hash,
      })
      .select('id, event_id, team_name, slot_id, registered_at');

    if (error || !createdTeams || createdTeams.length === 0) {
      return res.status(500).json({ error: error?.message || 'Failed to register team.' });
    }

    const team = createdTeams[0];

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
