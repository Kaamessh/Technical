import { Response } from 'express';
import { supabase } from '../services/supabaseClient.js';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware.js';

export async function createEvent(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Event name required' });

    const adminId = req.admin?.id;
    const { data: event, error } = await supabase
      .from('events')
      .insert({
        name,
        description: description || null,
        status: 'draft',
        created_by: adminId,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(event);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getEvents(req: any, res: Response) {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.json(events);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getEventById(req: any, res: Response) {
  try {
    const { id } = req.params;
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) return res.status(404).json({ error: 'Event not found' });
    return res.json(event);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function updateEvent(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const { data: event, error } = await supabase
      .from('events')
      .update({
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(event);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
