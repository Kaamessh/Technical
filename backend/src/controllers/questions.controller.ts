import { Response } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware.js';

export async function createQuizQuestion(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, question_text, options, correct_index } = req.body;
    if (!event_id || !question_text || !Array.isArray(options) || correct_index === undefined) {
      return res.status(400).json({ error: 'event_id, question_text, options (array), and correct_index required' });
    }

    const { data: q, error } = await supabase
      .from('quiz_questions')
      .insert({ event_id, question_text, options, correct_index })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(q);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getQuizQuestionsByEvent(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data: questions, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(questions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteQuizQuestion(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Quiz question deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
