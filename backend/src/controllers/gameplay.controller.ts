import { Request, Response } from 'express';
import { supabase } from '../services/supabaseClient';
import { AuthenticatedTeamRequest } from '../middlewares/authTeam.middleware';
import { completeTeamRound, calculateTaskScore } from '../services/scoring.service';
import { broadcastToSlot } from '../services/realtime.service';
import { getRoundQuestionLimit, getPMaxForRound } from '../services/taskSettings.service';
import { getSlotLimits, getSlotTimerState } from '../services/slotLimits.service';

// In-Memory Fast Atomic First-Answer Claim Lock (Reduces DB locks to <1ms)
const wonQuestionLocks = new Set<string>();

// Helper to retrieve team's assigned decode word hint pair for a round
async function getTeamDecodeHintPair(teamId: string, roundNumber: number): Promise<number[] | null> {
  try {
    const { data: decodeData } = await supabase
      .from('team_decode_words')
      .select('letter_numbers')
      .eq('team_id', teamId)
      .single();

    if (!decodeData || !Array.isArray(decodeData.letter_numbers)) return null;

    const fullLetters = decodeData.letter_numbers as number[];
    const startIdx = (roundNumber - 1) * 2;
    if (startIdx < fullLetters.length) {
      return fullLetters.slice(startIdx, startIdx + 2);
    }
    return null;
  } catch (err) {
    return null;
  }
}

// ROUND 1: Individual MCQ question fetch (Shuffled uniquely for each team)
export async function getRound1Question(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const eventId = req.team?.event_id;
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;

    if (!slotId) return res.status(400).json({ error: 'Team not assigned to a slot' });

    const [slotLimits, timerState, { data: slot }] = await Promise.all([
      getSlotLimits(slotId),
      getSlotTimerState(slotId),
      supabase.from('slots').select('id, status, current_round').eq('id', slotId).single(),
    ]);

    const r1Limit = slotLimits.r1_limit || 10;

    // Check if team has already completed Round 1
    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('status')
      .eq('team_id', teamId)
      .eq('round_number', 1)
      .single();

    if (progress && progress.status === 'completed') {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 1);
      return res.json({ completed: true, message: 'Round 1 completed!', decode_hint: decodeHint, timer: timerState });
    }

    // IF SLOT IS NOT YET IN_PROGRESS (e.g. 'scheduled' or 'open' registration), KEEP TEAMS IN LOBBY
    if (!slot || slot.status !== 'in_progress') {
      return res.json({
        waiting_for_next: true,
        slot_status: slot?.status || 'open',
        message: 'You have joined the slot. Waiting for the event organizer to start Round 1...',
        timer: timerState,
      });
    }

    const [{ data: ledgerEntries }, { data: allQuestions }] = await Promise.all([
      supabase
        .from('points_ledger')
        .select('reason')
        .eq('team_id', teamId)
        .eq('round_number', 1),
      supabase
        .from('quiz_questions')
        .select('id, question_text, options')
        .eq('event_id', eventId),
    ]);

    const validQuestions = (allQuestions || []).filter(
      (q) => q.question_text && !q.question_text.startsWith('__') && Array.isArray(q.options)
    );

    if (validQuestions.length === 0) {
      return res.status(404).json({ error: 'No quiz questions configured for this event.' });
    }

    const completedQuestionIds = ledgerEntries
      ? ledgerEntries
          .filter((l) => l.reason && l.reason.startsWith('round1_attempt:'))
          .map((l) => l.reason.replace('round1_attempt:', '').trim())
          .filter(Boolean)
      : [];

    const targetLimit = Math.min(r1Limit, validQuestions.length);

    if (completedQuestionIds.length >= targetLimit) {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 1);
      return res.json({ completed: true, message: 'Round 1 completed!', decode_hint: decodeHint, timer: timerState });
    }

    // Deterministic shuffle for this team using teamId seed
    // Guarantees the team always sees the EXACT same question until answered, while different teams see different orders!
    const sortedQuestions = [...validQuestions].sort((a, b) => {
      const hashA = (teamId + a.id).split('').reduce((acc: number, char: string) => (acc * 31 + char.charCodeAt(0)) % 1000003, 0);
      const hashB = (teamId + b.id).split('').reduce((acc: number, char: string) => (acc * 31 + char.charCodeAt(0)) % 1000003, 0);
      return hashA - hashB;
    });

    const unattempted = sortedQuestions.filter((q) => !completedQuestionIds.includes(q.id));

    if (unattempted.length === 0) {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 1);
      return res.json({ completed: true, message: 'Round 1 completed!', decode_hint: decodeHint, timer: timerState });
    }

    const nextQuestion = unattempted[0];

    return res.json({
      id: nextQuestion.id,
      question_id: nextQuestion.id,
      question_text: nextQuestion.question_text,
      options: nextQuestion.options,
      question_number: completedQuestionIds.length + 1,
      total_questions: targetLimit,
      live_started_at: timerState.started_at,
      timer: timerState,
      // Universal compatibility with any cached browser tabs
      question: {
        id: nextQuestion.id,
        question_text: nextQuestion.question_text,
        options: nextQuestion.options,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export const getRound1CurrentQuestion = getRound1Question;
export const getRound1Current = getRound1Question;

// ROUND 1: Submit individual MCQ choice (FAST & SYNCHRONOUS)
export async function submitRound1Answer(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const eventId = req.team?.event_id;
    const { question_id, queue_id, selected_index, time_taken } = req.body;

    const targetQId = question_id || queue_id;

    if (!targetQId || selected_index === undefined) {
      return res.status(400).json({ error: 'question_id and selected_index required' });
    }

    const [{ data: question }, slotLimits, { data: ledgerEntries }, { data: allQuestions }] = await Promise.all([
      supabase.from('quiz_questions').select('correct_index').eq('id', targetQId).single(),
      slotId ? getSlotLimits(slotId) : Promise.resolve({ r1_limit: 10, r3_limit: 1, r4_limit: 1, r6_limit: 6, started_at: null, duration_seconds: 1200 }),
      supabase.from('points_ledger').select('reason').eq('team_id', teamId).eq('round_number', 1),
      supabase.from('quiz_questions').select('id, question_text, options').eq('event_id', eventId),
    ]);

    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = question.correct_index === selected_index;
    const validQuestions = (allQuestions || []).filter(
      (q) => q.question_text && !q.question_text.startsWith('__') && Array.isArray(q.options)
    );

    const r1Limit = slotLimits.r1_limit || 10;
    const targetLimit = Math.min(r1Limit, validQuestions.length);

    // Save points ledger entry for this question attempt
    await supabase.from('points_ledger').insert({
      team_id: teamId,
      round_number: 1,
      points: isCorrect ? 10 : 0,
      reason: `round1_attempt: ${question_id}`,
    });

    const completedAttempts = ledgerEntries
      ? ledgerEntries.filter((l) => l.reason && l.reason.startsWith('round1_attempt:'))
      : [];

    const newCompletedCount = completedAttempts.length + 1;
    const isRoundCompleted = newCompletedCount >= targetLimit;

    let decodeHint: any = null;
    let finalPoints = isCorrect ? 10 : 0;

    if (isRoundCompleted) {
      const compResult = await completeTeamRound(teamId!, slotId!, 1, time_taken || 15);
      finalPoints = compResult.points;
      decodeHint = await getTeamDecodeHintPair(teamId!, 1);
    }

    return res.json({
      correct: isCorrect,
      correct_option_index: question.correct_index,
      points: finalPoints,
      completed: isRoundCompleted,
      has_next_question: !isRoundCompleted,
      decode_hint: decodeHint,
      message: isCorrect
        ? `🎉 CORRECT! +10 PTS!`
        : `❌ WRONG CHOICE! THE CORRECT ANSWER IS HIGHLIGHTED IN GREEN.`,
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

    const [{ data: progress }, { data: challenge }] = await Promise.all([
      supabase
        .from('team_round_progress')
        .select('status')
        .eq('team_id', teamId)
        .eq('round_number', 2)
        .single(),
      supabase
        .from('workflow_challenges')
        .select('*')
        .eq('event_id', eventId)
        .limit(1)
        .single(),
    ]);

    if (progress && progress.status === 'completed') {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 2);
      return res.json({ completed: true, message: 'Round 2 already completed!', decode_hint: decodeHint });
    }

    if (!challenge) {
      return res.status(404).json({ error: 'No workflow challenge configured for this event.' });
    }

    const rawUrls = ((challenge.image_urls as string[]) || []).map((s) =>
      String(s)
        .replace(/^Images\//i, '')
        .replace(/^%2FImages%2F/i, '')
        .replace(/^Images%2F/i, '')
    );
    const distractorIdx = rawUrls.findIndex((s) => s.includes('__DISTRACTOR__'));

    let realSteps: string[] = [];
    let distractorSteps: string[] = [];

    if (distractorIdx !== -1) {
      realSteps = rawUrls.slice(0, distractorIdx);
      distractorSteps = rawUrls.slice(distractorIdx + 1);
    } else {
      realSteps = rawUrls;
    }

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

    const rawLabels = submitted_labels || submitted_urls;

    if (!challenge_id || !Array.isArray(rawLabels)) {
      return res.status(400).json({ error: 'challenge_id and submitted_labels array required' });
    }

    const labelsToTest = rawLabels.map((s) =>
      String(s)
        .replace(/^Images\//i, '')
        .replace(/^%2FImages%2F/i, '')
        .replace(/^Images%2F/i, '')
    );

    const { data: challenge } = await supabase
      .from('workflow_challenges')
      .select('image_urls')
      .eq('id', challenge_id)
      .single();

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const rawUrls = ((challenge.image_urls as string[]) || []).map((s) =>
      String(s)
        .replace(/^Images\//i, '')
        .replace(/^%2FImages%2F/i, '')
        .replace(/^Images%2F/i, '')
    );
    const distractorIdx = rawUrls.findIndex((s) => s.includes('__DISTRACTOR__'));
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
    const slotId = req.team?.slot_id;
    
    const slotLimits = slotId ? await getSlotLimits(slotId) : { r3_limit: 1, r4_limit: 1 };
    const r3Limit = slotLimits.r3_limit || getRoundQuestionLimit(3);

    const [{ data: progress }, { data: ledgerEntries }, { data: challenges }] = await Promise.all([
      supabase
        .from('team_round_progress')
        .select('status')
        .eq('team_id', teamId)
        .eq('round_number', 3)
        .single(),
      supabase
        .from('points_ledger')
        .select('reason')
        .eq('team_id', teamId)
        .eq('round_number', 3),
      supabase
        .from('ai_or_real_challenges')
        .select('id, image_a_url, image_b_url')
        .eq('event_id', eventId),
    ]);

    if (progress && progress.status === 'completed') {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 3);
      return res.json({ completed: true, message: 'Round 3 completed!', decode_hint: decodeHint });
    }

    const completedChallengeIds = ledgerEntries
      ? ledgerEntries
          .filter((l) => l.reason && l.reason.startsWith('round3_attempt:'))
          .map((l) => l.reason.replace('round3_attempt:', '').trim())
          .filter(Boolean)
      : [];

    if (completedChallengeIds.length >= r3Limit) {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 3);
      return res.json({ completed: true, message: 'Round 3 completed!', decode_hint: decodeHint });
    }

    if (!challenges || challenges.length === 0) {
      return res.status(404).json({ error: 'No AI or Real challenge configured for this event.' });
    }

    const unattempted = challenges.filter((c) => !completedChallengeIds.includes(c.id));

    if (unattempted.length === 0) {
      const decodeHint = await getTeamDecodeHintPair(teamId!, 3);
      return res.json({ completed: true, message: 'Round 3 completed!', decode_hint: decodeHint });
    }

    const shuffledUnattempted = [...unattempted].sort(() => 0.5 - Math.random());
    const nextChallenge = shuffledUnattempted[0];

    return res.json({
      ...nextChallenge,
      question_number: completedChallengeIds.length + 1,
      total_questions: Math.min(r3Limit, challenges.length),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 3: Submit choice (FAST, SYNCHRONOUS & RELIABLE)
export async function submitRound3AiOrReal(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { challenge_id, selected_side, time_taken } = req.body;

    if (!challenge_id || !['A', 'B'].includes(selected_side)) {
      return res.status(400).json({ error: 'challenge_id and selected_side ("A" or "B") required' });
    }

    const [{ data: challenge }, slotLimits, { data: ledgerEntries }, { data: allChallenges }] = await Promise.all([
      supabase.from('ai_or_real_challenges').select('correct_side').eq('id', challenge_id).single(),
      slotId ? getSlotLimits(slotId) : Promise.resolve({ r3_limit: 1, r4_limit: 1, r6_limit: 6, started_at: null, duration_seconds: 1200 }),
      supabase.from('points_ledger').select('reason').eq('team_id', teamId).eq('round_number', 3),
      supabase.from('ai_or_real_challenges').select('id').eq('event_id', req.team?.event_id),
    ]);

    if (!challenge) return res.status(404).json({ error: 'Challenge not found' });

    const isCorrect = challenge.correct_side === selected_side;
    const r3Limit = slotLimits.r3_limit || getRoundQuestionLimit(3);
    const maxAvailable = allChallenges ? allChallenges.length : 1;
    const targetLimit = Math.min(r3Limit, maxAvailable);

    // Save points entry
    await supabase.from('points_ledger').insert({
      team_id: teamId,
      round_number: 3,
      points: isCorrect ? 10 : 0,
      reason: `round3_attempt: ${challenge_id}`,
    });

    const completedAttempts = ledgerEntries
      ? ledgerEntries.filter((l) => l.reason && l.reason.startsWith('round3_attempt:'))
      : [];

    const newCompletedCount = completedAttempts.length + 1;
    const isRoundCompleted = newCompletedCount >= targetLimit;

    let decodeHint: any = null;
    let finalPoints = isCorrect ? 10 : 0;

    if (isRoundCompleted) {
      const compResult = await completeTeamRound(teamId!, slotId!, 3, time_taken || 10);
      finalPoints = compResult.points;
      decodeHint = await getTeamDecodeHintPair(teamId!, 3);
    }

    return res.json({
      correct: isCorrect,
      correct_side: challenge.correct_side,
      points: finalPoints,
      completed: isRoundCompleted,
      has_next_question: !isRoundCompleted,
      decode_hint: decodeHint,
      message: isCorrect
        ? '🎉 SPOT ON! CORRECT AI IMAGE IDENTIFIED!'
        : '❌ WRONG SELECTION! THAT WAS A REAL IMAGE.',
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
    const slotId = req.team?.slot_id;

    const slotLimits = slotId ? await getSlotLimits(slotId) : { r3_limit: 1, r4_limit: 1, r6_limit: 6, started_at: null, duration_seconds: 1200 };
    const r4Limit = slotLimits.r4_limit || getRoundQuestionLimit(4);

    const [{ data: progress }, { data: ledgerEntries }, { data: questions }] = await Promise.all([
      supabase
        .from('team_round_progress')
        .select('status')
        .eq('team_id', teamId)
        .eq('round_number', 4)
        .single(),
      supabase
        .from('points_ledger')
        .select('reason')
        .eq('team_id', teamId)
        .eq('round_number', 4),
      supabase
        .from('data_challenge_questions')
        .select('id, question_text, options')
        .eq('event_id', eventId),
    ]);

    if (progress && progress.status === 'completed') {
      const { data: decodeData } = await supabase
        .from('team_decode_words')
        .select('letter_numbers, binary_clue')
        .eq('team_id', teamId)
        .single();
      const letters = Array.isArray(decodeData?.letter_numbers) ? (decodeData.letter_numbers as number[]).slice(6, 8) : null;
      return res.json({
        completed: true,
        message: 'Round 4 completed!',
        decode_hint: letters,
        binary_clue: decodeData?.binary_clue || null,
      });
    }

    const completedQuestionIds = ledgerEntries
      ? ledgerEntries
          .filter((l) => l.reason && l.reason.startsWith('round4_attempt:'))
          .map((l) => l.reason.replace('round4_attempt:', '').trim())
          .filter(Boolean)
      : [];

    if (completedQuestionIds.length >= r4Limit) {
      const { data: decodeData } = await supabase
        .from('team_decode_words')
        .select('letter_numbers, binary_clue')
        .eq('team_id', teamId)
        .single();
      const letters = Array.isArray(decodeData?.letter_numbers) ? (decodeData.letter_numbers as number[]).slice(6, 8) : null;
      return res.json({
        completed: true,
        message: 'Round 4 completed!',
        decode_hint: letters,
        binary_clue: decodeData?.binary_clue || null,
      });
    }

    if (!questions || questions.length === 0) {
      return res.status(404).json({ error: 'No Data Challenge question configured for this event.' });
    }

    const unattempted = questions.filter((q) => !completedQuestionIds.includes(q.id));

    if (unattempted.length === 0) {
      const { data: decodeData } = await supabase
        .from('team_decode_words')
        .select('letter_numbers, binary_clue')
        .eq('team_id', teamId)
        .single();
      const letters = Array.isArray(decodeData?.letter_numbers) ? (decodeData.letter_numbers as number[]).slice(6, 8) : null;
      return res.json({
        completed: true,
        message: 'Round 4 completed!',
        decode_hint: letters,
        binary_clue: decodeData?.binary_clue || null,
      });
    }

    const shuffledUnattempted = [...unattempted].sort(() => 0.5 - Math.random());
    const nextQuestion = shuffledUnattempted[0];

    return res.json({
      ...nextQuestion,
      question_number: completedQuestionIds.length + 1,
      total_questions: Math.min(r4Limit, questions.length),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 4: Answer submission (FAST, SYNCHRONOUS & RELIABLE)
export async function submitRound4Answer(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { question_id, selected_index, time_taken } = req.body;

    if (!question_id || selected_index === undefined) {
      return res.status(400).json({ error: 'question_id and selected_index required' });
    }

    const [{ data: question }, slotLimits, { data: ledgerEntries }, { data: allQuestions }] = await Promise.all([
      supabase.from('data_challenge_questions').select('correct_index').eq('id', question_id).single(),
      slotId ? getSlotLimits(slotId) : Promise.resolve({ r3_limit: 1, r4_limit: 1, r6_limit: 6, started_at: null, duration_seconds: 1200 }),
      supabase.from('points_ledger').select('reason').eq('team_id', teamId).eq('round_number', 4),
      supabase.from('data_challenge_questions').select('id').eq('event_id', req.team?.event_id),
    ]);

    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = question.correct_index === selected_index;
    const r4Limit = slotLimits.r4_limit || getRoundQuestionLimit(4);
    const maxAvailable = allQuestions ? allQuestions.length : 1;
    const targetLimit = Math.min(r4Limit, maxAvailable);

    // Record attempt
    await supabase.from('points_ledger').insert({
      team_id: teamId,
      round_number: 4,
      points: isCorrect ? 10 : 0,
      reason: `round4_attempt: ${question_id}`,
    });

    const completedAttempts = ledgerEntries
      ? ledgerEntries.filter((l) => l.reason && l.reason.startsWith('round4_attempt:'))
      : [];

    const newCompletedCount = completedAttempts.length + 1;
    const isRoundCompleted = newCompletedCount >= targetLimit;

    let decodeHint: any = null;
    let binaryClue: any = null;
    let finalPoints = isCorrect ? 10 : 0;

    if (isRoundCompleted) {
      const compResult = await completeTeamRound(teamId!, slotId!, 4, time_taken || 10, isCorrect ? undefined : 0);
      finalPoints = compResult.points;
      const { data: decodeData } = await supabase
        .from('team_decode_words')
        .select('letter_numbers, binary_clue')
        .eq('team_id', teamId)
        .single();
      decodeHint = Array.isArray(decodeData?.letter_numbers) ? (decodeData.letter_numbers as number[]).slice(6, 8) : null;
      binaryClue = decodeData?.binary_clue || null;
    }

    return res.json({
      correct: isCorrect,
      correct_option_index: question.correct_index,
      points: finalPoints,
      completed: isRoundCompleted,
      has_next_question: !isRoundCompleted,
      decode_hint: decodeHint,
      binary_clue: binaryClue,
      message: isCorrect ? '🎉 Correct answer!' : '❌ Incorrect choice.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 5: Clue & hint lookup
export async function getRound5Clue(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    if (!teamId) return res.status(400).json({ error: 'Team ID required' });

    const { data: decodeData, error } = await supabase
      .from('team_decode_words')
      .select('word, letter_numbers, binary_clue')
      .eq('team_id', teamId)
      .single();

    if (error || !decodeData) {
      return res.status(404).json({ error: 'Decode clue not found for this team.' });
    }

    return res.json(decodeData);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 5: Password verification
export async function verifyRound5Password(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const { password, time_taken } = req.body;

    if (!password) return res.status(400).json({ error: 'Password required' });

    const { data: decodeData } = await supabase
      .from('team_decode_words')
      .select('word, binary_clue')
      .eq('team_id', teamId)
      .single();

    if (!decodeData) return res.status(404).json({ error: 'Team decode data not found' });

    const cleanBinary = decodeData.binary_clue ? decodeData.binary_clue.replace(/[^01]/g, '') : '';
    const binaryDecimal = cleanBinary ? parseInt(cleanBinary, 2) : 0;
    const cleanWord = (decodeData.word || '').toLowerCase().replace(/[^a-z]/g, '').trim();
    const expectedPassword = `${binaryDecimal}${cleanWord}`;
    const submittedClean = String(password).toLowerCase().replace(/\s+/g, '').trim();

    if (submittedClean !== expectedPassword) {
      return res.json({
        correct: false,
        message: 'Invalid password. Check your binary to decimal conversion and decoded word (e.g. 885elephant)!',
      });
    }

    const result = await completeTeamRound(teamId!, slotId!, 5, time_taken || 30);

    return res.json({
      correct: true,
      points: result.points,
      rank: result.rank,
      next_round: 6,
      message: `🎉 CONGRATULATIONS! PASSWORD DECODED! You ranked #${result.rank} in your slot and earned +${result.points} PTS!`,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 6: Get problem statement selection cards
export async function getRound6Cards(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    const slotId = req.team?.slot_id;
    const eventId = req.team?.event_id;

    if (!slotId || !eventId) {
      return res.status(400).json({ error: 'Team slot or event not found' });
    }

    // Parallel fetch slot limits, problem statements pool, and existing claims
    const [limits, { data: psRow }, { data: claimsRow }] = await Promise.all([
      getSlotLimits(slotId),
      supabase
        .from('quiz_questions')
        .select('options')
        .eq('event_id', eventId)
        .eq('question_text', '__PROBLEM_STATEMENTS__')
        .single(),
      supabase
        .from('quiz_questions')
        .select('options')
        .eq('question_text', '__SLOT_PROBLEM_CLAIMS__')
        .limit(1)
        .single(),
    ]);

    const allStatements: any[] = psRow && Array.isArray(psRow.options) ? psRow.options : [];
    const r6Limit = limits.r6_limit || 6;
    const activeStatements = allStatements.slice(0, r6Limit);

    const allClaims: any[] = claimsRow && Array.isArray(claimsRow.options) ? claimsRow.options : [];
    const slotClaims = allClaims.filter((c: any) => c.slot_id === slotId);

    const myClaim = slotClaims.find((c: any) => c.team_id === teamId);

    // Build redacted card representations (no problem text sent to client for unclaimed/other teams' cards)
    const cards = activeStatements.map((ps: any, idx: number) => {
      const claim = slotClaims.find((c: any) => c.problem_id === ps.id || c.card_index === idx);
      const isClaimedByMe = myClaim && (myClaim.problem_id === ps.id || myClaim.card_index === idx);

      if (isClaimedByMe) {
        return {
          id: ps.id,
          card_index: idx,
          card_number: idx + 1,
          claimed: true,
          is_claimed_by_you: true,
          team_name: req.team?.team_name,
          title: ps.title,
          description: ps.description,
          category: ps.category || 'General',
        };
      } else if (claim) {
        return {
          id: ps.id,
          card_index: idx,
          card_number: idx + 1,
          claimed: true,
          is_claimed_by_you: false,
          team_name: claim.team_name || 'Another Team',
          // Problem title & description are intentionally NOT sent
        };
      } else {
        return {
          id: ps.id,
          card_index: idx,
          card_number: idx + 1,
          claimed: false,
          is_claimed_by_you: false,
          // Problem title & description are intentionally NOT sent
        };
      }
    });

    let myProblem = null;
    if (myClaim) {
      const found = activeStatements.find((p) => p.id === myClaim.problem_id) || activeStatements[myClaim.card_index];
      if (found) {
        myProblem = {
          id: found.id,
          card_number: (myClaim.card_index ?? 0) + 1,
          title: found.title,
          description: found.description,
          category: found.category || 'General',
        };
      }
    }

    return res.json({
      cards,
      has_claimed: !!myClaim,
      my_problem: myProblem,
      total_cards: activeStatements.length,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

// ROUND 6: Fast In-Memory Atomic Lock for Round 6 card claims (Sub-millisecond resolution)
interface ClaimLockEntry {
  teamId: string;
  teamName: string;
  claimedAt: number;
}
const activeSlotCardLocks = new Map<string, ClaimLockEntry>();
const activeSlotTeamClaimed = new Set<string>();

// ROUND 6: Claim Problem Statement Card (Atomic First-Click Win)
export async function claimRound6Card(req: AuthenticatedTeamRequest, res: Response) {
  const teamId = req.team?.id;
  const slotId = req.team?.slot_id;
  const eventId = req.team?.event_id;
  const { card_id, card_index } = req.body;

  if (!slotId || !eventId || !teamId) {
    return res.status(400).json({ error: 'Team session invalid' });
  }

  if (card_index === undefined && !card_id) {
    return res.status(400).json({ error: 'card_id or card_index required' });
  }

  const indexNum = Number(card_index);
  const cardLockKey = `${slotId}:card:${indexNum}`;
  const problemLockKey = card_id ? `${slotId}:prob:${card_id}` : null;
  const teamLockKey = `${slotId}:team:${teamId}`;

  // 1. SUB-MILLISECOND ATOMIC IN-MEMORY LOCK CHECK
  if (activeSlotTeamClaimed.has(teamLockKey)) {
    return res.status(400).json({ error: 'Your team has already selected a problem statement!' });
  }

  if (activeSlotCardLocks.has(cardLockKey)) {
    const winner = activeSlotCardLocks.get(cardLockKey);
    return res.status(409).json({
      error: `⚠️ Card #${indexNum + 1} was just claimed by ${winner?.teamName || 'another team'} milliseconds before you! Please choose an available card.`,
      claimed_by: winner?.teamName,
    });
  }

  if (problemLockKey && activeSlotCardLocks.has(problemLockKey)) {
    const winner = activeSlotCardLocks.get(problemLockKey);
    return res.status(409).json({
      error: `⚠️ This problem statement was just claimed by ${winner?.teamName || 'another team'} milliseconds before you! Please choose an available card.`,
      claimed_by: winner?.teamName,
    });
  }

  // Atomically claim in-memory lock (First request wins!)
  const claimLockObj: ClaimLockEntry = {
    teamId,
    teamName: req.team?.team_name || 'Team',
    claimedAt: Date.now(),
  };
  activeSlotCardLocks.set(cardLockKey, claimLockObj);
  if (problemLockKey) activeSlotCardLocks.set(problemLockKey, claimLockObj);
  activeSlotTeamClaimed.add(teamLockKey);

  try {
    // 2. Fetch problem statements pool and claims row from DB
    const [{ data: psRow }, { data: claimsRow }] = await Promise.all([
      supabase
        .from('quiz_questions')
        .select('options')
        .eq('event_id', eventId)
        .eq('question_text', '__PROBLEM_STATEMENTS__')
        .single(),
      supabase
        .from('quiz_questions')
        .select('id, options')
        .eq('question_text', '__SLOT_PROBLEM_CLAIMS__')
        .limit(1)
        .single(),
    ]);

    const allStatements: any[] = psRow && Array.isArray(psRow.options) ? psRow.options : [];
    const targetProblem = card_id
      ? allStatements.find((ps) => ps.id === card_id)
      : allStatements[indexNum];

    if (!targetProblem) {
      activeSlotCardLocks.delete(cardLockKey);
      if (problemLockKey) activeSlotCardLocks.delete(problemLockKey);
      activeSlotTeamClaimed.delete(teamLockKey);
      return res.status(404).json({ error: 'Problem statement not found.' });
    }

    let allClaims: any[] = claimsRow && Array.isArray(claimsRow.options) ? [...claimsRow.options] : [];
    const slotClaims = allClaims.filter((c: any) => c.slot_id === slotId);

    // Check if current team has already claimed in DB
    const existingTeamClaim = slotClaims.find((c: any) => c.team_id === teamId);
    if (existingTeamClaim) {
      const claimedPs =
        allStatements.find((p) => p.id === existingTeamClaim.problem_id) ||
        allStatements[existingTeamClaim.card_index];
      return res.status(400).json({
        error: 'Your team has already selected a problem statement!',
        problem: claimedPs,
      });
    }

    // Secondary DB First-Claim check
    const isAlreadyClaimed = slotClaims.some(
      (c: any) => c.problem_id === targetProblem.id || c.card_index === indexNum
    );

    if (isAlreadyClaimed) {
      activeSlotCardLocks.delete(cardLockKey);
      if (problemLockKey) activeSlotCardLocks.delete(problemLockKey);
      activeSlotTeamClaimed.delete(teamLockKey);
      return res.status(409).json({
        error: `⚠️ Card #${indexNum + 1} was just claimed by another team! Please choose an available card.`,
      });
    }

    // 3. Persist new claim to permanent DB
    const newClaim = {
      slot_id: slotId,
      team_id: teamId,
      team_name: req.team?.team_name || 'Team',
      problem_id: targetProblem.id,
      card_index: indexNum,
      claimed_at: new Date().toISOString(),
    };

    allClaims.push(newClaim);

    if (claimsRow) {
      await supabase.from('quiz_questions').update({ options: allClaims }).eq('id', claimsRow.id);
    } else {
      await supabase.from('quiz_questions').insert({
        event_id: eventId,
        question_text: '__SLOT_PROBLEM_CLAIMS__',
        options: allClaims,
        correct_index: 0,
      });
    }

    // Mark Round 6 as completed for this team (0 points awarded)
    await supabase.from('team_round_progress').upsert({
      team_id: teamId,
      round_number: 6,
      status: 'completed',
      score: 0,
      completed_at: new Date().toISOString(),
    });

    // 4. Ultra-Fast Realtime Broadcast to slot
    broadcastToSlot(slotId, 'problem:claimed', {
      slot_id: slotId,
      card_id: targetProblem.id,
      card_index: indexNum,
      card_number: indexNum + 1,
      team_id: teamId,
      team_name: req.team?.team_name || 'Team',
    });

    return res.json({
      success: true,
      problem: {
        id: targetProblem.id,
        card_number: indexNum + 1,
        title: targetProblem.title,
        description: targetProblem.description,
        category: targetProblem.category || 'General',
      },
    });
  } catch (error: any) {
    activeSlotCardLocks.delete(cardLockKey);
    if (problemLockKey) activeSlotCardLocks.delete(problemLockKey);
    activeSlotTeamClaimed.delete(teamLockKey);
    return res.status(500).json({ error: error.message });
  }
}

// TEAM CURRENT ROUND STATUS & RESUME ROUTE (Independent Multi-Slot Isolation)
export async function getTeamStatus(req: AuthenticatedTeamRequest, res: Response) {
  try {
    const teamId = req.team?.id;
    if (!teamId) return res.status(400).json({ error: 'Team ID required' });

    // Fetch team record
    const { data: team } = await supabase
      .from('teams')
      .select('id, team_name, slot_id, event_id')
      .eq('id', teamId)
      .single();

    if (!team || !team.slot_id) {
      return res.json({
        slot_id: null,
        current_round: 0,
        route: '/team/join-slot',
        status: 'no_slot',
      });
    }

    // Fetch team progress across all rounds
    const { data: progress } = await supabase
      .from('team_round_progress')
      .select('round_number, status')
      .eq('team_id', teamId);

    const completedRounds = new Set(
      (progress || [])
        .filter((p) => p.status === 'completed')
        .map((p) => Number(p.round_number))
    );

    let activeRound = 1;
    if (completedRounds.has(5) || completedRounds.has(6)) {
      activeRound = 6;
    } else if (completedRounds.has(4)) {
      activeRound = 5;
    } else if (completedRounds.has(3)) {
      activeRound = 4;
    } else if (completedRounds.has(2)) {
      activeRound = 3;
    } else if (completedRounds.has(1)) {
      activeRound = 2;
    } else {
      activeRound = 1;
    }

    const timerState = await getSlotTimerState(team.slot_id);

    return res.json({
      slot_id: team.slot_id,
      current_round: activeRound,
      route: `/team/round-${activeRound}`,
      status: 'active',
      completed_rounds: Array.from(completedRounds),
      timer: timerState,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

