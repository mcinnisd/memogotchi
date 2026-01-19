-- Create Enums
create type pet_stage as enum ('egg', 'baby', 'adult');
create type pet_species as enum ('glitch_cat', 'neon_dragon', 'cyber_fox');

-- Pets Table
create table pets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  species pet_species not null,
  stage pet_stage not null default 'egg',
  health int not null default 100 check (health >= 0 and health <= 100),
  hunger int not null default 100 check (hunger >= 0 and hunger <= 100),
  exp int not null default 0,
  last_fed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security (RLS) for Pets
alter table pets enable row level security;

create policy "Users can view their own pets"
  on pets for select
  using (auth.uid() = user_id);

create policy "Users can update their own pets"
  on pets for update
  using (auth.uid() = user_id);

create policy "Users can insert their own pets"
  on pets for insert
  with check (auth.uid() = user_id);


-- Decks Table
create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text not null,
  is_generated boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS for Decks
alter table decks enable row level security;

create policy "Users can view their own decks"
  on decks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own decks"
  on decks for insert
  with check (auth.uid() = user_id);


-- Cards Table
create table cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references decks(id) not null,
  front text not null,
  back text not null,
  hint text,
  fun_fact text,
  next_review timestamptz,
  interval int not null default 0,
  ease_factor float not null default 2.5,
  created_at timestamptz not null default now()
);

-- Enable RLS for Cards
alter table cards enable row level security;

create policy "Users can view their own cards"
  on cards for select
  using (
    exists (
      select 1 from decks
      where decks.id = cards.deck_id
      and decks.user_id = auth.uid()
    )
  );

create policy "Users can insert cards into their own decks"
  on cards for insert
  with check (
    exists (
      select 1 from decks
      where decks.id = deck_id
      and decks.user_id = auth.uid()
    )
  );
