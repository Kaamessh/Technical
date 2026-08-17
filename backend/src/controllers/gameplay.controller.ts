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
      const decodeHint = await getTeamDecodeHintPair(teamId!, 1);
      return res.json({ completed: true, message: 'Round 1 queue exhausted. Moving to Round 2.', decode_hint: decodeHint });
    }

    // Check if team has already attempted this live question wrongly
    const { data: wrongAttempt } = await supabase
      .from('points_ledger')
      .select('id')
      .eq('team_id', teamId)
      .eq('round_number', 1)
      .eq('reason', `incorrect attempt: ${queueItem.id}`)
      .limit(1);

    if (wrongAttempt && wrongAttempt.length > 0) {
      // Check if any pending questions remain in queue
      const { data: nextPending } = await supabase
        .from('slot_question_queue')
        .select('id')
        .eq('slot_id', slotId)
        .eq('status', 'pending')
        .limit(1);

      if (!nextPending || nextPending.length === 0) {
        // No more pending questions in slot queue! Round 1 is finished for this team.
        await completeTeamRound(teamId!, slotId, 1, 0, 0, 'auto: round 1 last question attempted');
        const decodeHint = await getTeamDecodeHintPair(teamId!, 1);
        return res.json({ completed: true, message: 'Round 1 completed. Moving to Round 2.', decode_hint: decodeHint });
      }

      return res.json({
        completed: false,
        question: null,
        waiting_for_next: true,
        message: 'Incorrect answer submitted. Waiting for next question or round finish...',
      });
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
        // Winning team completes Round 1 & gets rank-based points
        const result = await completeTeamRound(teamId!, slotId!, 1, timeTakenSec);
        pointsAwarded = result.points;
        decodeHint = await getTeamDecodeHintPair(teamId!, 1);

        // Broadcast winner to slot channel
        await broadcastToSlot(slotId!, 'question:won', {
          queue_id,
          won_by_team_id: teamId,
          team_name: req.team?.team_name,
        });

        // Advance queue: find next pending question for remaining teams
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
      // Incorrect answer: record attempt so team cannot re-attempt this question
      await supabase.from('points_ledger').insert({
        team_id: teamId,
        round_number: 1,
        points: 0,
        reason: `incorrect attempt: ${queue_id}`,
      });

      // Check if all teams in slot have attempted this question wrongly
      const { data: slotTeams } = await supabase.from('teams').select('id').eq('slot_id', slotId);
      const totalSlotTeams = slotTeams ? slotTeams.length : 1;

      const { data: wrongAttempts } = await supabase
        .from('points_ledger')
        .select('team_id')
        .eq('round_number', 1)
        .eq('reason', `incorrect attempt: ${queue_id}`);

      const wrongTeamCount = wrongAttempts ? wrongAttempts.length : 0;

      // If all remaining teams guessed wrong, expire question & advance
      if (wrongTeamCount >= totalSlotTeams) {
        await supabase
          .from('slot_question_queue')
          .update({ status: 'expired' })
          .eq('id', queue_id)
          .eq('status', 'live');

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
    }

    // Check if any pending questions remain in queue for this slot
    const { data: remainingPending } = await supabase
      .from('slot_question_queue')
      .select('id')
      .eq('slot_id', slotId)
      .eq('status', 'pending')
      .limit(1);

    const hasNextPending = remainingPending && remainingPending.length > 0;

    if (!hasNextPending && !isCorrect) {
      // No more questions remain in slot queue! Complete Round 1 for team immediately.
      await completeTeamRound(teamId!, slotId!, 1, timeTakenSec, 0, 'completed last question in round 1');
      decodeHint = await getTeamDecodeHintPair(teamId!, 1);
      return res.json({
        correct: false,
        correct_option_index: question.correct_index,
        completed: true,
        points: 0,
        decode_hint: decodeHint,
        message: 'Round 1 completed. Moving to Round 2.',
      });
    }

    return res.json({
      correct: isCorrect,
      correct_option_index: question.correct_index,
      points: pointsAwarded,
      decode_hint: decodeHint,
      waiting_for_next: !isCorrect,
      message: isCorrect
        ? '🎉 Congratulations! Your answer is RIGHT!'
        : '❌ Wrong Answer! The correct answer is highlighted in green.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 2: Workflow challenge fetch
export async function getRound2Challenge(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const teamId = req.team?.id;

    // Check if team has already completed Round 2
    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('status')
      .eq('team_id', teamId)
      .eq('round_number', 2)
      .single();

    if (progress && progress.status === 'completed') {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 2);
      return res.json({ completed: true, message: 'Round 2 already completed!', decode_hint: decodeHint });
    }

    const { data: challenge } = await supabase
      .from('workflow_challenges')
      .select('*')
      .eq('event_id', eventId)
      .limit(1)
      .single();

    if (!challenge) {
      return res.status(404).json({ error: 'No workflow challenge configured for this event.' });
    }

    const rawUrls = (challenge.image_urls as string[]) || [];
    const distractorIdx = rawUrls.indexOf('__DISTRACTOR__');

    let realSteps: string[] = [];
    let distractorSteps: string[] = [];

    if (distractorIdx !== -1) {
      realSteps = rawUrls.slice(0, distractorIdx);
      distractorSteps = rawUrls.slice(distractorIdx + 1);
    } else {
      realSteps = rawUrls;
    }

    // Combine all steps (real + distractors) for shuffling
    const allSteps = [...realSteps, ...distractorSteps];
    const indexed = allSteps.map((label, index) => ({ id: `step-${index}`, label }));
    const shuffled = [...indexed].sort(() => 0.5 - Math.random());

    return res.json({
      id: challenge.id,
      title: challenge.title,
      total_slots: realSteps.length,
      real_count: realSteps.length,
      distractor_count: distractorSteps.length,
      items: shuffled,
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
    const { challenge_id, submitted_labels, submitted_urls, time_taken } = req.body;

    const labelsToTest = submitted_labels || submitted_urls;

    if (!challenge_id || !Array.isArray(labelsToTest)) {
      return res.status(400).json({ error: 'challenge_id and submitted_labels array required' });
    }

    const { data: challenge } = await supabase
      .from('workflow_challenges')
      .select('image_urls')
      .eq('id', challenge_id)
      .single();

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const rawUrls = (challenge.image_urls as string[]) || [];
    const distractorIdx = rawUrls.indexOf('__DISTRACTOR__');
    const realSteps = distractorIdx !== -1 ? rawUrls.slice(0, distractorIdx) : rawUrls;

    const isCorrect =
      realSteps.length === labelsToTest.length &&
      realSteps.every((stepLabel, idx) => stepLabel === labelsToTest[idx]);

    if (!isCorrect) {
      return res.json({
        correct: false,
        message: 'Oops! Try Again! Check your step sequence or remove irrelevant steps.',
      });
    }

    // Complete Round 2
    const result = await completeTeamRound(teamId!, slotId!, 2, time_taken || 15);
    const decodeHint = await getTeamDecodeHintPair(teamId!, 2);

    return res.json({
      correct: true,
      points: result.points,
      decode_hint: decodeHint,
      message: 'Great Job! Keep Going!',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 3: AI or Real challenge fetch
export async function getRound3Challenge(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const teamId = req.team?.id;
    const r3Limit = getRoundQuestionLimit(3);

    // Fetch team's existing attempts for Round 3
    const { data: ledgerEntries } = await supabase
      .from('points_ledger')
      .select('reason')
      .eq('team_id', teamId)
      .eq('round_number', 3);

    const completedChallengeIds = ledgerEntries
      ? ledgerEntries
          .map((l) => l.reason?.replace('round3_attempt: ', ''))
          .filter(Boolean)
      : [];

    // Check if team has reached question limit for Round 3
    if (completedChallengeIds.length >= r3Limit) {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 3);
      return res.json({ completed: true, message: 'Round 3 completed!', decode_hint: decodeHint });
    }

    // Fetch all challenges for event
    const { data: challenges } = await supabase
      .from('ai_or_real_challenges')
      .select('id, image_a_url, image_b_url')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (!challenges || challenges.length === 0) {
      return res.status(404).json({ error: 'No AI or Real challenge configured for this event.' });
    }

    // Pick first unattempted challenge
    const nextChallenge = challenges.find((c) => !completedChallengeIds.includes(c.id)) || challenges[0];

    return res.json({
      ...nextChallenge,
      question_number: completedChallengeIds.length + 1,
      total_questions: Math.min(r3Limit, challenges.length),
    });
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

    const isCorrect = challenge.correct_side === selected_side;

    // Record attempt for this challenge
    await supabase.from('points_ledger').insert({
      team_id: teamId,
      round_number: 3,
      points: isCorrect ? 10 : 0,
      reason: `round3_attempt: ${challenge_id}`,
    });

    const r3Limit = getRoundQuestionLimit(3);

    // Fetch count of Round 3 attempts for team
    const { data: ledgerEntries } = await supabase
      .from('points_ledger')
      .select('id')
      .eq('team_id', teamId)
      .eq('round_number', 3);

    const completedCount = ledgerEntries ? ledgerEntries.length : 1;

    // Fetch total available challenges
    const { data: allChallenges } = await supabase
      .from('ai_or_real_challenges')
      .select('id')
      .eq('event_id', req.team?.event_id);

    const maxAvailable = allChallenges ? allChallenges.length : 1;
    const targetLimit = Math.min(r3Limit, maxAvailable);

    if (completedCount >= targetLimit) {
      // Completed all required Round 3 questions! Complete Round 3 with normalized scoring
      const result = await completeTeamRound(teamId!, slotId!, 3, time_taken || 10);
      const decodeHint = await getTeamDecodeHintPair(teamId!, 3);

      return res.json({
        correct: isCorrect,
        completed: true,
        points: result.points,
        decode_hint: decodeHint,
        message: isCorrect ? 'Correct choice! Round 3 completed.' : 'Incorrect choice. Round 3 completed.',
      });
    }

    return res.json({
      correct: isCorrect,
      completed: false,
      has_next_question: true,
      message: isCorrect ? 'Correct choice! Advancing to next AI vs Real question...' : 'Incorrect choice. Advancing to next AI vs Real question...',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 4: Spot the Data Question fetch
export async function getRound4Question(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const teamId = req.team?.id;
    const r4Limit = getRoundQuestionLimit(4);

    const { data: ledgerEntries } = await supabase
      .from('points_ledger')
      .select('reason')
      .eq('team_id', teamId)
      .eq('round_number', 4);

    const completedQuestionIds = ledgerEntries
      ? ledgerEntries
          .map((l) => l.reason?.replace('round4_attempt: ', ''))
          .filter(Boolean)
      : [];

    if (completedQuestionIds.length >= r4Limit) {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 4);
      return res.json({ completed: true, message: 'Round 4 completed!', decode_hint: decodeHint });
    }

    const { data: questions } = await supabase
      .from('data_challenge_questions')
      .select('id, question_text, options')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No Data Challenge question configured for this event.' });
    }

    const nextQuestion = questions.find((q) => !completedQuestionIds.includes(q.id)) || questions[0];

    return res.json({
      ...nextQuestion,
      question_number: completedQuestionIds.length + 1,
      total_questions: Math.min(r4Limit, questions.length),
    });
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

    await supabase.from('points_ledger').insert({
      team_id: teamId,
      round_number: 4,
      points: isCorrect ? 10 : 0,
      reason: `round4_attempt: ${question_id}`,
    });

    const r4Limit = getRoundQuestionLimit(4);

    const { data: ledgerEntries } = await supabase
      .from('points_ledger')
      .select('id')
      .eq('team_id', teamId)
      .eq('round_number', 4);

    const completedCount = ledgerEntries ? ledgerEntries.length : 1;

    const { data: allQuestions } = await supabase
      .from('data_challenge_questions')
      .select('id')
      .eq('event_id', req.team?.event_id);

    const maxAvailable = allQuestions ? allQuestions.length : 1;
    const targetLimit = Math.min(r4Limit, maxAvailable);

    if (completedCount >= targetLimit) {
      const result = await completeTeamRound(teamId!, slotId!, 4, timeTakenSec, isCorrect ? undefined : 0);
      const decodeHint = await getTeamDecodeHintPair(teamId!, 4);

      return res.json({
        correct: isCorrect,
        completed: true,
        points: isCorrect ? result.points : 0,
        decode_hint: decodeHint,
        message: isCorrect ? 'Correct answer! Round 4 completed.' : 'Incorrect answer. Round 4 completed.',
      });
    }

    return res.json({
      correct: isCorrect,
      completed: false,
      has_next_question: true,
      message: isCorrect ? 'Correct answer! Advancing to next data question...' : 'Incorrect choice. Advancing to next data question...',
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
