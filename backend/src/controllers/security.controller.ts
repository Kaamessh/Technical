import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedTeamRequest } from '../middlewares/authTeam.middleware';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';
import {
  logMalpracticeIncident,
  getMalpracticeLogs,
  clearMalpracticeLogs,
} from '../services/security.service';

export async function reportMalpractice(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id || req.body.team_id;
    const { action_type, details, round_number, slot_id } = req.body;

    if (!teamId) {
      return res.status(400).json({ error: 'Team ID required' });
    }

    let teamName = req.team?.team_name;
    let slotId = slot_id || req.team?.slot_id;
    let eventId = req.team?.event_id;
    let slotCode = '';

    // Fetch team & slot info if missing
    if (!teamName || !slotId || !eventId) {
      const { data: team } = await supabase
        .from('teams')
        .select('id, team_name, slot_id, event_id, slots(slot_code)')
        .eq('id', teamId)
        .single();

      if (team) {
        teamName = team.team_name;
        slotId = slotId || team.slot_id;
        eventId = eventId || team.event_id;
        if (team.slots && typeof team.slots === 'object') {
          slotCode = (team.slots as any).slot_code || '';
        }
      }
    }

    if (!slotCode && slotId) {
      const { data: slot } = await supabase.from('slots').select('slot_code').eq('id', slotId).single();
      if (slot) slotCode = slot.slot_code;
    }

    const log = await logMalpracticeIncident({
      team_id: teamId,
      team_name: teamName || 'Unknown Team',
      slot_id: slotId || '',
      slot_code: slotCode,
      event_id: eventId || '',
      round_number: Number(round_number) || 1,
      action_type: action_type || 'UNAUTHORIZED_ACTION',
      details: details || 'Suspicious user behavior detected',
    });

    return res.status(201).json({ success: true, log });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getMalpracticeLogsAdmin(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { slot_id, event_id } = req.query;
    const logs = await getMalpracticeLogs({
      slot_id: slot_id ? String(slot_id) : undefined,
      event_id: event_id ? String(event_id) : undefined,
    });
    return res.json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function clearMalpracticeLogsAdmin(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { slot_id } = req.body;
    await clearMalpracticeLogs(slot_id ? String(slot_id) : undefined);
    return res.json({ success: true, message: 'Malpractice logs cleared successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
