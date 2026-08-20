import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';
import { AuthenticatedTeamRequest } from '../middlewares/authTeam.middleware';
import { broadcastToSlot } from '../services/realtime.service';
import { signTeamToken } from '../utils/jwt';
import { setSlotLimits, getSlotLimits, getAllSlotLimits } from '../services/slotLimits.service';

export async function createSlot(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, slot_number, custom_code, r3_question_limit, r4_question_limit, r6_question_limit } = req.body;
    if (!event_id || !slot_number) {
      return res.status(400).json({ error: 'event_id and slot_number required' });
    }

    const slot_code = custom_code
      ? custom_code.trim().toUpperCase()
      : `SLOT-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: slot, error } = await supabase
      .from('slots')
      .insert({
        event_id,
        slot_number,
        slot_code,
        status: 'scheduled',
        current_round: 1,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    const r3Limit = Number(r3_question_limit) || 1;
    const r4Limit = Number(r4_question_limit) || 1;
    const r6Limit = Number(r6_question_limit) || 6;
    await setSlotLimits(slot.id, r3Limit, r4Limit, event_id, r6Limit);

    return res.status(201).json({
      ...slot,
      r3_question_limit: r3Limit,
      r4_question_limit: r4Limit,
      r6_question_limit: r6Limit,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSlotsByEvent(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const [{ data: slots, error }, limits] = await Promise.all([
      supabase
        .from('slots')
        .select('*')
        .eq('event_id', eventId)
        .order('slot_number', { ascending: true }),
      getAllSlotLimits(),
    ]);

    if (error) return res.status(500).json({ error: error.message });

    const slotsWithLimits = (slots || []).map((s) => ({
      ...s,
      r3_question_limit: limits[s.id]?.r3_limit || 1,
      r4_question_limit: limits[s.id]?.r4_limit || 1,
      r6_question_limit: limits[s.id]?.r6_limit || 6,
    }));

    return res.json(slotsWithLimits);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getSlotStatus(req: any, res: Response) {
  try {
    const { id } = req.params;
    const [{ data: slot, error }, limits] = await Promise.all([
      supabase.from('slots').select('*').eq('id', id).single(),
      getSlotLimits(id),
    ]);

    if (error || !slot) return res.status(404).json({ error: 'Slot not found' });
    return res.json({
      ...slot,
      r3_question_limit: limits.r3_limit,
      r4_question_limit: limits.r4_limit,
      r6_question_limit: limits.r6_limit,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function joinSlot(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const { slot_code } = req.body;
    if (!slot_code) return res.status(400).json({ error: 'slot_code required' });

    // Lookup slot
    const { data: slot, error: slotErr } = await supabase
      .from('slots')
      .select('*')
      .eq('slot_code', slot_code.trim().toUpperCase())
      .single();

    if (slotErr || !slot) {
      return res.status(404).json({ error: 'Invalid slot code' });
    }

    if (slot.status === 'completed') {
      return res.status(400).json({ error: 'This slot has already completed.' });
    }

    // Only allow joining if slot is explicitly 'open'
    if (slot.status !== 'open') {
      return res.status(400).json({ error: 'Registration is not open or game has already started.' });
    }

    // Update team's slot_id
    const { data: updatedTeam, error: teamErr } = await supabase
      .from('teams')
      .update({ slot_id: slot.id })
      .eq('id', teamId)
      .select()
      .single();

    if (teamErr) return res.status(500).json({ error: teamErr.message });

    // Initialize round 1 progress row for team if not exists
    await supabase.from('team_round_progress').upsert({
      team_id: teamId,
      round_number: 1,
      started_at: new Date().toISOString(),
      status: 'in_progress',
    });

    // --- Dynamic Pool Assignment ---
    const { data: existingWord } = await supabase.from('team_decode_words').select('id').eq('team_id', teamId).single();

    if (!existingWord) {
      const { data: poolData } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('event_id', slot.event_id)
        .eq('question_text', '__DECODE_POOL__')
        .single();

      let assignedPoolWord = null;
      if (poolData && Array.isArray(poolData.options) && poolData.options.length > 0) {
        const { data: eventTeams } = await supabase.from('teams').select('id').eq('event_id', slot.event_id);
        const eventTeamIds = eventTeams ? eventTeams.map((t) => t.id) : [];

        const { data: assignedWords } = await supabase
          .from('team_decode_words')
          .select('word, binary_clue')
          .in('team_id', eventTeamIds);

        const availableWords = poolData.options.filter((pw: any) => {
          return !assignedWords?.some((aw) => aw.word === pw.target_word && aw.binary_clue === pw.binary_clue);
        });

        if (availableWords.length > 0) {
          assignedPoolWord = availableWords[Math.floor(Math.random() * availableWords.length)];
        } else {
          assignedPoolWord = poolData.options[Math.floor(Math.random() * poolData.options.length)];
        }
      }

      if (assignedPoolWord) {
        await supabase.from('team_decode_words').insert({
          team_id: teamId,
          word: assignedPoolWord.target_word,
          letter_numbers: assignedPoolWord.letter_numbers,
          binary_clue: assignedPoolWord.binary_clue,
        });
      }
    }

    const token = signTeamToken({
      id: updatedTeam.id,
      team_name: updatedTeam.team_name,
      event_id: updatedTeam.event_id,
      slot_id: updatedTeam.slot_id,
    });

    return res.json({ team: updatedTeam, slot, token });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateSlotStatus(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, current_round, r3_question_limit, r4_question_limit, r6_question_limit } = req.body;

    const { data: slot, error } = await supabase
      .from('slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !slot) return res.status(404).json({ error: 'Slot not found' });

    // Restrict editing question limits to BEFORE event starts (scheduled or open status)
    if (r3_question_limit !== undefined || r4_question_limit !== undefined || r6_question_limit !== undefined) {
      if (slot.status === 'in_progress' || slot.status === 'completed') {
        return res.status(400).json({ error: 'Question limits cannot be edited once the event has started.' });
      }
      const currentLimits = await getSlotLimits(id);
      const newR3 = r3_question_limit !== undefined ? Number(r3_question_limit) : currentLimits.r3_limit;
      const newR4 = r4_question_limit !== undefined ? Number(r4_question_limit) : currentLimits.r4_limit;
      const newR6 = r6_question_limit !== undefined ? Number(r6_question_limit) : currentLimits.r6_limit;
      await setSlotLimits(id, newR3, newR4, slot.event_id, newR6);
    }

    // If starting Round 1 (transitioning to in_progress or starting queue), populate queue
    if (status === 'in_progress' && (slot.status === 'scheduled' || slot.status === 'open')) {
      const { data: teams } = await supabase.from('teams').select('id').eq('slot_id', id);
      const teamCount = teams ? teams.length : 1;
      const queueLength = Math.max(1, teamCount - 1);

      const { data: questions } = await supabase
        .from('quiz_questions')
        .select('id')
        .eq('event_id', slot.event_id)
        .neq('question_text', '__DECODE_POOL__')
        .neq('question_text', '__SLOT_LIMITS__');

      if (!questions || questions.length === 0) {
        throw new Error('Cannot start Round 1: No quiz questions found for this event.');
      }

      if (questions && questions.length > 0) {
        const shuffled = [...questions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, queueLength);

        await supabase.from('slot_question_queue').delete().eq('slot_id', id);

        const queuePayload = selected.map((q, idx) => ({
          slot_id: id,
          question_id: q.id,
          sequence_order: idx + 1,
          status: idx === 0 ? 'live' : 'pending',
          live_started_at: idx === 0 ? new Date().toISOString() : null,
        }));

        const { error: insertErr } = await supabase.from('slot_question_queue').insert(queuePayload);
        if (insertErr) {
          throw new Error('Queue insert error: ' + insertErr.message);
        }

        if (queuePayload.length > 0) {
          await broadcastToSlot(id, 'round:start_countdown', {
            slot_id: id,
            countdown_seconds: 3,
          });

          await broadcastToSlot(id, 'question:live', {
            slot_id: id,
            sequence_order: 1,
          });
        }
      }
    }

    let updatedSlot = slot;
    if (status !== undefined || current_round !== undefined) {
      const { data: resSlot, error: updateErr } = await supabase
        .from('slots')
        .update({
          ...(status !== undefined && { status }),
          ...(current_round !== undefined && { current_round }),
        })
        .eq('id', id)
        .select()
        .single();

      if (updateErr) return res.status(500).json({ error: updateErr.message });
      updatedSlot = resSlot;
    }

    const finalLimits = await getSlotLimits(id);

    return res.json({
      ...updatedSlot,
      r3_question_limit: finalLimits.r3_limit,
      r4_question_limit: finalLimits.r4_limit,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteSlot(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Slot deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
