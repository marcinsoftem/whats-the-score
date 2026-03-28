-- =============================================================
-- Tournament Mode Migration
-- Run in Supabase SQL Editor
-- =============================================================

-- 1. Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  status     text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (tournament_id, profile_id)
);

-- 3. Add tournament_id to existing matches table
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL;

-- 4. Medals table
CREATE TABLE IF NOT EXISTS tournament_medals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  profile_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  medal         text NOT NULL CHECK (medal IN ('gold', 'silver', 'bronze')),
  UNIQUE (tournament_id, profile_id)
);

-- =============================================================
-- RLS Policies
-- =============================================================

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_medals ENABLE ROW LEVEL SECURITY;

-- Tournaments: everyone can read, only creator can write
CREATE POLICY "tournaments_select_all"
  ON tournaments FOR SELECT TO authenticated USING (true);

CREATE POLICY "tournaments_insert_own"
  ON tournaments FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "tournaments_update_own"
  ON tournaments FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "tournaments_delete_own"
  ON tournaments FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- Participants: everyone can read, only tournament creator can insert
CREATE POLICY "participants_select_all"
  ON tournament_participants FOR SELECT TO authenticated USING (true);

CREATE POLICY "participants_insert_own"
  ON tournament_participants FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "participants_delete_own"
  ON tournament_participants FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

-- Medals: everyone can read, only tournament creator can insert
CREATE POLICY "medals_select_all"
  ON tournament_medals FOR SELECT TO authenticated USING (true);

CREATE POLICY "medals_insert_own"
  ON tournament_medals FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournaments t
      WHERE t.id = tournament_id AND t.created_by = auth.uid()
    )
  );

-- =============================================================
-- Verification
-- =============================================================
SELECT 'Tournament schema migration complete.' AS status;
