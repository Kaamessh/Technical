-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ADMINS
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);

-- 2. EVENTS
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text check (status in ('draft','active','completed')) default 'draft',
  created_by uuid references admins(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. SLOTS
create table if not exists slots (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  slot_number int not null,
  slot_code text unique not null,
  status text check (status in ('scheduled','open','in_progress','completed')) default 'scheduled',
  current_round int default 1,
  created_at timestamptz default now()
);

-- 4. TEAMS
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  team_name text not null,
  team_name_normalized text generated always as (lower(team_name)) stored,
  password_hash text not null,
  slot_id uuid references slots(id),
  registered_at timestamptz default now(),
  unique (event_id, team_name_normalized)
);

-- 5. ROUND 1 QUIZ QUESTIONS
create table if not exists quiz_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  question_text text not null,
  options jsonb not null,               -- ["A opt","B opt","C opt","D opt"]
  correct_index int not null,
  created_at timestamptz default now()
);

-- 6. SLOT QUESTION QUEUE
create table if not exists slot_question_queue (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references slots(id) on delete cascade,
  question_id uuid references quiz_questions(id) on delete cascade,
  sequence_order int not null,
  status text check (status in ('pending','live','won','expired')) default 'pending',
  live_started_at timestamptz,
  won_by_team_id uuid references teams(id) on delete set null,
  won_at timestamptz
);

-- 7. ROUND 2 WORKFLOW CHALLENGES
create table if not exists workflow_challenges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  title text,
  image_urls jsonb not null,            -- array of image URLs (the pieces) in correct order
  created_at timestamptz default now()
);

-- 8. ROUND 3 AI OR REAL CHALLENGES
create table if not exists ai_or_real_challenges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  image_a_url text not null,
  image_b_url text not null,
  correct_side text check (correct_side in ('A','B')) not null,
  created_at timestamptz default now()
);

-- 9. ROUND 4 DATA CHALLENGE QUESTIONS
create table if not exists data_challenge_questions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_index int not null,
  created_at timestamptz default now()
);

-- 10. TEAM DECODE WORDS (Round 5 Setup)
create table if not exists team_decode_words (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade unique,
  word text not null,                        -- e.g. "elephant"
  letter_numbers int[] not null,              -- [5,12,5,16,8,1,14,20]
  binary_clue text not null                   -- e.g. "1111" -> decodes to 15
);

-- 11. TEAM ROUND PROGRESS
create table if not exists team_round_progress (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  round_number int not null,
  started_at timestamptz,
  completed_at timestamptz,
  time_taken_seconds numeric,
  points_awarded numeric default 0,
  status text check (status in ('locked','in_progress','completed','skipped')) default 'locked',
  unique (team_id, round_number)
);

-- 12. POINTS LEDGER
create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  round_number int,
  points numeric not null,
  reason text,                          -- 'auto: round finish rank 1', 'manual admin edit', etc.
  edited_by_admin uuid references admins(id) on delete set null,
  created_at timestamptz default now()
);

-- ENABLE ROW LEVEL SECURITY FOR CLIENT-SIDE REALTIME READS
alter table points_ledger enable row level security;
alter table slot_question_queue enable row level security;
alter table slots enable row level security;

-- POLICIES
create policy "Allow anon read for points_ledger" on points_ledger for select using (true);
create policy "Allow anon read for slot_question_queue" on slot_question_queue for select using (true);
create policy "Allow anon read for slots" on slots for select using (true);

-- PUBLICATION FOR SUPABASE REALTIME
drop publication if exists supabase_realtime;
create publication supabase_realtime for table points_ledger, slot_question_queue, slots;
