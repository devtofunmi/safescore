-- ============================================================================
-- Seed Script: Create Admin Users for SafeScore
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. First, create users via Supabase Dashboard > Authentication > Users
-- 2. Replace 'admin@example.com' below with your actual admin email
-- 3. Run this script in Supabase SQL Editor
-- 
-- ============================================================================

-- Set admin status for a single user
-- Replace 'admin@example.com' with your admin email
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"is_admin": true, "plan_type": "pro"}'::jsonb
WHERE email = 'admin@example.com';

-- ============================================================================
-- ALTERNATIVE: Set multiple admins at once
-- ============================================================================
-- Uncomment and modify the emails below:

-- UPDATE auth.users 
-- SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
--     '{"is_admin": true, "plan_type": "pro"}'::jsonb
-- WHERE email IN (
--     'admin1@example.com',
--     'admin2@example.com',
--     'admin3@example.com'
-- );

-- ============================================================================
-- VERIFICATION: Check admin users
-- ============================================================================
-- Run this query to verify admin users were created:

SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'is_admin' as is_admin,
  raw_user_meta_data->>'plan_type' as plan_type,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE (raw_user_meta_data->>'is_admin')::boolean = true
ORDER BY created_at DESC;

-- ============================================================================
-- REMOVE ADMIN STATUS (if needed)
-- ============================================================================
-- To remove admin status from a user, run:

-- UPDATE auth.users 
-- SET raw_user_meta_data = raw_user_meta_data - 'is_admin'
-- WHERE email = 'admin@example.com';
