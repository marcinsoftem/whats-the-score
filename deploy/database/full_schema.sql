-- =============================================================
-- WHAT'S THE SCORE? - FULL DATABASE SCHEMA
-- =============================================================
-- This script reconstructs the entire Supabase database from scratch.
-- Run this in the Supabase SQL Editor for your NEW production project.

-- =============================================================
-- 1. CLEANUP (Optional - only if resetting)
-- =============================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.match_games CASCADE;
-- DROP TABLE IF EXISTS public.matches CASCADE;
-- DROP TABLE IF EXISTS public.tournament_medals CASCADE;
-- DROP TABLE IF EXISTS public.tournament_participants CASCADE;
-- DROP TABLE IF EXISTS public.tournaments CASCADE;
-- DROP TABLE IF EXISTS public.user_favorites CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- =============================================================
-- 2. CORE TABLES
-- =============================================================

-- Profiles: Holds both real registered users and virtual players
CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname   text NOT NULL,
  avatar_url text,
  type       text NOT NULL CHECK (type IN ('real', 'virtual')),
  owner_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Tournaments: Root table for tournament mode
CREATE TABLE IF NOT EXISTS public.tournaments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  created_at timestamptz DEFAULT now()
);

-- Tournament Participants: Join table for players in a tournament
CREATE TABLE IF NOT EXISTS public.tournament_participants (
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, profile_id)
);

-- Matches: Main match records
CREATE TABLE IF NOT EXISTS public.matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player2_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score1        int DEFAULT 0,
  score2        int DEFAULT 0,
  timestamp     timestamptz DEFAULT now(),
  created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tournament_id uuid REFERENCES public.tournaments(id) ON DELETE SET NULL
);

-- Match Games: Individual sets within a match
CREATE TABLE IF NOT EXISTS public.match_games (
  match_id    uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  game_index  int NOT NULL,
  p1_score    int NOT NULL,
  p2_score    int NOT NULL,
  PRIMARY KEY (match_id, game_index)
);

-- User Favorites: Track favorite players for each user
CREATE TABLE IF NOT EXISTS public.user_favorites (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, profile_id)
);

-- Tournament Medals: Awards given after a tournament finishes
CREATE TABLE IF NOT EXISTS public.tournament_medals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medal         text NOT NULL CHECK (medal IN ('gold', 'silver', 'bronze')),
  UNIQUE (tournament_id, profile_id)
);

-- =============================================================
-- 3. UNIQUENESS CONSTRAINTS & INDEXES
-- =============================================================

-- Global unique nickname for REAL users (ensures no two registrations share a name)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname_real 
ON public.profiles (nickname) 
WHERE (type = 'real');

-- Scoped unique nickname for VIRTUAL players per owner
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname_owner_virtual 
ON public.profiles (nickname, owner_id) 
WHERE (type = 'virtual');


-- =============================================================
-- 4. BUSINESS LOGIC (Functions & Triggers)
-- =============================================================

-- handle_new_user: Automated profile creation and match migration
-- Triggered when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_invite_id uuid;
BEGIN
  -- Extract optional invite_id from user metadata
  v_invite_id := (new.raw_user_meta_data->>'invite_id')::uuid;

  -- 1. Create a "real" profile linked to the new auth user
  INSERT INTO public.profiles (id, nickname, avatar_url, type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'real'
  );

  -- 2. If registration was via invite link, migrate matches from the virtual profile
  IF v_invite_id IS NOT NULL THEN
    -- Update all matches linked to the virtual player to point to the new real profile
    UPDATE public.matches SET player1_id = new.id WHERE player1_id = v_invite_id;
    UPDATE public.matches SET player2_id = new.id WHERE player2_id = v_invite_id;
    
    -- Cleanup: Delete the old virtual player record
    DELETE FROM public.profiles WHERE id = v_invite_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activation Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- =============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_medals ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can see profiles, only owner/self can edit
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_virtual" ON public.profiles FOR INSERT TO authenticated 
WITH CHECK (type = 'virtual' AND owner_id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated 
USING (id = auth.uid() OR owner_id = auth.uid());
CREATE POLICY "profiles_delete_own_virtual" ON public.profiles FOR DELETE TO authenticated 
USING (owner_id = auth.uid());

-- Matches: Authenticated users can see all matches (stats), but only creator can edit
CREATE POLICY "matches_select_all" ON public.matches FOR SELECT TO authenticated USING (true);
CREATE POLICY "matches_manage_own" ON public.matches FOR ALL TO authenticated 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Match Games: Access follows the match record
CREATE POLICY "match_games_select_all" ON public.match_games FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_games_manage_all" ON public.match_games FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM matches WHERE matches.id = match_id AND matches.created_by = auth.uid()));

-- Tournaments: Everyone can read, creator manages
CREATE POLICY "tournaments_select_all" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "tournaments_manage_own" ON public.tournaments FOR ALL TO authenticated 
USING (created_by = auth.uid());

-- Tournament Participants: Inherit from tournament management
CREATE POLICY "participants_select_all" ON public.tournament_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "participants_manage_own" ON public.tournament_participants FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid()));

-- Favorites: Strictly private
CREATE POLICY "user_favorites_manage_own" ON public.user_favorites FOR ALL TO authenticated 
USING (user_id = auth.uid());

-- Medals: Inherit from tournament management
CREATE POLICY "medals_select_all" ON public.tournament_medals FOR SELECT TO authenticated USING (true);
CREATE POLICY "medals_manage_own" ON public.tournament_medals FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid()));

-- =============================================================
-- 6. VERIFICATION
-- =============================================================
SELECT 'Full project database schema initialized successfully.' AS status;
