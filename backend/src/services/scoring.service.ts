import { supabase } from './supabaseClient.js';
import { broadcastToSlot } from './realtime.service.js';

export function calculateRankPoints(rank: number): number {
  const scale = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10];
  if (rank >= 1 && rank <= scale.length) {
    return scale[rank - 1];
  }
  return Math.max(0, 100 - (rank - 1) * 10);
}

export async function completeTeamRound(
  teamId: string,
  slotId: string,
  roundNumber: number,
  timeTakenSeconds: number,
  manualPoints?: number,
  reasonStr?: string
) {
  // 1. Calculate how many teams in this slot have ALREADY completed this round to determine rank
  const { data: slotTeams } = await supabase
    .from('teams')
    .select('id')
    .eq('slot_id', slotId);

  const teamIds = slotTeams ? slotTeams.map((t) => t.id) : [teamId];

  const { data: existingCompletions } = await supabase
    .from('team_round_progress')
    .select('team_id')
    .in('team_id', teamIds)
    .eq('round_number', roundNumber)
    .eq('status', 'completed');

  const rank = (existingCompletions ? existingCompletions.length : 0) + 1;
  const points = manualPoints !== undefined ? manualPoints : calculateRankPoints(rank);
  const reason = reasonStr || `auto: round ${roundNumber} finish rank ${rank}`;

  // 2. Update team_round_progress
  const { data: progressData, error: progressErr } = await supabase
    .from('team_round_progress')
    .upsert({
      team_id: teamId,
      round_number: roundNumber,
      completed_at: new Date().toISOString(),
      time_taken_seconds: timeTakenSeconds,
      points_awarded: points,
      status: 'completed',
    })
    .select()
    .single();

  if (progressErr) {
    console.error('Error updating team round progress:', progressErr);
  }

  // 3. Write entry to points_ledger
  const { error: ledgerErr } = await supabase.from('points_ledger').insert({
    team_id: teamId,
    round_number: roundNumber,
    points,
    reason,
  });

  if (ledgerErr) {
    console.error('Error adding points ledger entry:', ledgerErr);
  }

  // 4. Broadcast leaderboard update
  await broadcastToSlot(slotId, 'leaderboard:update', {
    team_id: teamId,
    round_number: roundNumber,
    points,
  });

  // 5. Broadcast round advance for the team
  await broadcastToSlot(slotId, 'round:advance', {
    team_id: teamId,
    next_round: roundNumber + 1,
  });

  return { rank, points, progress: progressData };
}
