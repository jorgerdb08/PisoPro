-- ==============================================================================
-- PISOPRO: CREACIÓN DE TABLA NOTIFICATIONS + VACIADO COMPLETO PARA PRODUCCIÓN
-- Pega este script en el SQL Editor de tu proyecto Supabase y pulsa "Run".
-- ==============================================================================

-- 1. CREAR LA TABLA NOTIFICATIONS (si no existe) CON SUS ÍNDICES Y POLÍTICAS RLS
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

-- Habilitar Realtime para notifications si la publicación existe
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 2. VACIADO (TRUNCATE) DE TODAS LAS TABLAS DE DATOS DE PRUEBA
TRUNCATE TABLE 
  expense_participants,
  expenses,
  user_sessions,
  messages,
  shopping_items,
  notifications,
  task_completions,
  cleaning_lottery,
  initial_zone_assignments,
  cleaning_assignment_overrides,
  cleaning_weekly_task_checks,
  cleaning_completions,
  cleaning_help_requests,
  cleaning_helpers,
  trash_events,
  point_transactions
CASCADE;

-- 3. RESETEAR ESTADO DE TAREAS PRECONFIGURADAS A PENDIENTE
UPDATE tasks 
SET status = 'pending';

-- 4. MENSAJE DE BIENVENIDA INICIAL EN EL CHAT DEL PISO
INSERT INTO messages (id, household_id, user_id, content)
VALUES (
  '99999999-9999-4999-8999-999999999999',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '¡Bienvenidos a PisoPro! El piso está listo para empezar.'
)
ON CONFLICT (id) DO UPDATE 
SET content = EXCLUDED.content;
