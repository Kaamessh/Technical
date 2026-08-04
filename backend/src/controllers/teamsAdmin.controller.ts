import { Response } from 'express';
import bcrypt from 'bcrypt';
import { supabase } from '../services/supabaseClient.js';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware.js';
import { normalizeTeamName } from '../utils/caseInsensitive.js';

export async function getTeamsAdmin(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, sort } = req.query;
    let query = supabase.from('teams').select('id, event_id, team_name, slot_id, registered_at, slots(slot_code)');

    if (event_id) {
      query = query.eq('event_id', String(event_id));
    }

    if (sort === 'alpha') {
      query = query.order('team_name_normalized', { ascending: true });
    } else {
      // Default: sort by timestamp
      query = query.order('registered_at', { ascending: false });
    }

    const { data: teams, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.json(teams);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function createTeamAdmin(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, team_name, password, slot_id } = req.body;
    if (!event_id || !team_name || !password) {
      return res.status(400).json({ error: 'event_id, team_name, and password required' });
    }

    const normalized = normalizeTeamName(team_name);
    const { data: existing } = await supabase
      .from('teams')
      .select('id')
      .eq('event_id', event_id)
      .eq('team_name_normalized', normalized)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Team name already exists for this event' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const { data: team, error } = await supabase
      .from('teams')
      .insert({
        event_id,
        team_name,
        password_hash,
        slot_id: slot_id || null,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(team);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateTeamAdmin(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { team_name, password, slot_id } = req.body;

    const updatePayload: any = {};
    if (team_name) {
      updatePayload.team_name = team_name;
    }
    if (password) {
      updatePayload.password_hash = await bcrypt.hash(password, 10);
    }
    if (slot_id !== undefined) {
      updatePayload.slot_id = slot_id || null;
    }

    const { data: team, error } = await supabase
      .from('teams')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(team);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteTeamAdmin(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('teams').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
