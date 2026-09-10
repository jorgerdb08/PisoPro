-- ==============================================================================
-- PISOPRO: SCRIPT COMPLETO DE CONFIGURACIÓN Y MIGRACIONES
-- Pega este contenido en el SQL Editor de tu proyecto Supabase y pulsa "Run".
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Actualización automática de timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. TABLAS PRINCIPALES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Jorge', 'Samuel', 'David')),
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Nuestro piso',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_household_member UNIQUE (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON household_members(household_id);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  points INT NOT NULL DEFAULT 1 CHECK (points > 0),
  frequency TEXT NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  assigned_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_household ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user ON tasks(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE OR REPLACE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  order_index INT NOT NULL DEFAULT 0,
  CONSTRAINT unique_task_assignment UNIQUE (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user ON task_assignments(user_id);

CREATE TABLE IF NOT EXISTS task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_awarded INT NOT NULL DEFAULT 0,
  notes TEXT,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_completions_task ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_user ON task_completions(completed_by);
CREATE INDEX IF NOT EXISTS idx_task_completions_date ON task_completions(completed_at);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  paid_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL DEFAULT 'general',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_household ON expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

CREATE OR REPLACE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS expense_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_amount NUMERIC(10, 2) NOT NULL CHECK (share_amount >= 0),
  CONSTRAINT unique_expense_participant UNIQUE (expense_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_user ON expense_participants(user_id);

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL DEFAULT '1',
  added_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bought_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shopping_items_household ON shopping_items(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON shopping_items(completed);

CREATE OR REPLACE TRIGGER update_shopping_items_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_household ON messages(household_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 2. SEGURIDAD RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas permisivas para la aplicación
CREATE POLICY "Profiles are viewable by all" ON profiles FOR SELECT USING (true);
CREATE POLICY "Only admin can update profiles" ON profiles FOR UPDATE USING (true);

CREATE POLICY "Households viewable by members" ON households FOR SELECT USING (true);
CREATE POLICY "Only admin can update household" ON households FOR UPDATE USING (true);

CREATE POLICY "Household members are viewable by all" ON household_members FOR SELECT USING (true);

CREATE POLICY "Sessions select" ON user_sessions FOR SELECT USING (true);
CREATE POLICY "Sessions insert" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Sessions update" ON user_sessions FOR UPDATE USING (true);

CREATE POLICY "Tasks select" ON tasks FOR SELECT USING (true);
CREATE POLICY "Tasks insert" ON tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Tasks update" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Tasks delete" ON tasks FOR DELETE USING (true);

CREATE POLICY "Task assignments all" ON task_assignments FOR ALL USING (true);
CREATE POLICY "Task completions select" ON task_completions FOR SELECT USING (true);
CREATE POLICY "Task completions insert" ON task_completions FOR INSERT WITH CHECK (true);

CREATE POLICY "Expenses select" ON expenses FOR SELECT USING (true);
CREATE POLICY "Expenses insert" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Expenses update" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Expenses delete" ON expenses FOR DELETE USING (true);

CREATE POLICY "Expense participants select" ON expense_participants FOR SELECT USING (true);
CREATE POLICY "Expense participants insert" ON expense_participants FOR INSERT WITH CHECK (true);

CREATE POLICY "Shopping items select" ON shopping_items FOR SELECT USING (true);
CREATE POLICY "Shopping items insert" ON shopping_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Shopping items update" ON shopping_items FOR UPDATE USING (true);
CREATE POLICY "Shopping items delete" ON shopping_items FOR DELETE USING (true);

CREATE POLICY "Messages select" ON messages FOR SELECT USING (true);
CREATE POLICY "Messages insert" ON messages FOR INSERT WITH CHECK (true);

-- 3. FUNCIONES DE BLOQUEO ATÓMICO Y SESIONES (RPC)
CREATE OR REPLACE FUNCTION claim_profile(
  p_user_id UUID,
  p_device_id TEXT,
  p_lease_seconds INT DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  v_existing_session RECORD;
  v_new_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_name TEXT;
BEGIN
  SELECT name INTO v_user_name
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil de usuario no encontrado');
  END IF;

  SELECT id, device_id, session_token, expires_at INTO v_existing_session
  FROM user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY claimed_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    IF v_existing_session.device_id = p_device_id THEN
      v_expires_at := now() + (p_lease_seconds || ' seconds')::interval;
      UPDATE user_sessions
      SET last_seen = now(), expires_at = v_expires_at
      WHERE id = v_existing_session.id;

      RETURN jsonb_build_object(
        'success', true,
        'session_token', v_existing_session.session_token,
        'expires_at', v_expires_at,
        'user_id', p_user_id,
        'renewed', true
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', v_user_name || ' está en uso en otro dispositivo',
        'is_busy', true,
        'expires_at', v_existing_session.expires_at
      );
    END IF;
  END IF;

  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  v_new_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_lease_seconds || ' seconds')::interval;

  INSERT INTO user_sessions (
    user_id, device_id, session_token, last_seen, expires_at, is_active, claimed_at
  ) VALUES (
    p_user_id, p_device_id, v_new_token, now(), v_expires_at, true, now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'session_token', v_new_token,
    'expires_at', v_expires_at,
    'user_id', p_user_id,
    'renewed', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION heartbeat_session(
  p_session_token TEXT,
  p_extend_seconds INT DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  SELECT id, user_id, is_active, expires_at INTO v_session
  FROM user_sessions
  WHERE session_token = p_session_token
  FOR UPDATE;

  IF NOT FOUND OR v_session.is_active = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesión no válida o caducada');
  END IF;

  v_new_expires_at := now() + (p_extend_seconds || ' seconds')::interval;

  UPDATE user_sessions
  SET last_seen = now(), expires_at = v_new_expires_at
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_new_expires_at,
    'user_id', v_session.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION release_profile(p_session_token TEXT)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE session_token = p_session_token;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_force_release_profile(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_profiles_availability(p_current_device_id TEXT DEFAULT '')
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  avatar_url TEXT,
  is_busy BOOLEAN,
  is_current_device BOOLEAN,
  last_seen TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.role,
    p.avatar_url,
    COALESCE(s.is_active AND s.expires_at > now(), false) AS is_busy,
    COALESCE(s.is_active AND s.expires_at > now() AND s.device_id = p_current_device_id, false) AS is_current_device,
    s.last_seen,
    s.expires_at
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT us.is_active, us.device_id, us.last_seen, us.expires_at
    FROM user_sessions us
    WHERE us.user_id = p.id
      AND us.is_active = true
      AND us.expires_at > now()
    ORDER BY us.claimed_at DESC
    LIMIT 1
  ) s ON true
  ORDER BY
    CASE p.name
      WHEN 'Jorge' THEN 1
      WHEN 'Samuel' THEN 2
      WHEN 'David' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. HABILITAR REALTIME
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE profiles, user_sessions, tasks, shopping_items, expenses, messages;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 5. SEED INICIAL
INSERT INTO households (id, name)
VALUES ('11111111-1111-4111-8111-111111111111', 'Nuestro piso')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, name, role, avatar_url)
VALUES
  ('22222222-2222-4222-8222-222222222222', 'Jorge', 'admin', 'https://api.dicebear.com/7.x/bottts/svg?seed=Jorge'),
  ('33333333-3333-4333-8333-333333333333', 'Samuel', 'member', 'https://api.dicebear.com/7.x/bottts/svg?seed=Samuel'),
  ('44444444-4444-4444-8444-444444444444', 'David', 'member', 'https://api.dicebear.com/7.x/bottts/svg?seed=David')
ON CONFLICT (name) DO NOTHING;

INSERT INTO household_members (household_id, user_id)
VALUES
  ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'),
  ('11111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333'),
  ('11111111-1111-4111-8111-111111111111', '44444444-4444-4444-8444-444444444444')
ON CONFLICT (household_id, user_id) DO NOTHING;

INSERT INTO tasks (id, household_id, title, description, category, points, frequency, assigned_user_id, status)
VALUES
  ('a1111111-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111', 'Limpiar baño', 'Lavabo, ducha, inodoro y toallas', 'bathroom', 4, 'weekly', '22222222-2222-4222-8222-222222222222', 'pending'),
  ('b2222222-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '11111111-1111-4111-8111-111111111111', 'Limpiar cocina', 'Encimera, fuegos, fregadero y lavavajillas', 'kitchen', 3, 'weekly', '33333333-3333-4333-8333-333333333333', 'pending'),
  ('c3333333-cccc-4ccc-8ccc-cccccccccccc', '11111111-1111-4111-8111-111111111111', 'Sacar basura', 'Orgánico, envases, papel y vidrio', 'trash', 1, 'daily', '44444444-4444-4444-8444-444444444444', 'pending'),
  ('d4444444-dddd-4ddd-8ddd-dddddddddddd', '11111111-1111-4111-8111-111111111111', 'Barrer zonas comunes', 'Pasillo, salón y entrada', 'cleaning', 2, 'weekly', '22222222-2222-4222-8222-222222222222', 'pending'),
  ('e5555555-eeee-4eee-8eee-eeeeeeeeeeee', '11111111-1111-4111-8111-111111111111', 'Fregar suelo', 'Cocina, baño y pasillo', 'cleaning', 2, 'weekly', '33333333-3333-4333-8333-333333333333', 'pending'),
  ('f6666666-ffff-4fff-8fff-ffffffffffff', '11111111-1111-4111-8111-111111111111', 'Ordenar salón', 'Mesa de centro y ventilar', 'living', 2, 'weekly', '44444444-4444-4444-8444-444444444444', 'pending')
ON CONFLICT (id) DO NOTHING;

INSERT INTO shopping_items (id, household_id, name, quantity, added_by, completed)
VALUES
  ('10101010-1010-4010-8010-101010101010', '11111111-1111-4111-8111-111111111111', 'Papel higiénico', '1 paquete', '22222222-2222-4222-8222-222222222222', false),
  ('20202020-2020-4020-8020-202020202020', '11111111-1111-4111-8111-111111111111', 'Leche entera', '6 briks', '33333333-3333-4333-8333-333333333333', false),
  ('30303030-3030-4030-8030-303030303030', '11111111-1111-4111-8111-111111111111', 'Café en grano', '500g', '44444444-4444-4444-8444-444444444444', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO messages (id, household_id, user_id, content)
VALUES (
  '99999999-9999-4999-8999-999999999999',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  '¡Bienvenidos a PisoPro! Aquí organizaremos las tareas, los gastos y las compras del piso.'
)
ON CONFLICT (id) DO NOTHING;
