export type EventStatus = 'draft' | 'active' | 'completed';
export type SlotStatus = 'scheduled' | 'open' | 'in_progress' | 'completed';
export type QueueQuestionStatus = 'pending' | 'live' | 'won' | 'expired';
export type RoundProgressStatus = 'locked' | 'in_progress' | 'completed' | 'skipped';

export interface Admin {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface EventEntity {
  id: string;
  name: string;
  description: string | null;
  status: EventStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Slot {
  id: string;
  event_id: string;
  slot_number: number;
  slot_code: string;
  status: SlotStatus;
  current_round: number;
  created_at: string;
}

export interface Team {
  id: string;
  event_id: string;
  team_name: string;
  team_name_normalized: string;
  password_hash: string;
  slot_id: string | null;
  registered_at: string;
}

export interface QuizQuestion {
  id: string;
  event_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  created_at: string;
}

export interface SlotQuestionQueueItem {
  id: string;
  slot_id: string;
  question_id: string;
  sequence_order: number;
  status: QueueQuestionStatus;
  live_started_at: string | null;
  won_by_team_id: string | null;
  won_at: string | null;
}

export interface WorkflowChallenge {
  id: string;
  event_id: string;
  title: string | null;
  image_urls: string[];
  created_at: string;
}

export interface AiOrRealChallenge {
  id: string;
  event_id: string;
  image_a_url: string;
  image_b_url: string;
  correct_side: 'A' | 'B';
  created_at: string;
}

export interface DataChallengeQuestion {
  id: string;
  event_id: string;
  question_text: string;
  options: string[];
  correct_index: number;
  created_at: string;
}

export interface TeamDecodeWord {
  id: string;
  team_id: string;
  word: string;
  letter_numbers: number[];
  binary_clue: string;
}

export interface TeamRoundProgress {
  id: string;
  team_id: string;
  round_number: number;
  started_at: string | null;
  completed_at: string | null;
  time_taken_seconds: number | null;
  points_awarded: number;
  status: RoundProgressStatus;
}

export interface PointsLedgerEntry {
  id: string;
  team_id: string;
  round_number: number | null;
  points: number;
  reason: string | null;
  edited_by_admin: string | null;
  created_at: string;
}

export interface JwtPayloadAdmin {
  id: string;
  username: string;
  email: string;
  role: 'admin';
}

export interface JwtPayloadTeam {
  id: string;
  team_name: string;
  event_id: string;
  slot_id: string | null;
  role: 'team';
}

export type AuthPayload = JwtPayloadAdmin | JwtPayloadTeam;
