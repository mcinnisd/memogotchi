-- Topic proficiency + review signals (adaptive difficulty for next-deck generation)

create table if not exists topic_proficiency (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic varchar(255) not null,
  proficiency_score float not null default 50.0,
  confidence float not null default 0.3,
  total_reviews int not null default 0,
  avg_response_time_ms int,
  created_at timestamptz not null default now(),
  last_updated timestamptz not null default now(),
  unique (user_id, topic)
);

create table if not exists review_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  grade int not null,
  response_time_ms int not null,
  was_flipped boolean not null default false,
  card_difficulty int not null default 5,
  proficiency_at_time float not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_topic_proficiency_user_topic on topic_proficiency(user_id, topic);
create index if not exists idx_review_signals_user on review_signals(user_id);
create index if not exists idx_review_signals_card on review_signals(card_id);

alter table topic_proficiency enable row level security;
alter table review_signals enable row level security;

create policy "v0 open topic_proficiency" on topic_proficiency for all using (true) with check (true);
create policy "v0 open review_signals" on review_signals for all using (true) with check (true);
