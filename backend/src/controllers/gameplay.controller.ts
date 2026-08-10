import { Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedTeamRequest } from '../middlewares/authTeam.middleware';
import { completeTeamRound } from '../services/scoring.service';
import { broadcastToSlot } from '../services/realtime.service';
import { verifyFinalPassword } from '../utils/binaryDecode';

// Helper to get decode hint numbers for team
async function getTeamDecodeHintPair(teamId: string, pairIndex: number): Promise<number[] | null> {
  const { data: decodeData } = await supabase
    .from('team_decode_words')
    .select('letter_numbers')
    .eq('team_id', teamId)
    .single();

  if (decodeData && decodeData.letter_numbers && Array.isArray(decodeData.letter_numbers)) {
    const startIdx = (pairIndex - 1) * 2;
    return decodeData.letter_numbers.slice(startIdx, startIdx + 2);
  }
  return null;
}

// ROUND 1: Current live question
export async function getRound1Current(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const slotId = req.team?.slot_id;
    const teamId = req.team?.id;
    if (!slotId) return res.status(400).json({ error: 'Team is not assigned to a slot. Enter a slot code first.' });

    // Check team's round 1 progress
    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('*')
      .eq('team_id', teamId)
      .eq('round_number', 1)
      .single();

    if (progress && progress.status === 'completed') {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 1);
      return res.json({ completed: true, message: 'You have already completed Round 1', decode_hint: decodeHint });
    }

    // Fetch current live question queue item for slot
    const { data: queueItem } = await supabase
      .from('slot_question_queue')
      .select('id, question_id, sequence_order, status, live_started_at')
      .eq('slot_id', slotId)
      .eq('status', 'live')
      .single();

    if (!queueItem) {
      // Check if queue has pending questions or if all are won/expired
      const { data: pendingItem } = await supabase
        .from('slot_question_queue')
        .select('*')
        .eq('slot_id', slotId)
        .eq('status', 'pending')
        .order('sequence_order', { ascending: true })
        .limit(1)
        .single();

      if (pendingItem) {
        // Activate this pending question
        await supabase
          .from('slot_question_queue')
          .update({ status: 'live', live_started_at: new Date().toISOString() })
          .eq('id', pendingItem.id);

        const { data: q } = await supabase
          .from('quiz_questions')
          .select('id, question_text, options')
          .eq('id', pendingItem.question_id)
          .single();

        if (!q) {
          return res.status(500).json({ error: 'Pending question not found in database.' });
        }

        return res.json({
          completed: false,
          queue_id: pendingItem.id,
          sequence_order: pendingItem.sequence_order,
          question: q,
          live_started_at: pendingItem.live_started_at,
        });
      }

      // Check if queue was ever created for this slot
      const { data: allQueueItems } = await supabase
        .from('slot_question_queue')
        .select('id')
        .eq('slot_id', slotId);

      if (!allQueueItems || allQueueItems.length === 0) {
        return res.json({
          completed: false,
          question: null,
          message: 'Waiting for question broadcast.',
        });
      }

      // If queue exists and all questions are exhausted (won/expired), complete Round 1
      await completeTeamRound(teamId!, slotId, 1, 0, 0, 'auto: round 1 queue exhausted');
      return res.json({ completed: true, message: 'Round 1 queue exhausted. Moving to Round 2.', decode_hint: null });
    }

    // Fetch question details (sanitized)
    const { data: q } = await supabase
      .from('quiz_questions')
      .select('id, question_text, options')
      .eq('id', queueItem.question_id)
      .single();

    if (!q) {
      return res.status(500).json({ error: 'Live question not found in database.' });
    }

    return res.json({
      completed: false,
      queue_id: queueItem.id,
      sequence_order: queueItem.sequence_order,
      question: q,
      live_started_at: queueItem.live_started_at,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 1: Answer submission
export async function submitRound1Answer(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { queue_id, selected_index, time_taken } = req.body;

    if (!queue_id || selected_index === undefined) {
      return res.status(400).json({ error: 'queue_id and selected_index required' });
    }

    // Fetch queue item and full question
    const { data: queueItem } = await supabase
      .from('slot_question_queue')
      .select('*, quiz_questions(*)')
      .eq('id', queue_id)
      .single();

    if (!queueItem || queueItem.status !== 'live') {
      return res.status(400).json({ error: 'Question is no longer live or available.' });
    }

    const question = queueItem.quiz_questions;
    const isCorrect = question.correct_index === selected_index;
    const timeTakenSec = time_taken || (queueItem.live_started_at ? (Date.now() - new Date(queueItem.live_started_at).getTime()) / 1000 : 10);

    let pointsAwarded = 0;
    let decodeHint = null;

    if (isCorrect) {
      // Correct answer! Attempt ATOMIC row lock update
      const { data: lockResult } = await supabase
        .from('slot_question_queue')
        .update({
          status: 'won',
          won_by_team_id: teamId,
          won_at: new Date().toISOString(),
        })
        .eq('id', queue_id)
        .eq('status', 'live')
        .select();

      if (lockResult && lockResult.length > 0) {
        const result = await completeTeamRound(teamId!, slotId!, 1, timeTakenSec);
        pointsAwarded = result.points;
        decodeHint = await getTeamDecodeHintPair(teamId!, 1);

        // Broadcast winner to slot channel
        await broadcastToSlot(slotId!, 'question:won', {
          queue_id,
          won_by_team_id: teamId,
          team_name: req.team?.team_name,
        });

        // Advance queue: find next pending question
        const { data: nextPending } = await supabase
          .from('slot_question_queue')
          .select('id')
          .eq('slot_id', slotId)
          .eq('status', 'pending')
          .order('sequence_order', { ascending: true })
          .limit(1)
          .single();

        if (nextPending) {
          await supabase
            .from('slot_question_queue')
            .update({ status: 'live', live_started_at: new Date().toISOString() })
            .eq('id', nextPending.id);

          await broadcastToSlot(slotId!, 'question:live', {
            slot_id: slotId,
            queue_id: nextPending.id,
          });
        }
      }
    } else {
      // Incorrect answer: mark question expired & complete round with 0 pts
      await supabase
        .from('slot_question_queue')
        .update({ status: 'expired' })
        .eq('id', queue_id)
        .eq('status', 'live');

      await completeTeamRound(teamId!, slotId!, 1, timeTakenSec, 0, 'incorrect answer submitted');
      decodeHint = await getTeamDecodeHintPair(teamId!, 1);

      // Advance queue if pending question exists
      const { data: nextPending } = await supabase
        .from('slot_question_queue')
        .select('id')
        .eq('slot_id', slotId)
        .eq('status', 'pending')
        .order('sequence_order', { ascending: true })
        .limit(1)
        .single();

      if (nextPending) {
        await supabase
          .from('slot_question_queue')
          .update({ status: 'live', live_started_at: new Date().toISOString() })
          .eq('id', nextPending.id);

        await broadcastToSlot(slotId!, 'question:live', {
          slot_id: slotId,
          queue_id: nextPending.id,
        });
      }
    }

    return res.json({
      correct: isCorrect,
      points: pointsAwarded,
      decode_hint: decodeHint,
      message: isCorrect ? 'Correct answer!' : 'Incorrect choice submitted (0 pts).',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 2: Workflow challenge fetch
export async function getRound2Challenge(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const { data: challenge } = await supabase
      .from('workflow_challenges')
      .select('*')
      .eq('event_id', eventId)
      .limit(1)
      .single();

    if (!challenge) {
      return res.status(404).json({ error: 'No workflow challenge configured for this event.' });
    }

    // Return title and shuffled image URLs along with challenge ID
    const originalUrls = challenge.image_urls as string[];
    const indexed = originalUrls.map((url, index) => ({ url, originalIndex: index }));
    const shuffled = [...indexed].sort(() => 0.5 - Math.random());

    return res.json({
      id: challenge.id,
      title: challenge.title,
      items: shuffled,
      total_count: originalUrls.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 2: Submit workflow order
export async function submitRound2Workflow(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { challenge_id, submitted_urls, time_taken } = req.body;

    if (!challenge_id || !Array.isArray(submitted_urls)) {
      return res.status(400).json({ error: 'challenge_id and submitted_urls array required' });
    }

    const { data: challenge } = await supabase
      .from('workflow_challenges')
      .select('image_urls')
      .eq('id', challenge_id)
      .single();

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const correctOrder = challenge.image_urls as string[];
    const isCorrect = correctOrder.length === submitted_urls.length &&
      correctOrder.every((url, idx) => url === submitted_urls[idx]);

    if (!isCorrect) {
      return res.json({ correct: false, message: 'Incorrect workflow order. Rearrange the pieces and try again!' });
    }

    // Complete Round 2
    const result = await completeTeamRound(teamId!, slotId!, 2, time_taken || 15);
    const decodeHint = await getTeamDecodeHintPair(teamId!, 2);

    return res.json({
      correct: true,
      points: result.points,
      decode_hint: decodeHint,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 3: AI or Real challenge fetch
export async function getRound3Challenge(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const { data: challenge } = await supabase
      .from('ai_or_real_challenges')
      .select('id, image_a_url, image_b_url')
      .eq('event_id', eventId)
      .limit(1)
      .single();

    if (!challenge) {
      return res.status(404).json({ error: 'No AI or Real challenge configured for this event.' });
    }

    return res.json(challenge);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 3: Submit choice
export async function submitRound3AiOrReal(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { challenge_id, selected_side, time_taken } = req.body;

    if (!challenge_id || !['A', 'B'].includes(selected_side)) {
      return res.status(400).json({ error: 'challenge_id and selected_side ("A" or "B") required' });
    }

    const { data: challenge } = await supabase
      .from('ai_or_real_challenges')
      .select('correct_side')
      .eq('id', challenge_id)
      .single();

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    if (challenge.correct_side !== selected_side) {
      return res.json({ correct: false, message: 'Incorrect choice! Inspect the image details carefully.' });
    }

    const result = await completeTeamRound(teamId!, slotId!, 3, time_taken || 10);
    const decodeHint = await getTeamDecodeHintPair(teamId!, 3);

    return res.json({
      correct: true,
      points: result.points,
      decode_hint: decodeHint,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 4: Spot the Data Question fetch
export async function getRound4Question(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const { data: question } = await supabase
      .from('data_challenge_questions')
      .select('id, question_text, options')
      .eq('event_id', eventId)
      .limit(1)
      .single();

    if (!question) {
      return res.status(404).json({ error: 'No Data Challenge question configured for this event.' });
    }

    return res.json(question);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 4: Answer submission
export async function submitRound4Answer(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { question_id, selected_index, time_taken } = req.body;

    if (!question_id || selected_index === undefined) {
      return res.status(400).json({ error: 'question_id and selected_index required' });
    }

    const { data: question } = await supabase
      .from('data_challenge_questions')
      .select('correct_index')
      .eq('id', question_id)
      .single();

    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = question.correct_index === selected_index;
    const timeTakenSec = time_taken || 10;

    let result;
    if (isCorrect) {
      result = await completeTeamRound(teamId!, slotId!, 4, timeTakenSec);
    } else {
      result = await completeTeamRound(teamId!, slotId!, 4, timeTakenSec, 0, 'incorrect answer submitted');
    }

    const decodeHint = await getTeamDecodeHintPair(teamId!, 4);

    return res.json({
      correct: isCorrect,
      points: isCorrect ? result.points : 0,
      decode_hint: decodeHint,
      message: isCorrect ? 'Correct answer!' : 'Incorrect answer submitted.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 5: Clue & hint lookup
export async function getRound5Clue(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const { data: decodeRecord } = await supabase
      .from('team_decode_words')
      .select('binary_clue, letter_numbers')
      .eq('team_id', teamId)
      .single();

    if (!decodeRecord) {
      return res.status(404).json({ error: 'No decode word assigned for this team. Admin must assign a word.' });
    }

    return res.json({
      binary_clue: decodeRecord.binary_clue,
      letter_numbers: decodeRecord.letter_numbers,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 5: Verify Final Password
export async function verifyRound5Password(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { password, time_taken } = req.body;

    if (!password) return res.status(400).json({ error: 'Password string required' });

    const { data: decodeRecord } = await supabase
      .from('team_decode_words')
      .select('word, binary_clue')
      .eq('team_id', teamId)
      .single();

    if (!decodeRecord) {
      return res.status(404).json({ error: 'No decode word found for team.' });
    }

    const isValid = verifyFinalPassword(password, decodeRecord.binary_clue, decodeRecord.word);
    if (!isValid) {
      return res.json({ correct: false, message: 'Invalid password. Check your binary conversion and decoded word!' });
    }

    // Complete Round 5
    const result = await completeTeamRound(teamId!, slotId!, 5, time_taken || 20);

    return res.json({
      correct: true,
      completed: true,
      points: result.points,
      message: 'Congratulations! You have successfully completed the Event Gamification Platform challenge!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
