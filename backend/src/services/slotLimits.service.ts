import { supabase } from './supabaseClient';

export interface SlotQuestionLimit {
  slot_id: string;
  r1_limit?: number;
  r3_limit: number;
  r4_limit: number;
  r6_limit?: number;
  started_at?: string;
  duration_seconds?: number;
}

export async function getSlotLimits(slotId: string): Promise<{
  r1_limit: number;
  r3_limit: number;
  r4_limit: number;
  r6_limit: number;
  started_at: string | null;
  duration_seconds: number;
}> {
  try {
    const { data: row } = await supabase
      .from('quiz_questions')
      .select('options')
      .eq('question_text', '__SLOT_LIMITS__')
      .limit(1)
      .single();

    if (row && Array.isArray(row.options)) {
      const match = (row.options as SlotQuestionLimit[]).find((o) => o.slot_id === slotId);
      if (match) {
        return {
          r1_limit: Math.max(1, Number(match.r1_limit) || 10),
          r3_limit: Math.max(1, Number(match.r3_limit) || 1),
          r4_limit: Math.max(1, Number(match.r4_limit) || 1),
          r6_limit: Math.max(1, Number(match.r6_limit) || 6),
          started_at: match.started_at || null,
          duration_seconds: match.duration_seconds || 1200, // 20 minutes default
        };
      }
    }
  } catch (err) {}

  return { r1_limit: 10, r3_limit: 1, r4_limit: 1, r6_limit: 6, started_at: null, duration_seconds: 1200 };
}

export async function getAllSlotLimits(): Promise<
  Record<string, { r1_limit: number; r3_limit: number; r4_limit: number; r6_limit: number; started_at: string | null; duration_seconds: number }>
> {
  try {
    const { data: row } = await supabase
      .from('quiz_questions')
      .select('options')
      .eq('question_text', '__SLOT_LIMITS__')
      .limit(1)
      .single();

    if (row && Array.isArray(row.options)) {
      const result: Record<
        string,
        { r1_limit: number; r3_limit: number; r4_limit: number; r6_limit: number; started_at: string | null; duration_seconds: number }
      > = {};
      (row.options as SlotQuestionLimit[]).forEach((o) => {
        if (o.slot_id) {
          result[o.slot_id] = {
            r1_limit: Math.max(1, Number(o.r1_limit) || 10),
            r3_limit: Math.max(1, Number(o.r3_limit) || 1),
            r4_limit: Math.max(1, Number(o.r4_limit) || 1),
            r6_limit: Math.max(1, Number(o.r6_limit) || 6),
            started_at: o.started_at || null,
            duration_seconds: o.duration_seconds || 1200,
          };
        }
      });
      return result;
    }
  } catch (err) {}
  return {};
}

export async function setSlotLimits(
  slotId: string,
  r3Limit: number,
  r4Limit: number,
  eventId: string,
  r6Limit?: number,
  startedAt?: string,
  durationSeconds?: number,
  r1Limit?: number
): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('id, options')
      .eq('question_text', '__SLOT_LIMITS__')
      .limit(1)
      .single();

    let options: SlotQuestionLimit[] = [];
    if (existing && Array.isArray(existing.options)) {
      options = existing.options as SlotQuestionLimit[];
    }

    const index = options.findIndex((o) => o.slot_id === slotId);
    const existingLimit = index !== -1 ? options[index] : null;
    const finalR1 = r1Limit !== undefined ? Math.max(1, r1Limit) : existingLimit?.r1_limit || 10;
    const finalR6 = r6Limit !== undefined ? Math.max(1, r6Limit) : existingLimit?.r6_limit || 6;
    const finalStartedAt = startedAt !== undefined ? startedAt : existingLimit?.started_at;
    const finalDuration = durationSeconds !== undefined ? durationSeconds : existingLimit?.duration_seconds || 1200;

    const newEntry: SlotQuestionLimit = {
      slot_id: slotId,
      r1_limit: finalR1,
      r3_limit: Math.max(1, r3Limit),
      r4_limit: Math.max(1, r4Limit),
      r6_limit: finalR6,
      started_at: finalStartedAt,
      duration_seconds: finalDuration,
    };

    if (index !== -1) {
      options[index] = newEntry;
    } else {
      options.push(newEntry);
    }

    if (existing) {
      await supabase.from('quiz_questions').update({ options }).eq('id', existing.id);
    } else {
      await supabase.from('quiz_questions').insert({
        event_id: eventId,
        question_text: '__SLOT_LIMITS__',
        options,
        correct_index: 0,
      });
    }
  } catch (err) {
    console.error('Error saving slot limits:', err);
  }
}

export async function setSlotStartTime(slotId: string, startedAtIso: string, durationSeconds = 1200, eventId?: string): Promise<void> {
  try {
    const currentLimits = await getSlotLimits(slotId);
    await setSlotLimits(
      slotId,
      currentLimits.r3_limit,
      currentLimits.r4_limit,
      eventId || 'default_event',
      currentLimits.r6_limit,
      startedAtIso,
      durationSeconds,
      currentLimits.r1_limit
    );
  } catch (err) {
    console.error('Error setting slot start time:', err);
  }
}

export async function getSlotTimerState(slotId: string): Promise<{
  started_at: string | null;
  duration_seconds: number;
  remaining_seconds: number;
  is_started: boolean;
  is_expired: boolean;
}> {
  const limits = await getSlotLimits(slotId);
  const duration = limits.duration_seconds || 1200;
  const startedAt = limits.started_at;

  if (!startedAt) {
    return {
      started_at: null,
      duration_seconds: duration,
      remaining_seconds: duration,
      is_started: false,
      is_expired: false,
    };
  }

  const startMs = new Date(startedAt).getTime();
  const nowMs = Date.now();
  const isStarted = nowMs >= startMs;
  const elapsedSec = isStarted ? Math.floor((nowMs - startMs) / 1000) : 0;
  const remaining = Math.max(0, duration - elapsedSec);

  return {
    started_at: startedAt,
    duration_seconds: duration,
    remaining_seconds: remaining,
    is_started: isStarted,
    is_expired: isStarted && remaining <= 0,
  };
}
