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

// Detailed Per-Team Score Breakdown & Calculation for Admin Leaderboard
export async function getTeamScoreBreakdown(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    if (!teamId) return res.status(400).json({ error: 'teamId required' });

    // Fetch team with slot info
    const { data: team, error: teamErr } = await supabase
      .from('teams')
      .select('*, slots(*)')
      .eq('id', teamId)
      .single();

    if (teamErr || !team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const slotId = team.slot_id;

    // Fetch slot teams count N
    const { data: slotTeams } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('slot_id', slotId);

    const N = slotTeams && slotTeams.length > 0 ? slotTeams.length : 1;
    const allSlotTeamIds = slotTeams ? slotTeams.map((t) => t.id) : [teamId];

    // Fetch all progress for this slot
    const { data: allProgress } = await supabase
      .from('team_round_progress')
      .select('*')
      .in('team_id', allSlotTeamIds);

    // Fetch all ledger entries for this team
    const { data: ledgerEntries } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: true });

    // Fetch decode word info
    const { data: decodeData } = await supabase
      .from('team_decode_words')
      .select('*')
      .eq('team_id', teamId)
      .single();

    // Fetch problem statements and claims
    const [{ data: psRow }, { data: claimsRow }] = await Promise.all([
      supabase
        .from('quiz_questions')
        .select('options')
        .eq('event_id', team.event_id)
        .eq('question_text', '__PROBLEM_STATEMENTS__')
        .single(),
      supabase
        .from('quiz_questions')
        .select('options')
        .eq('question_text', '__SLOT_PROBLEM_CLAIMS__')
        .single(),
    ]);

    const allStatements: any[] = psRow && Array.isArray(psRow.options) ? psRow.options : [];
    const allClaims: any[] = claimsRow && Array.isArray(claimsRow.options) ? claimsRow.options : [];
    const teamClaim = allClaims.find((c: any) => c.team_id === teamId);
    let claimedProblem: any = null;
    if (teamClaim) {
      const ps =
        allStatements.find((p) => p.id === teamClaim.problem_id) ||
        allStatements[teamClaim.card_index];
      claimedProblem = {
        card_index: teamClaim.card_index,
        card_number: teamClaim.card_index !== undefined ? teamClaim.card_index + 1 : 1,
        title: ps?.title || 'Assigned Challenge',
        category: ps?.category || 'General',
        description: ps?.description || '',
        claimed_at: teamClaim.claimed_at,
      };
    }

    const roundNames: Record<number, string> = {
      1: 'Round 1 — Live Quiz Arena',
      2: 'Round 2 — Workflow Logic Puzzle',
      3: 'Round 3 — AI vs Real Challenge',
      4: 'Round 4 — Spot Data Anomaly',
      5: 'Round 5 — Password Decoder Terminal',
      6: 'Round 6 — Problem Statement Selection',
    };

    const roundBreakdowns: any[] = [];
    const teamProgressList = allProgress ? allProgress.filter((p) => p.team_id === teamId) : [];

    for (let r = 1; r <= 6; r++) {
      const pMax = getPMaxForRound(r);
      const teamProg = teamProgressList.find((p) => p.round_number === r);
      const isCompleted = teamProg && teamProg.status === 'completed';

      // Find rank among slot teams for this round
      const roundAllCompletions = (allProgress || [])
        .filter((p) => p.round_number === r && p.status === 'completed')
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

      const rankIndex = roundAllCompletions.findIndex((c) => c.team_id === teamId);
      const rank = rankIndex !== -1 ? rankIndex + 1 : isCompleted ? 1 : 0;

      // Points earned from ledger for this round
      const roundLedger = (ledgerEntries || []).filter((l) => l.round_number === r);
      const roundPoints = roundLedger.reduce((sum, l) => sum + Number(l.points || 0), 0);

      // Formula detail string
      let formulaDetail = '';
      if (r === 6) {
        formulaDetail = 'Assigned Problem Statement (0 pts awarded)';
      } else if (pMax === 0) {
        formulaDetail = '0 pts (Completion Gate)';
      } else if (isCompleted && rank > 0) {
        formulaDetail = `round( ${pMax} × (${N} - ${rank} + 1) / ${N} ) = ${roundPoints} pts`;
      } else {
        formulaDetail = 'Not completed';
      }

      roundBreakdowns.push({
        round_number: r,
        round_name: roundNames[r],
        status: isCompleted ? 'completed' : teamProg ? 'in_progress' : 'not_started',
        completed_at: teamProg?.completed_at || null,
        rank: isCompleted ? rank : null,
        n_participants: N,
        p_max: pMax,
        points: roundPoints,
        formula_detail: formulaDetail,
        ledger_items: roundLedger,
      });
    }

    const totalPoints = (ledgerEntries || []).reduce((sum, l) => sum + Number(l.points || 0), 0);

    return res.json({
      team: {
        id: team.id,
        team_name: team.team_name,
        created_at: team.created_at,
        slot_id: team.slot_id,
        slot_code: team.slots?.slot_code || 'SLOT',
        slot_number: team.slots?.slot_number || 1,
        total_points: totalPoints,
        n_participants: N,
      },
      decode_info: decodeData
        ? {
            word: decodeData.word,
            letter_numbers: decodeData.letter_numbers,
            binary_clue: decodeData.binary_clue,
            binary_decimal: decodeData.binary_clue
              ? parseInt(decodeData.binary_clue.replace(/[^01]/g, ''), 2)
              : 0,
            expected_password: `${
              decodeData.binary_clue
                ? parseInt(decodeData.binary_clue.replace(/[^01]/g, ''), 2)
                : 0
            }${decodeData.word.toLowerCase().replace(/[^a-z]/g, '')}`,
          }
        : null,
      claimed_problem: claimedProblem,
      rounds: roundBreakdowns,
      ledger: ledgerEntries || [],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

