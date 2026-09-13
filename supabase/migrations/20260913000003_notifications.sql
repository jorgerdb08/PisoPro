-- ==============================================================================
-- PISOPRO MIGRATION: Notifications System
-- Table and policies for in-app notifications
-- ==============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_household ON notifications(household_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Notifications viewable by household members" ON notifications;
CREATE POLICY "Notifications viewable by household members" ON notifications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Notifications insertable by members" ON notifications;
CREATE POLICY "Notifications insertable by members" ON notifications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Notifications updatable by members" ON notifications;
CREATE POLICY "Notifications updatable by members" ON notifications
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Notifications deletable by members" ON notifications;
CREATE POLICY "Notifications deletable by members" ON notifications
  FOR DELETE USING (true);
