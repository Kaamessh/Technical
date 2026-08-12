import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';
import { broadcastToSlot } from '../services/realtime.service';
import { getTaskSettings, updateTaskSettings, getPMaxForRound } from '../services/taskSettings.service';
import { recalculateSlotScores, calculateTaskScore } from '../services/scoring.service';

// Manual point adjustment with MANUAL_OVERRIDE protection tag
export async function adjustPoints(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { team_id, points, reason, round_number } = req.body;
    const adminId = req.admin?.id;

    if (!team_id || points === undefined || !reason) {
      return res.status(400).json({ error: 'team_id, points (numeric), and reason required' });
    }

    // Fetch team's slot_id for realtime broadcast
    const { data: team } = await supabase.from('teams').select('slot_id').eq('id', team_id).single();

    // Ensure MANUAL_OVERRIDE tag is present so recalculation never overwrites it
    const overrideReason = reason.startsWith('MANUAL_OVERRIDE:') ? reason : `MANUAL_OVERRIDE: ${reason}`;

    // Insert into points_ledger
    const { data: ledgerEntry, error } = await supabase
      .from('points_ledger')
      .insert({
        team_id,
        round_number: round_number || null,
        points,
        reason: overrideReason,
        edited_by_admin: adminId,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    if (team && team.slot_id) {
      await broadcastToSlot(team.slot_id, 'leaderboard:update', {
        team_id,
        points,
        reason: overrideReason,
        manual: true,
      });
    }

    return res.status(201).json(ledgerEntry);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get task P_max settings
export async function getAdminTaskSettings(req: Request, res: Response) {
  return res.json(getTaskSettings());
}

// Update task P_max settings
export async function updateAdminTaskSettings(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const newSettings = req.body;
    const updated = updateTaskSettings(newSettings);
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Recalculate slot scores using core formula
export async function triggerSlotRecalculation(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { slotId } = req.params;
    if (!slotId) return res.status(400).json({ error: 'slotId required' });
    await recalculateSlotScores(slotId);
    return res.json({ message: `Slot ${slotId} scores successfully recalculated.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Detailed Task Attempts Audit Data for Slot
export async function getSlotTaskAttempts(req: Request, res: Response) {
  try {
    const { slotId } = req.params;

    const { data: teams } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('slot_id', slotId);

    if (!teams || teams.length === 0) return res.json([]);

    const N = teams.length;
    const teamIds = teams.map((t) => t.id);

    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('*')
      .in('team_id', teamIds);

    const { data: ledger } = await supabase
      .from('points_ledger')
      .select('*')
      .in('team_id', teamIds);

    const taskTypes: Record<number, string> = {
      1: 'round1_quiz',
      2: 'round2_workflow',
      3: 'round3_ai_vs_real',
      4: 'round4_spot_data',
      5: 'round5_password',
    };

    const taskAttemptsList: any[] = [];

    for (let roundNum = 1; roundNum <= 5; roundNum++) {
      const pMax = getPMaxForRound(roundNum);
      const roundProgress = progress ? progress.filter((p) => p.round_number === roundNum && p.status === 'completed') : [];
      const sortedCompletions = [...roundProgress].sort(
        (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      );

      teams.forEach((t) => {
        const teamCompIdx = sortedCompletions.findIndex((c) => c.team_id === t.id);
        const isCompleted = teamCompIdx !== -1;
        const comp = isCompleted ? sortedCompletions[teamCompIdx] : null;

        const rank = isCompleted ? teamCompIdx + 1 : 0;
        const computedTaskScore = isCompleted ? calculateTaskScore(pMax, N, rank) : 0;

        const teamLedger = ledger ? ledger.filter((l) => l.team_id === t.id && l.round_number === roundNum) : [];
        const isManualOverride = teamLedger.some((l) => l.reason?.includes('MANUAL_OVERRIDE'));

        taskAttemptsList.push({
          team_id: t.id,
          team_name: t.team_name,
          slot_id: slotId,
          task_id: roundNum,
          task_type: taskTypes[roundNum] || `round_${roundNum}`,
          status: isCompleted ? 'completed' : 'did_not_finish',
          completion_timestamp_ms: comp ? new Date(comp.completed_at).getTime() : null,
          completed_at_iso: comp ? comp.completed_at : null,
          computed_rank: rank,
          n_participants: N,
          p_max: pMax,
          computed_task_score: computedTaskScore,
          actual_points_ledger: teamLedger.reduce((sum, l) => sum + Number(l.points || 0), 0),
          is_manual_override: isManualOverride,
        });
      });
    }

    return res.json(taskAttemptsList);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
