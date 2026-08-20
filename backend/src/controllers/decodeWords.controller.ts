import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';
import { AuthenticatedTeamRequest } from '../middlewares/authTeam.middleware';

function wordToLetterNumbers(word: string): number[] {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  const result: number[] = [];
  for (let i = 0; i < clean.length && result.length < 8; i++) {
    result.push(clean.charCodeAt(i) - 96);
  }
  while (result.length < 8) {
    result.push(Math.floor(1 + Math.random() * 26));
  }
  return result;
}

function binaryToDecimal(binaryStr: string): number {
  const clean = binaryStr.replace(/[^01]/g, '');
  return clean ? parseInt(clean, 2) : 0;
}

function calculateFinalPassword(binaryClue: string, targetWord: string): string {
  const dec = binaryToDecimal(binaryClue);
  const cleanWord = targetWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  return `${dec}${cleanWord}`;
}

// Get the pool for an event
export async function getDecodePool(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', eventId)
      .eq('question_text', '__DECODE_POOL__')
      .single();

    if (!data) return res.json([]);
    return res.json(data.options || []);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Add a word to the pool
export async function addWordToPool(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, binary_clue, target_word } = req.body;
    if (!event_id || !binary_clue || !target_word) {
      return res.status(400).json({ error: 'event_id, binary_clue, and target_word required' });
    }

    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', event_id)
      .eq('question_text', '__DECODE_POOL__')
      .single();

    const newWord = {
      id: Math.random().toString(36).substring(7),
      binary_clue,
      target_word,
      letter_numbers: wordToLetterNumbers(target_word),
      final_password: calculateFinalPassword(binary_clue, target_word)
    };

    if (existing) {
      const options = Array.isArray(existing.options) ? [...existing.options, newWord] : [newWord];
      await supabase.from('quiz_questions').update({ options }).eq('id', existing.id);
    } else {
      await supabase.from('quiz_questions').insert({
        event_id,
        question_text: '__DECODE_POOL__',
        options: [newWord],
        correct_index: 0
      });
    }

    return res.status(201).json(newWord);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Remove a word from the pool
export async function removeWordFromPool(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { eventId, wordId } = req.params;
    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', eventId)
      .eq('question_text', '__DECODE_POOL__')
      .single();

    if (existing && Array.isArray(existing.options)) {
      const options = existing.options.filter((w: any) => w.id !== wordId);
      await supabase.from('quiz_questions').update({ options }).eq('id', existing.id);
    }
    return res.json({ message: 'Removed successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function bulkGenerateForSlot(req: AuthenticatedAdminRequest, res: Response) {
  // We no longer bulk generate random words. Instead, we assign from the pool dynamically when team joins.
  return res.json({ message: 'Dynamic pool assignment is active. Teams automatically receive words on join.' });
}

export async function getDecodeWordsByEvent(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data: teams } = await supabase
      .from('teams')
      .select('id, team_name, slot_id')
      .eq('event_id', eventId);

    if (!teams || teams.length === 0) return res.json([]);

    const teamIds = teams.map((t) => t.id);
    const { data: decodeWords, error } = await supabase
      .from('team_decode_words')
      .select('*')
      .in('team_id', teamIds);

    if (error) return res.status(500).json({ error: error.message });

    const merged = teams.map((t) => ({
      team_id: t.id,
      team_name: t.team_name,
      slot_id: t.slot_id,
      decode: decodeWords ? decodeWords.find((d) => d.team_id === t.id) || null : null,
    }));

    return res.json(merged);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
