-- Migration: Add OAuth support (Google, Strava)
-- Run this migration to add OAuth fields to existing database

-- Add Google OAuth fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT FALSE;

-- Create index for Google ID lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Allow password_hash to be NULL for OAuth-only users
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Note: Strava fields already exist in cyclist_profile table from original schema
-- No changes needed for Strava support

-- Update existing users without Google connection
UPDATE users SET google_connected = FALSE WHERE google_connected IS NULL;

COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID (sub claim from ID token)';
COMMENT ON COLUMN users.google_connected IS 'Whether user has connected their Google account';
