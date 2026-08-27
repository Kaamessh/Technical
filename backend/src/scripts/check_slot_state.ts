import { supabase } from '../services/supabaseClient';

async function diagnose() {
  console.log('=== DIAGNOSING SLOTS, TEAMS & QUEUE ===\n');

  const { data: slots } = await supabase.from('slots').select('*');
  console.log('SLOTS IN DB:');
  console.table(slots?.map(s => ({ id: s.id, name: s.slot_name || s.name, status: s.status, current_round: s.current_round, event_id: s.event_id })));

  const { data: teams } = await supabase.from('teams').select('id, team_name, email, slot_id');
  console.log('\nTEAMS IN DB:');
  console.table(teams?.map(t => ({ id: t.id, name: t.team_name, email: t.email, slot_id: t.slot_id })));

  const { data: queue } = await supabase.from('slot_question_queue').select('*');
  console.log('\nSLOT QUESTION QUEUE:');
  console.table(queue?.map(q => ({ id: q.id, slot_id: q.slot_id, seq: q.sequence_order, status: q.status, live_started_at: q.live_started_at })));

  const { data: progress } = await supabase.from('team_round_progress').select('*');
  console.log('\nTEAM ROUND PROGRESS:');
  console.table(progress?.map(p => ({ team_id: p.team_id, round: p.round_number, status: p.status, completed_at: p.completed_at })));

  const { data: ledger } = await supabase.from('points_ledger').select('*');
  console.log('\nPOINTS LEDGER:');
  console.table(ledger?.map(l => ({ team_id: l.team_id, round: l.round_number, pts: l.points, reason: l.reason })));
}

diagnose().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
