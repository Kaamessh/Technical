import { supabase } from './supabaseClient';

export interface SlotQuestionLimit {
  slot_id: string;
  r3_limit: number;
  r4_limit: number;
  r6_limit?: number;
}

export async function getSlotLimits(slotId: string): Promise<{ r3_limit: number; r4_limit: number; r6_limit: number }> {
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
          r3_limit: Math.max(1, Number(match.r3_limit) || 1),
          r4_limit: Math.max(1, Number(match.r4_limit) || 1),
          r6_limit: Math.max(1, Number(match.r6_limit) || 6),
        };
      }
    }
  } catch (err) {}

  return { r3_limit: 1, r4_limit: 1, r6_limit: 6 };
}

export async function getAllSlotLimits(): Promise<Record<string, { r3_limit: number; r4_limit: number; r6_limit: number }>> {
  try {
    const { data: row } = await supabase
      .from('quiz_questions')
      .select('options')
      .eq('question_text', '__SLOT_LIMITS__')
      .limit(1)
      .single();

    if (row && Array.isArray(row.options)) {
      const result: Record<string, { r3_limit: number; r4_limit: number; r6_limit: number }> = {};
      (row.options as SlotQuestionLimit[]).forEach((o) => {
        if (o.slot_id) {
          result[o.slot_id] = {
            r3_limit: Math.max(1, Number(o.r3_limit) || 1),
            r4_limit: Math.max(1, Number(o.r4_limit) || 1),
            r6_limit: Math.max(1, Number(o.r6_limit) || 6),
          };
        }
      });
      return result;
    }
  } catch (err) {}
  return {};
}

export async function setSlotLimits(slotId: string, r3Limit: number, r4Limit: number, eventId: string, r6Limit?: number): Promise<void> {
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
    const finalR6 = r6Limit !== undefined ? Math.max(1, r6Limit) : (existingLimit?.r6_limit || 6);

    const newEntry: SlotQuestionLimit = {
      slot_id: slotId,
      r3_limit: Math.max(1, r3Limit),
      r4_limit: Math.max(1, r4Limit),
      r6_limit: finalR6,
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
