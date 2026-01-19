-- Insert the fake user into auth.users to satisfy foreign key constraints
INSERT INTO auth.users (id, email)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'memogotchi@example.com')
ON CONFLICT (id) DO NOTHING;
