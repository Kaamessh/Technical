import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';

export async function createDataChallengeQuestion(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, question_text, options, correct_index } = req.body;
    if (!event_id || !question_text || !options || correct_index === undefined) {
      return res.status(400).json({ error: 'event_id, question_text, options, and correct_index required' });
    }

    const { data: q, error } = await supabase
      .from('data_challenge_questions')
      .insert({ event_id, question_text, options, correct_index })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(q);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateDataChallengeQuestion(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { question_text, options, correct_index } = req.body;

    const { data: q, error } = await supabase
      .from('data_challenge_questions')
      .update({
        ...(question_text !== undefined && { question_text }),
        ...(options !== undefined && { options }),
        ...(correct_index !== undefined && { correct_index }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(q);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getDataChallengeQuestionsByEvent(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data: questions, error } = await supabase
      .from('data_challenge_questions')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(questions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteDataChallengeQuestion(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('data_challenge_questions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Data challenge question deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
