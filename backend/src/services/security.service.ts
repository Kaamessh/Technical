import { supabase } from './supabaseClient';
import { broadcastToSlot } from './realtime.service';

export interface MalpracticeLog {
  id: string;
  team_id: string;
  team_name: string;
  slot_id: string;
  slot_code?: string;
  event_id?: string;
  round_number?: number;
  action_type: 'TAB_SWITCH' | 'DEVTOOLS_SHORTCUT' | 'RIGHT_CLICK_INSPECT' | 'DEVTOOLS_OPENED' | 'UNAUTHORIZED_ACTION';
  details: string;
  timestamp: string;
}

export async function logMalpracticeIncident(
  data: Omit<MalpracticeLog, 'id' | 'timestamp'> & { timestamp?: string }
): Promise<MalpracticeLog> {
  const newLog: MalpracticeLog = {
    id: `MAL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    team_id: data.team_id,
    team_name: data.team_name || 'Unknown Team',
    slot_id: data.slot_id,
    slot_code: data.slot_code || '',
    event_id: data.event_id || '',
    round_number: data.round_number || 1,
    action_type: data.action_type,
    details: data.details,
    timestamp: data.timestamp || new Date().toISOString(),
  };

  try {
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('id, options')
      .eq('question_text', '__MALPRACTICE_LOGS__')
      .limit(1)
      .single();

    let logs: MalpracticeLog[] = [];
    if (existing && Array.isArray(existing.options)) {
      logs = existing.options as MalpracticeLog[];
    }

    // Prepend latest log (keep up to last 1000 logs)
    logs.unshift(newLog);
    if (logs.length > 1000) {
      logs = logs.slice(0, 1000);
    }

    if (existing) {
      await supabase.from('quiz_questions').update({ options: logs }).eq('id', existing.id);
    } else {
      await supabase.from('quiz_questions').insert({
        event_id: data.event_id || '00000000-0000-0000-0000-000000000000',
        question_text: '__MALPRACTICE_LOGS__',
        options: logs,
        correct_index: 0,
      });
    }

    // Real-time broadcast to slot channel and global admin channel
    if (data.slot_id) {
      await broadcastToSlot(data.slot_id, 'malpractice:incident', newLog);
    }
  } catch (err) {
    console.error('Error recording malpractice log:', err);
  }

  return newLog;
}

export async function getMalpracticeLogs(filters?: {
  slot_id?: string;
  event_id?: string;
  team_id?: string;
}): Promise<MalpracticeLog[]> {
  try {
    const { data: row } = await supabase
      .from('quiz_questions')
      .select('options')
      .eq('question_text', '__MALPRACTICE_LOGS__')
      .limit(1)
      .single();

    if (row && Array.isArray(row.options)) {
      let logs = row.options as MalpracticeLog[];
      if (filters?.slot_id) {
        logs = logs.filter((l) => l.slot_id === filters.slot_id);
      }
      if (filters?.event_id) {
        logs = logs.filter((l) => !l.event_id || l.event_id === filters.event_id);
      }
      if (filters?.team_id) {
        logs = logs.filter((l) => l.team_id === filters.team_id);
      }
      return logs;
    }
  } catch (err) {
    console.error('Error fetching malpractice logs:', err);
  }

  return [];
}

export async function clearMalpracticeLogs(slotId?: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('id, options')
      .eq('question_text', '__MALPRACTICE_LOGS__')
      .limit(1)
      .single();

    if (!existing) return;

    if (!slotId) {
      await supabase.from('quiz_questions').update({ options: [] }).eq('id', existing.id);
    } else if (Array.isArray(existing.options)) {
      const remaining = (existing.options as MalpracticeLog[]).filter((l) => l.slot_id !== slotId);
      await supabase.from('quiz_questions').update({ options: remaining }).eq('id', existing.id);
    }
  } catch (err) {
    console.error('Error clearing malpractice logs:', err);
  }
}
