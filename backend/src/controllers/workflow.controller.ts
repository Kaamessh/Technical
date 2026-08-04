import { Response } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware.js';

export async function createWorkflowChallenge(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, title, image_urls } = req.body;
    if (!event_id || !Array.isArray(image_urls) || image_urls.length < 2) {
      return res.status(400).json({ error: 'event_id and image_urls (array of at least 2 URLs) required' });
    }

    const { data: challenge, error } = await supabase
      .from('workflow_challenges')
      .insert({ event_id, title: title || 'Workflow Sequence Challenge', image_urls })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(challenge);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getWorkflowChallengesByEvent(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data: challenges, error } = await supabase
      .from('workflow_challenges')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(challenges);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function deleteWorkflowChallenge(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('workflow_challenges').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ message: 'Workflow challenge deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
