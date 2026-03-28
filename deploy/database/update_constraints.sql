-- SQL Script for updating profiles table nickname constraints
-- Run this in Supabase SQL Editor

-- 1. Identify and DROP existing global unique constraint on nickname
-- Common names are 'profiles_nickname_key' or 'profiles_nickname_unique'
DO $$ 
BEGIN
    -- Check for default constraint name
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_nickname_key') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_nickname_key;
    END IF;
    
    -- Check for another common variant
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_nickname_unique') THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_nickname_unique;
    END IF;

    -- Drop any partial indexes if they somehow exist already
    DROP INDEX IF EXISTS idx_profiles_nickname_real;
    DROP INDEX IF EXISTS idx_profiles_nickname_owner_virtual;
END $$;

-- 2. Add Global Uniqueness for REAL users (Real accounts)
-- This ensures no two registered users can have the same nickname
CREATE UNIQUE INDEX idx_profiles_nickname_real 
ON profiles (nickname) 
WHERE (type = 'real');

-- 3. Add Scoped Uniqueness for VIRTUAL players
-- This allows different owners to have virtual players with same names
-- but prevents a single owner from having two virtual players with same name.
-- In Postgres, multiple NULLs in a unique index do not conflict,
-- so multiple virtual players with same name AND owner_id = null (anons) work fine.
CREATE UNIQUE INDEX idx_profiles_nickname_owner_virtual
ON profiles (nickname, owner_id)
WHERE (type = 'virtual');

-- Verification
SELECT 'Constraint migration complete.' as status;
