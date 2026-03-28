-- SQL Script to reset/clear match data and virtual players
-- Run this in Supabase SQL Editor

-- 1. Delete all game scores (depends on matches)
DELETE FROM match_games;

-- 2. Delete all matches (depends on profiles)
DELETE FROM matches;

-- 3. Delete all virtual players (keeps real users)
-- If you want to delete ALL profiles (including real users), 
-- keep in mind that real users should exist if they are in auth.users.
-- To just reset data while keeping accounts, we delete only virtual profiles.
DELETE FROM profiles WHERE type = 'virtual';

-- 4. (Optional) Reset any custom data for real users in profiles
-- UPDATE profiles SET nickname = NULL, avatar_url = NULL WHERE type = 'real';

-- Verification
SELECT 'Sync complete. Match history and virtual players cleared.' as status;
