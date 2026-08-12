import { supabase } from './supabaseClient';
import { broadcastToSlot } from './realtime.service';
import { getPMaxForRound } from './taskSettings.service';

/**
 * Core Formula:
 * TaskScore = round( P_max * (N - rank + 1) / N )
 *
 * Where:
 * - P_max: Maximum points set by admin for that task (e.g., 100)
 * - N: Number of teams in that specific slot
 * - rank: Order in which the team completed the task correctly (1 = 1st/fastest)
 */
export function calculateTaskScore(pMax: number, N: number, rank: number): number {
  if (N <= 0 || rank <= 0 || rank > N || pMax <= 0) return 0;
  return Math.round((pMax * (N - rank + 1)) / N);
}

export async function completeTeamRound(
  teamId: string,
  slotId: string,
  roundNumber: number,
  timeTakenSeconds: number,
  manualPoints?: number,
  reasonStr?: string
) {
  // 1. Fetch total registered teams in this slot (N)
  const { data: slotTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('slot_id', slotId);

  const N = slotTeams && slotTeams.length > 0 ? slotTeams.length : 1;
  const pMax = getPMaxForRound(roundNumber);

  // If this is a pass/fail round (like Round 5 password) or an explicit 0-point completion (did_not_finish / wrong answer)
  const isZeroPointsAttempt = manualPoints === 0 || pMax === 0;

  let computedRank = 0;
  let finalPoints = 0;
  const nowIso = new Date().toISOString();
  const timestampMs = Date.now();

  if (isZeroPointsAttempt) {
    computedRank = 0;
    finalPoints = manualPoints !== undefined ? manualPoints : 0;
  } else {
    // Record / Update this team's completion timestamp
    await supabase.from('team_round_progress').upsert({
      team_id: teamId,
      round_number: roundNumber,
      completed_at: nowIso,
      time_taken_seconds: timeTakenSeconds,
      points_awarded: 0,
      status: 'completed',
    });

    // 2. Fetch all completed teams in this slot for this round, sorted by completion timestamp ascending
    const teamIds = slotTeams.map((t) => t.id);
    const { data: completions } = await supabase
      .from('team_round_progress')
      .select('team_id, completed_at')
      .in('team_id', teamIds)
      .eq('round_number', roundNumber)
      .eq('status', 'completed');

    // Sort by timestamp with millisecond precision
    const sortedCompletions = completions
      ? [...completions].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
      : [];

    // Find this team's 1-based rank
    const teamRankIdx = sortedCompletions.findIndex((c) => c.team_id === teamId);
    computedRank = teamRankIdx !== -1 ? teamRankIdx + 1 : sortedCompletions.length;

    // Calculate TaskScore using Core Formula
    finalPoints = calculateTaskScore(pMax, N, computedRank);

    // 3. Recalculate and update scores for all completed non-overridden teams in this slot for this round
    for (let i = 0; i < sortedCompletions.length; i++) {
      const comp = sortedCompletions[i];
      const rankIdx = i + 1;
      const score = calculateTaskScore(pMax, N, rankIdx);

      // Check if team has a manual override
      const { data: existingLedger } = await supabase
        .from('points_ledger')
        .select('id, reason')
        .eq('team_id', comp.team_id)
        .eq('round_number', roundNumber);

      const hasManualOverride = existingLedger && existingLedger.some((l) => l.reason?.includes('MANUAL_OVERRIDE'));

      if (!hasManualOverride) {
        // Update points_ledger
        await supabase
          .from('points_ledger')
          .delete()
          .eq('team_id', comp.team_id)
          .eq('round_number', roundNumber);

        await supabase.from('points_ledger').insert({
          team_id: comp.team_id,
          round_number: roundNumber,
          points: score,
          reason: `Task ${roundNumber} score: P_max=${pMax}, N=${N}, Rank=${rankIdx}`,
        });

        // Update progress points_awarded
        await supabase
          .from('team_round_progress')
          .update({ points_awarded: score })
          .eq('team_id', comp.team_id)
          .eq('round_number', roundNumber);
      }
    }
  }

  // Handle 0-point or manual override entries
  if (isZeroPointsAttempt) {
    const { data: existingLedger } = await supabase
      .from('points_ledger')
      .select('id, reason')
      .eq('team_id', teamId)
      .eq('round_number', roundNumber);

    const hasManualOverride = existingLedger && existingLedger.some((l) => l.reason?.includes('MANUAL_OVERRIDE'));

    if (!hasManualOverride) {
      await supabase
        .from('points_ledger')
        .delete()
        .eq('team_id', teamId)
        .eq('round_number', roundNumber);

      await supabase.from('points_ledger').insert({
        team_id: teamId,
        round_number: roundNumber,
        points: finalPoints,
        reason: reasonStr || `Task ${roundNumber} uncompleted/pass (0 pts)`,
      });

      await supabase.from('team_round_progress').upsert({
        team_id: teamId,
        round_number: roundNumber,
        completed_at: nowIso,
        time_taken_seconds: timeTakenSeconds,
        points_awarded: finalPoints,
        status: 'completed',
      });
    }
  }

  // 4. Broadcast leaderboard and round updates to slot channel
  await broadcastToSlot(slotId, 'leaderboard:update', {
    team_id: teamId,
    round_number: roundNumber,
    points: finalPoints,
    rank: computedRank,
  });

  await broadcastToSlot(slotId, 'round:advance', {
    team_id: teamId,
    next_round: roundNumber + 1,
  });

  return {
    rank: computedRank,
    points: finalPoints,
    pMax,
    N,
    timestampMs,
  };
}

/**
 * Recalculates all task scores for a given slot, applying the core formula
 * while respecting manual overrides.
 */
export async function recalculateSlotScores(slotId: string) {
  const { data: slotTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('slot_id', slotId);

  if (!slotTeams || slotTeams.length === 0) return;
  const N = slotTeams.length;
  const teamIds = slotTeams.map((t) => t.id);

  for (let roundNumber = 1; roundNumber <= 4; roundNumber++) {
    const pMax = getPMaxForRound(roundNumber);

    const { data: completions } = await supabase
      .from('team_round_progress')
      .select('team_id, completed_at')
      .in('team_id', teamIds)
      .eq('round_number', roundNumber)
      .eq('status', 'completed');

    if (!completions) continue;

    const sortedCompletions = [...completions].sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    for (let i = 0; i < sortedCompletions.length; i++) {
      const comp = sortedCompletions[i];
      const rankIdx = i + 1;
      const score = calculateTaskScore(pMax, N, rankIdx);

      const { data: existingLedger } = await supabase
        .from('points_ledger')
        .select('id, reason')
        .eq('team_id', comp.team_id)
        .eq('round_number', roundNumber);

      const hasManualOverride = existingLedger && existingLedger.some((l) => l.reason?.includes('MANUAL_OVERRIDE'));

      if (!hasManualOverride) {
        await supabase
          .from('points_ledger')
          .delete()
          .eq('team_id', comp.team_id)
          .eq('round_number', roundNumber);

        await supabase.from('points_ledger').insert({
          team_id: comp.team_id,
          round_number: roundNumber,
          points: score,
          reason: `Recalculated Task ${roundNumber}: P_max=${pMax}, N=${N}, Rank=${rankIdx}`,
        });

        await supabase
          .from('team_round_progress')
          .update({ points_awarded: score })
          .eq('team_id', comp.team_id)
          .eq('round_number', roundNumber);
      }
    }
  }

  await broadcastToSlot(slotId, 'leaderboard:update', { slot_id: slotId });
}
