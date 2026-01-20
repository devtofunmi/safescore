-- Migration: Admin Support
-- Description: Adds support for admin users in the auth.users table
-- Run this in Supabase SQL Editor

-- Note: This migration doesn't create tables, but ensures the user_metadata
-- column can store admin flags. Supabase auth.users already supports user_metadata.

-- Create a function to check if a user is admin (optional helper)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (raw_user_meta_data->>'is_admin')::boolean
    FROM auth.users
    WHERE id = user_id
  ) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for admin users (optional, for easier querying)
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'is_admin' as is_admin,
  raw_user_meta_data->>'plan_type' as plan_type,
  raw_user_meta_data->>'pro_expires_at' as pro_expires_at
FROM auth.users
WHERE (raw_user_meta_data->>'is_admin')::boolean = true;

-- Grant access to authenticated users (adjust based on your RLS policies)
-- Note: This is optional and depends on your security requirements

COMMENT ON FUNCTION is_admin_user(UUID) IS 'Checks if a user has admin privileges';
COMMENT ON VIEW admin_users IS 'View of all admin users';
