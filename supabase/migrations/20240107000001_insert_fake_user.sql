-- Seed the demo single-player profile.
-- DEMO_USER_ID in lib/demo-user.ts must match this id.
-- If you use Supabase Auth FKs elsewhere, also insert into auth.users.

insert into profiles (id, pet_name, pet_type, xp, health, stage, coins, current_streak)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Egg',
  'companion',
  0,
  100,
  'egg',
  0,
  0
)
on conflict (id) do nothing;

-- Optional: satisfy auth.users FK if your project still references it
-- insert into auth.users (id, email)
-- values ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'memogotchi@example.com')
-- on conflict (id) do nothing;
