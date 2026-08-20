import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedAdminRequest } from '../middlewares/authAdmin.middleware';

export interface ProblemStatement {
  id: string;
  title: string;
  description: string;
  category?: string;
  created_at: string;
}

// Get all problem statements for an event
export async function getProblemStatements(req: any, res: Response) {
  try {
    const { eventId } = req.params;
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', eventId)
      .eq('question_text', '__PROBLEM_STATEMENTS__')
      .single();

    if (!data || !Array.isArray(data.options)) {
      return res.json([]);
    }

    return res.json(data.options);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Add a problem statement
export async function addProblemStatement(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { event_id, title, description, category } = req.body;
    if (!event_id || !title || !description) {
      return res.status(400).json({ error: 'event_id, title, and description are required' });
    }

    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', event_id)
      .eq('question_text', '__PROBLEM_STATEMENTS__')
      .single();

    const newStatement: ProblemStatement = {
      id: 'ps_' + Math.random().toString(36).substring(2, 10),
      title: title.trim(),
      description: description.trim(),
      category: category?.trim() || 'General',
      created_at: new Date().toISOString(),
    };

    if (existing) {
      const options = Array.isArray(existing.options) ? [...existing.options, newStatement] : [newStatement];
      await supabase.from('quiz_questions').update({ options }).eq('id', existing.id);
    } else {
      await supabase.from('quiz_questions').insert({
        event_id,
        question_text: '__PROBLEM_STATEMENTS__',
        options: [newStatement],
        correct_index: 0,
      });
    }

    return res.status(201).json(newStatement);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Update a problem statement
export async function updateProblemStatement(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { event_id, title, description, category } = req.body;

    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', event_id)
      .eq('question_text', '__PROBLEM_STATEMENTS__')
      .single();

    if (!existing || !Array.isArray(existing.options)) {
      return res.status(404).json({ error: 'Problem statement not found' });
    }

    const options = existing.options as ProblemStatement[];
    const idx = options.findIndex((ps) => ps.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Problem statement not found' });
    }

    options[idx] = {
      ...options[idx],
      title: title ? title.trim() : options[idx].title,
      description: description ? description.trim() : options[idx].description,
      category: category !== undefined ? category.trim() : options[idx].category,
    };

    await supabase.from('quiz_questions').update({ options }).eq('id', existing.id);
    return res.json(options[idx]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Delete a problem statement
export async function deleteProblemStatement(req: AuthenticatedAdminRequest, res: Response) {
  try {
    const { id } = req.params;
    const { eventId } = req.query;

    if (!eventId) {
      return res.status(400).json({ error: 'eventId query param required' });
    }

    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('event_id', eventId)
      .eq('question_text', '__PROBLEM_STATEMENTS__')
      .single();

    if (existing && Array.isArray(existing.options)) {
      const options = (existing.options as ProblemStatement[]).filter((ps) => ps.id !== id);
      await supabase.from('quiz_questions').update({ options }).eq('id', existing.id);
    }

    return res.json({ message: 'Deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// Get claims for a slot
export async function getSlotClaims(req: any, res: Response) {
  try {
    const { slotId } = req.params;
    const { data: row } = await supabase
      .from('quiz_questions')
      .select('options')
      .eq('question_text', '__SLOT_PROBLEM_CLAIMS__')
      .limit(1)
      .single();

    if (row && Array.isArray(row.options)) {
      const claims = row.options.filter((c: any) => c.slot_id === slotId);
      return res.json(claims);
    }

    return res.json([]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
