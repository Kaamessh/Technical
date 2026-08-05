import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';

export async function getSlotLeaderboard(req: Request, res: Response) {
  try {
    const { slotId } = req.params;

    // Fetch teams in slot
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, team_name, registered_at')
      .eq('slot_id', slotId);

    if (teamsErr) return res.status(500).json({ error: teamsErr.message });
    if (!teams || teams.length === 0) return res.json([]);

    const teamIds = teams.map((t) => t.id);

    // Fetch all points ledger rows for these teams
    const { data: ledger, error: ledgerErr } = await supabase
      .from('points_ledger')
      .select('team_id, points, round_number, created_at')
      .in('team_id', teamIds);

    if (ledgerErr) return res.status(500).json({ error: ledgerErr.message });

    // Fetch team round progress for round tracking and tie-breaking
    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('team_id, round_number, completed_at, status')
      .in('team_id', teamIds)
      .eq('status', 'completed');

    // Aggregate points per team
    const standings = teams.map((t) => {
      const teamLedger = ledger ? ledger.filter((l) => l.team_id === t.id) : [];
      const totalPoints = teamLedger.reduce((sum, item) => sum + Number(item.points || 0), 0);

      const teamProgress = progress ? progress.filter((p) => p.team_id === t.id) : [];
      const maxRound = teamProgress.reduce((max, item) => Math.max(max, item.round_number), 0);
      const highestCompleted = teamProgress.find((p) => p.round_number === maxRound);

      return {
        team_id: t.id,
        team_name: t.team_name,
        total_points: totalPoints,
        highest_round: maxRound,
        latest_completed_at: highestCompleted ? highestCompleted.completed_at : null,
      };
    });

    // Sort: descending by total_points, then descending by highest_round, then ascending by latest_completed_at
    standings.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.highest_round !== a.highest_round) return b.highest_round - a.highest_round;
      if (a.latest_completed_at && b.latest_completed_at) {
        return new Date(a.latest_completed_at).getTime() - new Date(b.latest_completed_at).getTime();
      }
      return 0;
    });

    // Add rank
    const ranked = standings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return res.json(ranked);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getGlobalLeaderboard(req: Request, res: Response) {
  try {
    const { eventId } = req.params;

    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, team_name, slot_id, slots(slot_number, slot_code)')
      .eq('event_id', eventId);

    if (teamsErr) return res.status(500).json({ error: teamsErr.message });
    if (!teams || teams.length === 0) return res.json([]);

    const teamIds = teams.map((t) => t.id);

    const { data: ledger } = await supabase
      .from('points_ledger')
      .select('team_id, points')
      .in('team_id', teamIds);

    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('team_id, round_number, completed_at')
      .in('team_id', teamIds)
      .eq('status', 'completed');

    const standings = teams.map((t) => {
      const teamLedger = ledger ? ledger.filter((l) => l.team_id === t.id) : [];
      const totalPoints = teamLedger.reduce((sum, item) => sum + Number(item.points || 0), 0);

      const teamProgress = progress ? progress.filter((p) => p.team_id === t.id) : [];
      const maxRound = teamProgress.reduce((max, item) => Math.max(max, item.round_number), 0);
      const highestCompleted = teamProgress.find((p) => p.round_number === maxRound);

      const slotObj: any = t.slots;

      return {
        team_id: t.id,
        team_name: t.team_name,
        slot_code: slotObj ? slotObj.slot_code : 'N/A',
        total_points: totalPoints,
        highest_round: maxRound,
        latest_completed_at: highestCompleted ? highestCompleted.completed_at : null,
      };
    });

    standings.sort((a, b) => {
      if (b.total_points !== a.total_points) return b.total_points - a.total_points;
      if (b.highest_round !== a.highest_round) return b.highest_round - a.highest_round;
      if (a.latest_completed_at && b.latest_completed_at) {
        return new Date(a.latest_completed_at).getTime() - new Date(b.latest_completed_at).getTime();
      }
      return 0;
    });

    const ranked = standings.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    return res.json(ranked);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
