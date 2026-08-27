import { supabase } from '../services/supabaseClient';
import { getSlotLimits, getSlotTimerState } from '../services/slotLimits.service';

async function diagnoseTeam() {
  console.log('=== DIAGNOSING TEAM "rfaefdawr" & CURRENT SLOT ===\n');

  const { data: teams, error: tErr } = await supabase
    .from('teams')
    .select('*')
    .ilike('team_name', '%rfaefdawr%');

  console.log('TEAMS FOUND:', teams);

  if (teams && teams.length > 0) {
    const team = teams[0];
    const slotId = team.slot_id;
    console.log(`Team: ${team.team_name} (ID: ${team.id}), Slot ID: ${slotId}`);

    const { data: slot } = await supabase.from('slots').select('*').eq('id', slotId).single();
    console.log('SLOT RECORD:', slot);

    const slotLimits = await getSlotLimits(slotId);
    console.log('SLOT LIMITS:', slotLimits);

    const timerState = await getSlotTimerState(slotId);
    console.log('TIMER STATE:', timerState);

    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('*')
      .eq('team_id', team.id);
    console.log('TEAM PROGRESS:', progress);

    const { data: ledger } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('team_id', team.id);
    console.log('POINTS LEDGER:', ledger);

    const { data: allQuestions } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options')
      .eq('event_id', team.event_id);

    const validQuestions = (allQuestions || []).filter(
      (q) => q.question_text && !q.question_text.startsWith('__') && Array.isArray(q.options)
    );
    console.log(`VALID QUIZ QUESTIONS COUNT: ${validQuestions.length}`);

    // Now test what getRound1Question logic returns
    const completedQuestionIds = (ledger || [])
      .filter((l) => l.reason && l.reason.startsWith('round1_attempt:'))
      .map((l) => l.reason.replace('round1_attempt:', '').trim())
      .filter(Boolean);

    console.log('Completed question IDs for this team:', completedQuestionIds);

    const unattempted = validQuestions.filter((q) => !completedQuestionIds.includes(q.id));
    console.log('Unattempted questions count:', unattempted.length);

    if (slot.status !== 'in_progress') {
      console.log('--> SLOT STATUS IS NOT "in_progress". IT IS:', slot.status);
    } else {
      console.log('--> SLOT STATUS IS "in_progress". NEXT QUESTION ID:', unattempted[0]?.id);
    }
  }
}

diagnoseTeam().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
