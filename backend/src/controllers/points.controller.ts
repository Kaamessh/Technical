import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';
import { broadcastToSlot } from '../services/realtime.service';

export async function adjustPoints(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { team_id, points, reason, round_number } = req.body;
    const adminId = req.admin?.id;

    if (!team_id || points === undefined || !reason) {
      return res.status(400).json({ error: 'team_id, points (positive or negative numeric), and reason required' });
    }

    // Fetch team's slot_id for realtime broadcast
    const { data: team } = await supabase.from('teams').select('slot_id').eq('id', team_id).single();

    // Insert into points_ledger
    const { data: ledgerEntry, error } = await supabase
      .from('points_ledger')
      .insert({
        team_id,
        round_number: round_number || null,
        points,
        reason,
        edited_by_admin: adminId,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    if (team && team.slot_id) {
      await broadcastToSlot(team.slot_id, 'leaderboard:update', {
        team_id,
        points,
        reason,
        manual: true,
      });
    }

    return res.status(201).json(ledgerEntry);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
