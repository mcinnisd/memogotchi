-- Homey v1: pets are first-class, one per subject, decks hang off the pet.
-- Does not connect to a live project by itself. Apply with the Supabase CLI
-- or SQL editor when you are ready.

-- Enums cannot drop values cleanly. Move species and stage onto text checks
-- so the eight homey friends (and a later classic mode) are not stuck with
-- the old cyber set.

alter table pets alter column species drop default;
alter table pets alter column species type text using species::text;
alter table pets alter column stage drop default;
alter table pets alter column stage type text using stage::text;

drop type if exists pet_species;
drop type if exists pet_stage;

delete from pets
where species in ('glitch_cat', 'neon_dragon', 'cyber_fox');

update pets
set stage = case stage
	when 'baby' then 'hatchling'
	when 'child' then 'cared_for'
	when 'adult' then 'well_loved'
	when 'egg' then 'egg'
	when 'hatchling' then 'hatchling'
	when 'cared_for' then 'cared_for'
	when 'well_loved' then 'well_loved'
	else 'hatchling'
end;

alter table pets add column if not exists topic text;
alter table pets add column if not exists care int not null default 100;
alter table pets add column if not exists days_cared int not null default 0;
alter table pets add column if not exists mode text not null default 'homey';
alter table pets add column if not exists mode_state jsonb not null default '{}'::jsonb;

update pets set topic = 'General' where topic is null or btrim(topic) = '';
alter table pets alter column topic set not null;

alter table pets drop constraint if exists pets_species_check;
alter table pets add constraint pets_species_check
	check (species in ('chick', 'fox', 'sprout', 'mouse', 'frog', 'butterfly', 'bun', 'cap'));

alter table pets drop constraint if exists pets_stage_check;
alter table pets add constraint pets_stage_check
	check (stage in ('egg', 'hatchling', 'cared_for', 'well_loved'));

alter table pets drop constraint if exists pets_mode_check;
alter table pets add constraint pets_mode_check
	check (mode in ('homey', 'classic'));

alter table pets drop constraint if exists pets_care_check;
alter table pets add constraint pets_care_check
	check (care >= 0 and care <= 100);

alter table pets drop constraint if exists pets_days_cared_check;
alter table pets add constraint pets_days_cared_check
	check (days_cared >= 0);

-- One friend per subject. Keep the older row if a user already has duplicates.
delete from pets a
using pets b
where a.user_id = b.user_id
	and lower(a.topic) = lower(b.topic)
	and a.created_at > b.created_at;

create unique index if not exists pets_one_subject_per_user
	on pets (user_id, lower(topic));

alter table pets alter column stage set default 'hatchling';

-- Decks and cards belong to the pet so subjects cannot bleed together.
alter table decks add column if not exists topic text;
alter table decks add column if not exists pet_id uuid references pets(id) on delete cascade;

update decks
set topic = coalesce(nullif(btrim(topic), ''), nullif(btrim(title), ''), 'General');

alter table cards add column if not exists pet_id uuid references pets(id) on delete cascade;
alter table cards add column if not exists content jsonb;
alter table cards add column if not exists card_type text default 'basic';

create index if not exists cards_pet_review_idx on cards (pet_id, next_review);
create index if not exists decks_pet_idx on decks (pet_id);

-- Profiles keep the human's "you showed up" streak. Pet fields on profiles
-- are unused by v1; pets own name, species, and care.

alter table topic_proficiency add column if not exists pet_id uuid references pets(id) on delete cascade;

-- Row level security. Existing select/update/insert policies on pets stay.
drop policy if exists "Users can delete their own pets" on pets;
create policy "Users can delete their own pets"
	on pets for delete
	using (auth.uid() = user_id);

drop policy if exists "Users can update their own decks" on decks;
create policy "Users can update their own decks"
	on decks for update
	using (auth.uid() = user_id);

drop policy if exists "Users can delete their own decks" on decks;
create policy "Users can delete their own decks"
	on decks for delete
	using (auth.uid() = user_id);

drop policy if exists "Users can update their own cards" on cards;
create policy "Users can update their own cards"
	on cards for update
	using (
		exists (
			select 1 from decks
			where decks.id = cards.deck_id
			and decks.user_id = auth.uid()
		)
	);

drop policy if exists "Users can delete their own cards" on cards;
create policy "Users can delete their own cards"
	on cards for delete
	using (
		exists (
			select 1 from decks
			where decks.id = cards.deck_id
			and decks.user_id = auth.uid()
		)
	);

alter table topic_proficiency enable row level security;
drop policy if exists "Users can view their own proficiency" on topic_proficiency;
create policy "Users can view their own proficiency"
	on topic_proficiency for select
	using (auth.uid() = user_id);
drop policy if exists "Users can insert their own proficiency" on topic_proficiency;
create policy "Users can insert their own proficiency"
	on topic_proficiency for insert
	with check (auth.uid() = user_id);
drop policy if exists "Users can update their own proficiency" on topic_proficiency;
create policy "Users can update their own proficiency"
	on topic_proficiency for update
	using (auth.uid() = user_id);

alter table review_signals enable row level security;
drop policy if exists "Users can view their own signals" on review_signals;
create policy "Users can view their own signals"
	on review_signals for select
	using (auth.uid() = user_id);
drop policy if exists "Users can insert their own signals" on review_signals;
create policy "Users can insert their own signals"
	on review_signals for insert
	with check (auth.uid() = user_id);
