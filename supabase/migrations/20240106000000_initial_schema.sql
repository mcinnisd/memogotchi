-- Memogotchi v0 schema (study-first single-player)
-- Pet state lives on profiles. Abandoned separate `pets` table is not used.
-- Auth/RLS: honest single-player for now. Policies are open so the demo user
-- works with the anon key and no session. Tighten when real auth lands.

-- Profiles (user + pet pulse)
create table if not exists profiles (
  id uuid primary key,
  pet_name text,
  pet_type text,
  learning_goals text[],
  xp int not null default 0,
  health int not null default 100 check (health >= 0 and health <= 100),
  stage text not null default 'egg',
  coins int not null default 0,
  current_streak int not null default 0,
  last_study_date timestamptz,
  updated_at timestamptz not null default now()
);

-- Decks are topic batches (multiple decks may share one topic)
create table if not exists decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_decks_user_topic on decks(user_id, topic);

-- Cards with SM-2 + rich content JSON
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  front text not null,
  back text not null,
  content jsonb,
  card_type text,
  difficulty int not null default 5,
  next_review timestamptz not null default now(),
  interval int not null default 0,
  ease_factor float not null default 2.5,
  created_at timestamptz not null default now()
);

create index if not exists idx_cards_next_review on cards(next_review);
create index if not exists idx_cards_deck_id on cards(deck_id);

-- Single-player: allow all operations until auth exists
alter table profiles enable row level security;
alter table decks enable row level security;
alter table cards enable row level security;

create policy "v0 open profiles select" on profiles for select using (true);
create policy "v0 open profiles insert" on profiles for insert with check (true);
create policy "v0 open profiles update" on profiles for update using (true);

create policy "v0 open decks select" on decks for select using (true);
create policy "v0 open decks insert" on decks for insert with check (true);

create policy "v0 open cards select" on cards for select using (true);
create policy "v0 open cards insert" on cards for insert with check (true);
create policy "v0 open cards update" on cards for update using (true);
