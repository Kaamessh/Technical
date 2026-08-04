import { Response } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware.js';

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

export async function upsertTeamDecodeWord(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { team_id, word, letter_numbers, binary_clue } = req.body;
    if (!team_id || !word) {
      return res.status(400).json({ error: 'team_id and word required' });
    }

    const computedNumbers = Array.isArray(letter_numbers) && letter_numbers.length === 8
      ? letter_numbers
      : wordToLetterNumbers(word);

    const clue = binary_clue || '1111';

    const { data: decodeRecord, error } = await supabase
      .from('team_decode_words')
      .upsert({
        team_id,
        word: word.trim(),
        letter_numbers: computedNumbers,
        binary_clue: clue,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(decodeRecord);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function bulkGenerateForSlot(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { slot_id } = req.body;
    if (!slot_id) return res.status(400).json({ error: 'slot_id required' });

    // Fetch all teams in slot
    const { data: teams, error: teamsErr } = await supabase
      .from('teams')
      .select('id, team_name')
      .eq('slot_id', slot_id);

    if (teamsErr || !teams || teams.length === 0) {
      return res.status(404).json({ error: 'No teams found for this slot' });
    }

    const sampleWords = ['elephant', 'cyberpunk', 'quantum', 'starlight', 'algorithm', 'phoenix', 'catalyst', 'vanguard'];
    const sampleBinaries = ['1111', '1010', '1100', '1001', '0111', '1110', '0101', '1011'];

    const upserts = teams.map((team, idx) => {
      const word = sampleWords[idx % sampleWords.length];
      const binary_clue = sampleBinaries[idx % sampleBinaries.length];
      return {
        team_id: team.id,
        word,
        letter_numbers: wordToLetterNumbers(word),
        binary_clue,
      };
    });

    const { data: created, error } = await supabase
      .from('team_decode_words')
      .upsert(upserts)
      .select();

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: `Generated decode words for ${created?.length || 0} teams`, data: created });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
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
