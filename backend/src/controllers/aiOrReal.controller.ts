import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';

import { cleanImagePath } from '../utils/imageSanitizer';

export async function createAiOrRealChallenge(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, image_a_url, image_b_url, correct_side } = req.body;
    if (!event_id || !image_a_url || !image_b_url || !['A', 'B'].includes(correct_side)) {
      return res.status(400).json({ error: 'event_id, image_a_url, image_b_url, and correct_side ("A" or "B") required' });
    }

    const cleanA = cleanImagePath(image_a_url);
    const cleanB = cleanImagePath(image_b_url);

    const { data: challenge, error } = await supabase
      .from('ai_or_real_challenges')
      .insert({ event_id, image_a_url: cleanA, image_b_url: cleanB, correct_side })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(challenge);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getAiOrRealChallengesByEvent(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data: challenges, error } = await supabase
      .from('ai_or_real_challenges')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(challenges);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteAiOrRealChallenge(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('ai_or_real_challenges').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'AI or Real challenge deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
