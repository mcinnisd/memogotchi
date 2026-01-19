-- Create Profiles Table (to replace/augment Pets table for User State)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  pet_name text,
  pet_type text,
  learning_goals text[],
  xp int default 0,
  health int default 100,
  stage text default 'egg',
  coins int default 0,
  current_streak int default 0,
  last_study_date timestamptz,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);
