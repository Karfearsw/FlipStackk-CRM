-- Create First Admin User for FlipStackk CRM
-- Run this in Supabase SQL Editor or your PostgreSQL client

-- Ensure pgcrypto extension is available (for password hashing)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user
-- IMPORTANT: Change the password below to your own secure password
INSERT INTO users (username, email, password, name, role, created_at, updated_at)
VALUES (
  'admin',
  'admin@yourcompany.com',  -- Change to your email
  crypt('ChangeThisPassword123!', gen_salt('bf', 10)),  -- CHANGE THIS PASSWORD
  'Admin User',  -- Change to your name
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (username) DO NOTHING;  -- Prevents duplicate if already exists

-- Verify admin was created
SELECT id, username, email, name, role, created_at 
FROM users 
WHERE role = 'admin';
