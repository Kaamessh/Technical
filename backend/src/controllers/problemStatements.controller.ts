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

// Get claims for a slot with enriched problem statement & team information
export async function getSlotClaims(req: any, res: Response) {
  try {
    const { slotId } = req.params;

    // Fetch slot to get event_id
    const { data: slot } = await supabase
      .from('slots')
      .select('id, event_id, slot_number, slot_code')
      .eq('id', slotId)
      .single();

    const [
      { data: claimsRow },
      { data: psRow },
    ] = await Promise.all([
      supabase
        .from('quiz_questions')
        .select('options')
        .eq('question_text', '__SLOT_PROBLEM_CLAIMS__')
        .limit(1)
        .single(),
      slot?.event_id
        ? supabase
            .from('quiz_questions')
            .select('options')
            .eq('event_id', slot.event_id)
            .eq('question_text', '__PROBLEM_STATEMENTS__')
            .single()
        : Promise.resolve({ data: null }),
    ]);

    const allStatements: ProblemStatement[] =
      psRow && Array.isArray(psRow.options) ? (psRow.options as ProblemStatement[]) : [];

    const rawClaims: any[] =
      claimsRow && Array.isArray(claimsRow.options)
        ? claimsRow.options.filter((c: any) => c.slot_id === slotId)
        : [];

    // Map each claim with full problem statement metadata
    const enrichedClaims = rawClaims.map((c: any) => {
      const problem =
        allStatements.find((p) => p.id === c.problem_id) ||
        allStatements[c.card_index];
      return {
        slot_id: c.slot_id,
        team_id: c.team_id,
        team_name: c.team_name,
        card_index: c.card_index,
        card_number: (c.card_index !== undefined ? c.card_index : 0) + 1,
        problem_id: c.problem_id || problem?.id,
        problem_title: problem?.title || c.problem_title || 'Assigned Problem Statement',
        category: problem?.category || c.category || 'General',
        description: problem?.description || c.description || '',
        claimed_at: c.claimed_at,
      };
    });

    return res.json(enrichedClaims);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
