import { supabase } from '../services/supabaseClient';
import { getSlotTimerState } from '../services/slotLimits.service';

async function testGetRound1() {
  const slotId = 'b69df36a-4f50-4130-ab54-71dec5fad6a4';
  const teamId = '3ca7c934-eaca-4d04-90b9-8508abb80fdd';

  const timerState = await getSlotTimerState(slotId);
  console.log('timerState:', timerState);

  const [{ data: liveItem }, { data: pendingItem }, { data: totalQueue }] = await Promise.all([
    supabase
      .from('slot_question_queue')
      .select('*, quiz_questions(*)')
      .eq('slot_id', slotId)
      .eq('status', 'live')
      .order('sequence_order', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('slot_question_queue')
      .select('id, sequence_order, quiz_questions(*)')
      .eq('slot_id', slotId)
      .eq('status', 'pending')
      .order('sequence_order', { ascending: true })
      .limit(1)
      .single(),
    supabase
      .from('slot_question_queue')
      .select('id')
      .eq('slot_id', slotId)
      .limit(1),
  ]);

  console.log('liveItem:', liveItem);
  console.log('pendingItem:', pendingItem);
  console.log('totalQueue:', totalQueue);
}

testGetRound1().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
