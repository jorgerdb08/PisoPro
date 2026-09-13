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
  device_name TEXT NOT NULL DEFAULT 'Dispositivo desconocido',
  session_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED')),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup ON user_sessions(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device_lookup ON user_sessions(device_id, is_active, status);
DROP INDEX IF EXISTS idx_unique_active_user_session;
CREATE UNIQUE INDEX idx_unique_active_user_session 
ON user_sessions(user_id) 
WHERE (status = 'ACTIVE' AND is_active = true AND expires_at > now());

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
DROP POLICY IF EXISTS "Profiles are viewable by all" ON profiles;
CREATE POLICY "Profiles are viewable by all" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admin can update profiles" ON profiles;
CREATE POLICY "Only admin can update profiles" ON profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Households viewable by members" ON households;
CREATE POLICY "Households viewable by members" ON households FOR SELECT USING (true);
DROP POLICY IF EXISTS "Only admin can update household" ON households;
CREATE POLICY "Only admin can update household" ON households FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Household members are viewable by all" ON household_members;
CREATE POLICY "Household members are viewable by all" ON household_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sessions select" ON user_sessions;
CREATE POLICY "Sessions select" ON user_sessions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Sessions insert" ON user_sessions;
CREATE POLICY "Sessions insert" ON user_sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Sessions update" ON user_sessions;
CREATE POLICY "Sessions update" ON user_sessions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Tasks select" ON tasks;
CREATE POLICY "Tasks select" ON tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Tasks insert" ON tasks;
CREATE POLICY "Tasks insert" ON tasks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Tasks update" ON tasks;
CREATE POLICY "Tasks update" ON tasks FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Tasks delete" ON tasks;
CREATE POLICY "Tasks delete" ON tasks FOR DELETE USING (true);

DROP POLICY IF EXISTS "Task assignments all" ON task_assignments;
CREATE POLICY "Task assignments all" ON task_assignments FOR ALL USING (true);
DROP POLICY IF EXISTS "Task completions select" ON task_completions;
CREATE POLICY "Task completions select" ON task_completions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Task completions insert" ON task_completions;
CREATE POLICY "Task completions insert" ON task_completions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Expenses select" ON expenses;
CREATE POLICY "Expenses select" ON expenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Expenses insert" ON expenses;
CREATE POLICY "Expenses insert" ON expenses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Expenses update" ON expenses;
CREATE POLICY "Expenses update" ON expenses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Expenses delete" ON expenses;
CREATE POLICY "Expenses delete" ON expenses FOR DELETE USING (true);

DROP POLICY IF EXISTS "Expense participants select" ON expense_participants;
CREATE POLICY "Expense participants select" ON expense_participants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Expense participants insert" ON expense_participants;
CREATE POLICY "Expense participants insert" ON expense_participants FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Shopping items select" ON shopping_items;
CREATE POLICY "Shopping items select" ON shopping_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Shopping items insert" ON shopping_items;
CREATE POLICY "Shopping items insert" ON shopping_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Shopping items update" ON shopping_items;
CREATE POLICY "Shopping items update" ON shopping_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Shopping items delete" ON shopping_items;
CREATE POLICY "Shopping items delete" ON shopping_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Messages select" ON messages;
CREATE POLICY "Messages select" ON messages FOR SELECT USING (true);
DROP POLICY IF EXISTS "Messages insert" ON messages;
CREATE POLICY "Messages insert" ON messages FOR INSERT WITH CHECK (true);

-- 3. FUNCIONES DE BLOQUEO ATÓMICO Y SESIONES (RPC)
CREATE OR REPLACE FUNCTION claim_profile(
  p_user_id UUID,
  p_device_id TEXT,
  p_device_name TEXT DEFAULT 'Dispositivo desconocido',
  p_inactivity_days INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_existing_session RECORD;
  v_new_token TEXT;
  v_expires_at TIMESTAMPTZ;
  v_user_name TEXT;
  v_role TEXT;
  v_avatar_url TEXT;
BEGIN
  -- 1. Bloqueo pesimista del perfil para serializar reclamaciones concurrentes
  SELECT name, role, avatar_url INTO v_user_name, v_role, v_avatar_url
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil de usuario no encontrado');
  END IF;

  -- 2. Comprobar si ya existe una sesión activa y vigente para este usuario
  SELECT id, device_id, device_name, session_token, expires_at, status INTO v_existing_session
  FROM user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND status = 'ACTIVE'
    AND expires_at > now()
  ORDER BY claimed_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    -- Si es el mismo dispositivo, renueva la sesión y devuelve el token existente
    IF v_existing_session.device_id = p_device_id THEN
      v_expires_at := now() + (p_inactivity_days || ' days')::interval;
      UPDATE user_sessions
      SET 
        last_seen = now(), 
        expires_at = v_expires_at,
        device_name = COALESCE(NULLIF(p_device_name, ''), v_existing_session.device_name, 'Dispositivo desconocido'),
        status = 'ACTIVE',
        is_active = true
      WHERE id = v_existing_session.id;

      RETURN jsonb_build_object(
        'success', true,
        'session_token', v_existing_session.session_token,
        'expires_at', v_expires_at,
        'user_id', p_user_id,
        'user_name', v_user_name,
        'role', v_role,
        'avatar_url', v_avatar_url,
        'renewed', true
      );
    ELSE
      -- Dispositivo distinto: bloquear con mensaje claro
      RETURN jsonb_build_object(
        'success', false,
        'error', v_user_name || ' está en uso en otro dispositivo',
        'is_busy', true,
        'device_name', v_existing_session.device_name,
        'expires_at', v_existing_session.expires_at
      );
    END IF;
  END IF;

  -- 3. Desactivar sesiones anteriores del usuario o de este dispositivo
  UPDATE user_sessions
  SET is_active = false, status = CASE WHEN status = 'ACTIVE' THEN 'EXPIRED' ELSE status END
  WHERE (user_id = p_user_id OR device_id = p_device_id) AND is_active = true;

  -- 4. Generar nuevo token seguro y registrar sesión activa
  v_new_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_inactivity_days || ' days')::interval;

  INSERT INTO user_sessions (
    user_id, device_id, device_name, session_token, status, last_seen, expires_at, is_active, claimed_at
  ) VALUES (
    p_user_id, p_device_id, COALESCE(NULLIF(p_device_name, ''), 'Dispositivo desconocido'), v_new_token, 'ACTIVE', now(), v_expires_at, true, now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'session_token', v_new_token,
    'expires_at', v_expires_at,
    'user_id', p_user_id,
    'user_name', v_user_name,
    'role', v_role,
    'avatar_url', v_avatar_url,
    'renewed', false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION heartbeat_session(
  p_session_token TEXT,
  p_device_name TEXT DEFAULT NULL,
  p_extend_days INT DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_session RECORD;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  SELECT id, user_id, is_active, status, expires_at INTO v_session
  FROM user_sessions
  WHERE session_token = p_session_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Sesión no encontrada',
      'is_revoked', true
    );
  END IF;

  IF v_session.is_active = false OR v_session.status != 'ACTIVE' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Sesión desvinculada o inactiva',
      'is_revoked', (v_session.status = 'REVOKED'),
      'is_expired', (v_session.status = 'EXPIRED' OR v_session.expires_at <= now())
    );
  END IF;

  v_new_expires_at := now() + (p_extend_days || ' days')::interval;

  UPDATE user_sessions
  SET 
    last_seen = now(), 
    expires_at = v_new_expires_at,
    device_name = COALESCE(NULLIF(p_device_name, ''), device_name)
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_new_expires_at,
    'user_id', v_session.user_id,
    'status', 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_session(
  p_session_token TEXT,
  p_device_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT 
    s.id AS session_id,
    s.user_id,
    s.device_id,
    s.status,
    s.is_active,
    s.expires_at,
    s.last_seen,
    p.name AS user_name,
    p.role,
    p.avatar_url
  INTO v_record
  FROM user_sessions s
  JOIN profiles p ON p.id = s.user_id
  WHERE s.session_token = p_session_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'NOT_FOUND');
  END IF;

  IF v_record.device_id != p_device_id THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'DEVICE_MISMATCH');
  END IF;

  IF v_record.is_active = false OR v_record.status != 'ACTIVE' OR v_record.expires_at <= now() THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'reason', v_record.status,
      'is_revoked', (v_record.status = 'REVOKED'),
      'is_expired', (v_record.status = 'EXPIRED' OR v_record.expires_at <= now())
    );
  END IF;

  UPDATE user_sessions
  SET last_seen = now()
  WHERE id = v_record.session_id;

  RETURN jsonb_build_object(
    'valid', true,
    'user_id', v_record.user_id,
    'name', v_record.user_name,
    'role', v_record.role,
    'avatar_url', v_record.avatar_url,
    'status', 'ACTIVE'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION release_profile(p_session_token TEXT)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false, status = 'REVOKED'
  WHERE session_token = p_session_token;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_force_release_profile(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false, status = 'REVOKED'
  WHERE user_id = p_user_id AND is_active = true;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_profiles_availability(TEXT);

CREATE OR REPLACE FUNCTION get_profiles_availability(p_current_device_id TEXT DEFAULT '')
RETURNS TABLE (
  id UUID,
  name TEXT,
  role TEXT,
  avatar_url TEXT,
  is_busy BOOLEAN,
  is_current_device BOOLEAN,
  last_seen TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  status TEXT,
  device_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.role,
    p.avatar_url,
    COALESCE(s.is_active AND s.status = 'ACTIVE' AND s.expires_at > now() AND s.device_id != p_current_device_id, false) AS is_busy,
    COALESCE(s.is_active AND s.status = 'ACTIVE' AND s.expires_at > now() AND s.device_id = p_current_device_id, false) AS is_current_device,
    s.last_seen,
    s.expires_at,
    CASE
      WHEN s.is_active = true AND s.status = 'ACTIVE' AND s.expires_at > now() THEN 'ACTIVE'
      WHEN s.status = 'REVOKED' THEN 'REVOKED'
      WHEN s.status = 'EXPIRED' OR (s.expires_at IS NOT NULL AND s.expires_at <= now()) THEN 'EXPIRED'
      ELSE 'UNCLAIMED'
    END AS status,
    COALESCE(s.device_name, 'Sin dispositivo') AS device_name
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT us.is_active, us.status, us.device_id, us.device_name, us.last_seen, us.expires_at
    FROM user_sessions us
    WHERE us.user_id = p.id
    ORDER BY 
      CASE WHEN us.is_active = true AND us.status = 'ACTIVE' AND us.expires_at > now() THEN 0 ELSE 1 END,
      us.last_seen DESC
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

-- ==============================================================================
-- 6. SISTEMA DE LIMPIEZA POR ZONAS, SORTEO, ROTACIÓN, AYUDA Y BASURA
-- ==============================================================================

CREATE TABLE IF NOT EXISTS cleaning_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug IN ('salon', 'bano', 'cocina')),
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  default_points INT NOT NULL CHECK (default_points > 0),
  help_points INT NOT NULL DEFAULT 1 CHECK (help_points > 0),
  rotation_order INT NOT NULL UNIQUE CHECK (rotation_order IN (0, 1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cleaning_zones_household ON cleaning_zones(household_id);

CREATE OR REPLACE TRIGGER update_cleaning_zones_updated_at
  BEFORE UPDATE ON cleaning_zones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_zone ON cleaning_tasks(zone_id);

CREATE TABLE IF NOT EXISTS cleaning_lottery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE UNIQUE,
  executed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  base_week_start DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS initial_zone_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lottery_id UUID NOT NULL REFERENCES cleaning_lottery(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,
  CONSTRAINT unique_lottery_user UNIQUE (lottery_id, user_id),
  CONSTRAINT unique_lottery_zone UNIQUE (lottery_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_initial_assignments_lottery ON initial_zone_assignments(lottery_id);
CREATE INDEX IF NOT EXISTS idx_initial_assignments_user ON initial_zone_assignments(user_id);

CREATE TABLE IF NOT EXISTS cleaning_assignment_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  previous_zone_id UUID REFERENCES cleaning_zones(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_week_override UNIQUE (household_id, week_start, user_id)
);

CREATE INDEX IF NOT EXISTS idx_overrides_week ON cleaning_assignment_overrides(household_id, week_start);

CREATE TABLE IF NOT EXISTS cleaning_weekly_task_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  completed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_task_week_check UNIQUE (task_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_checks_task_week ON cleaning_weekly_task_checks(task_id, week_start);

CREATE TABLE IF NOT EXISTS cleaning_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  responsible_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points_awarded INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_zone_week_completion UNIQUE (zone_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_completions_household_week ON cleaning_completions(household_id, week_start);
CREATE INDEX IF NOT EXISTS idx_completions_user ON cleaning_completions(responsible_user_id);

CREATE TABLE IF NOT EXISTS cleaning_help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_open_help_request UNIQUE (zone_id, week_start, requester_id)
);

CREATE INDEX IF NOT EXISTS idx_help_requests_lookup ON cleaning_help_requests(household_id, week_start, status);

CREATE TABLE IF NOT EXISTS cleaning_helpers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  help_request_id UUID NOT NULL REFERENCES cleaning_help_requests(id) ON DELETE CASCADE,
  helper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  points_awarded INT NOT NULL DEFAULT 0,
  CONSTRAINT unique_helper_per_request UNIQUE (help_request_id, helper_id)
);

CREATE INDEX IF NOT EXISTS idx_cleaning_helpers_req ON cleaning_helpers(help_request_id);
CREATE INDEX IF NOT EXISTS idx_cleaning_helpers_user ON cleaning_helpers(helper_id);

CREATE TABLE IF NOT EXISTS trash_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trash_type TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trash_events_household ON trash_events(household_id);
CREATE INDEX IF NOT EXISTS idx_trash_events_user ON trash_events(user_id);
CREATE INDEX IF NOT EXISTS idx_trash_events_created ON trash_events(created_at);

CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cleaning', 'helping', 'trash', 'admin_adjustment')),
  reference_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_point_tx_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_household ON point_transactions(household_id);
CREATE INDEX IF NOT EXISTS idx_point_tx_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_tx_created ON point_transactions(created_at);

ALTER TABLE cleaning_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_lottery ENABLE ROW LEVEL SECURITY;
ALTER TABLE initial_zone_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_assignment_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_weekly_task_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_helpers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trash_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cleaning_zones_read" ON cleaning_zones;
CREATE POLICY "cleaning_zones_read" ON cleaning_zones FOR SELECT USING (true);
DROP POLICY IF EXISTS "cleaning_zones_admin" ON cleaning_zones;
CREATE POLICY "cleaning_zones_admin" ON cleaning_zones FOR ALL USING (true);

DROP POLICY IF EXISTS "cleaning_tasks_read" ON cleaning_tasks;
CREATE POLICY "cleaning_tasks_read" ON cleaning_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "cleaning_tasks_admin" ON cleaning_tasks;
CREATE POLICY "cleaning_tasks_admin" ON cleaning_tasks FOR ALL USING (true);

DROP POLICY IF EXISTS "cleaning_lottery_read" ON cleaning_lottery;
CREATE POLICY "cleaning_lottery_read" ON cleaning_lottery FOR SELECT USING (true);
DROP POLICY IF EXISTS "cleaning_lottery_all" ON cleaning_lottery;
CREATE POLICY "cleaning_lottery_all" ON cleaning_lottery FOR ALL USING (true);

DROP POLICY IF EXISTS "initial_zone_assignments_read" ON initial_zone_assignments;
CREATE POLICY "initial_zone_assignments_read" ON initial_zone_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "initial_zone_assignments_all" ON initial_zone_assignments;
CREATE POLICY "initial_zone_assignments_all" ON initial_zone_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS "overrides_read" ON cleaning_assignment_overrides;
CREATE POLICY "overrides_read" ON cleaning_assignment_overrides FOR SELECT USING (true);
DROP POLICY IF EXISTS "overrides_all" ON cleaning_assignment_overrides;
CREATE POLICY "overrides_all" ON cleaning_assignment_overrides FOR ALL USING (true);

DROP POLICY IF EXISTS "weekly_task_checks_read" ON cleaning_weekly_task_checks;
CREATE POLICY "weekly_task_checks_read" ON cleaning_weekly_task_checks FOR SELECT USING (true);
DROP POLICY IF EXISTS "weekly_task_checks_all" ON cleaning_weekly_task_checks;
CREATE POLICY "weekly_task_checks_all" ON cleaning_weekly_task_checks FOR ALL USING (true);

DROP POLICY IF EXISTS "cleaning_completions_read" ON cleaning_completions;
CREATE POLICY "cleaning_completions_read" ON cleaning_completions FOR SELECT USING (true);
DROP POLICY IF EXISTS "cleaning_completions_all" ON cleaning_completions;
CREATE POLICY "cleaning_completions_all" ON cleaning_completions FOR ALL USING (true);

DROP POLICY IF EXISTS "help_requests_read" ON cleaning_help_requests;
CREATE POLICY "help_requests_read" ON cleaning_help_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "help_requests_all" ON cleaning_help_requests;
CREATE POLICY "help_requests_all" ON cleaning_help_requests FOR ALL USING (true);

DROP POLICY IF EXISTS "cleaning_helpers_read" ON cleaning_helpers;
CREATE POLICY "cleaning_helpers_read" ON cleaning_helpers FOR SELECT USING (true);
DROP POLICY IF EXISTS "cleaning_helpers_all" ON cleaning_helpers;
CREATE POLICY "cleaning_helpers_all" ON cleaning_helpers FOR ALL USING (true);

DROP POLICY IF EXISTS "trash_events_read" ON trash_events;
CREATE POLICY "trash_events_read" ON trash_events FOR SELECT USING (true);
DROP POLICY IF EXISTS "trash_events_all" ON trash_events;
CREATE POLICY "trash_events_all" ON trash_events FOR ALL USING (true);

DROP POLICY IF EXISTS "point_transactions_read" ON point_transactions;
CREATE POLICY "point_transactions_read" ON point_transactions FOR SELECT USING (true);
DROP POLICY IF EXISTS "point_transactions_all" ON point_transactions;
CREATE POLICY "point_transactions_all" ON point_transactions FOR ALL USING (true);

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE 
    cleaning_zones, 
    cleaning_tasks, 
    cleaning_lottery, 
    initial_zone_assignments, 
    cleaning_assignment_overrides, 
    cleaning_weekly_task_checks, 
    cleaning_completions, 
    cleaning_help_requests, 
    cleaning_helpers, 
    trash_events, 
    point_transactions;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

CREATE OR REPLACE FUNCTION get_iso_week_monday(p_date TIMESTAMPTZ DEFAULT now())
RETURNS DATE AS $$
BEGIN
  RETURN date_trunc('week', p_date)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION rpc_execute_initial_lottery(
  p_household_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_already_executed BOOLEAN;
  v_lottery_id UUID;
  v_week_monday DATE;
  v_users UUID[];
  v_zones UUID[];
  v_user_count INT;
  v_zone_count INT;
  i INT;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = p_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo el administrador puede realizar el sorteo.');
  END IF;

  SELECT EXISTS (SELECT 1 FROM cleaning_lottery WHERE household_id = p_household_id) INTO v_already_executed;
  IF v_already_executed THEN
    RETURN jsonb_build_object('success', false, 'error', 'El sorteo ya ha sido realizado y está bloqueado.');
  END IF;

  v_week_monday := get_iso_week_monday(now());

  SELECT array_agg(id) INTO v_users FROM (
    SELECT id FROM profiles ORDER BY random()
  ) u;

  SELECT array_agg(id) INTO v_zones FROM (
    SELECT id FROM cleaning_zones WHERE household_id = p_household_id ORDER BY rotation_order ASC
  ) z;

  v_user_count := array_length(v_users, 1);
  v_zone_count := array_length(v_zones, 1);

  IF v_user_count != 3 OR v_zone_count != 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se requieren exactamente 3 usuarios y 3 zonas para el sorteo.');
  END IF;

  INSERT INTO cleaning_lottery (household_id, executed_by, base_week_start, is_locked)
  VALUES (p_household_id, p_admin_id, v_week_monday, true)
  RETURNING id INTO v_lottery_id;

  FOR i IN 1..3 LOOP
    INSERT INTO initial_zone_assignments (lottery_id, user_id, zone_id)
    VALUES (v_lottery_id, v_users[i], v_zones[i]);
  END LOOP;

  RETURN jsonb_build_object(
    'success', true, 
    'lottery_id', v_lottery_id, 
    'base_week_start', v_week_monday
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_get_current_zone_assignments(
  p_household_id UUID,
  p_target_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  zone_id UUID,
  zone_name TEXT,
  zone_slug TEXT,
  zone_icon TEXT,
  zone_default_points INT,
  zone_help_points INT,
  assigned_user_id UUID,
  assigned_user_name TEXT,
  is_override BOOLEAN,
  week_start DATE
) AS $$
DECLARE
  v_lottery cleaning_lottery%ROWTYPE;
  v_week_monday DATE;
  v_weeks_diff INT;
BEGIN
  v_week_monday := get_iso_week_monday(p_target_date);

  SELECT * INTO v_lottery FROM cleaning_lottery WHERE household_id = p_household_id;

  IF v_lottery.id IS NULL THEN
    RETURN QUERY
    SELECT 
      cz.id AS zone_id,
      cz.name AS zone_name,
      cz.slug AS zone_slug,
      cz.icon AS zone_icon,
      cz.default_points AS zone_default_points,
      cz.help_points AS zone_help_points,
      NULL::UUID AS assigned_user_id,
      'Sin asignar'::TEXT AS assigned_user_name,
      false AS is_override,
      v_week_monday AS week_start
    FROM cleaning_zones cz
    WHERE cz.household_id = p_household_id
    ORDER BY cz.rotation_order;
    RETURN;
  END IF;

  v_weeks_diff := ((v_week_monday - v_lottery.base_week_start) / 7)::INT;
  IF v_weeks_diff < 0 THEN
    v_weeks_diff := 0;
  END IF;

  RETURN QUERY
  WITH calculated_rotation AS (
    SELECT 
      cz.id AS cz_id,
      cz.name AS cz_name,
      cz.slug AS cz_slug,
      cz.icon AS cz_icon,
      cz.default_points AS cz_default_points,
      cz.help_points AS cz_help_points,
      cz.rotation_order AS target_order,
      ((cz.rotation_order - (v_weeks_diff % 3) + 3) % 3) AS origin_order
    FROM cleaning_zones cz
    WHERE cz.household_id = p_household_id
  ),
  resolved_users AS (
    SELECT 
      cr.cz_id,
      cr.cz_name,
      cr.cz_slug,
      cr.cz_icon,
      cr.cz_default_points,
      cr.cz_help_points,
      p.id AS calc_user_id,
      p.name AS calc_user_name
    FROM calculated_rotation cr
    JOIN cleaning_zones oz ON oz.household_id = p_household_id AND oz.rotation_order = cr.origin_order
    JOIN initial_zone_assignments iza ON iza.lottery_id = v_lottery.id AND iza.zone_id = oz.id
    JOIN profiles p ON p.id = iza.user_id
  )
  SELECT 
    ru.cz_id AS zone_id,
    ru.cz_name AS zone_name,
    ru.cz_slug AS zone_slug,
    ru.cz_icon AS zone_icon,
    ru.cz_default_points AS zone_default_points,
    ru.cz_help_points AS zone_help_points,
    COALESCE(ov.user_id, ru.calc_user_id) AS assigned_user_id,
    COALESCE(ovp.name, ru.calc_user_name) AS assigned_user_name,
    (ov.id IS NOT NULL) AS is_override,
    v_week_monday AS week_start
  FROM resolved_users ru
  LEFT JOIN cleaning_assignment_overrides ov 
    ON ov.household_id = p_household_id 
   AND ov.week_start = v_week_monday 
   AND ov.zone_id = ru.cz_id
  LEFT JOIN profiles ovp ON ovp.id = ov.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_toggle_cleaning_task(
  p_task_id UUID,
  p_user_id UUID,
  p_week_start DATE DEFAULT get_iso_week_monday(now())
)
RETURNS JSONB AS $$
DECLARE
  v_zone_id UUID;
  v_household_id UUID;
  v_assigned_user_id UUID;
  v_is_helper BOOLEAN;
  v_existing_check UUID;
  v_total_tasks INT;
  v_checked_tasks INT;
  v_is_now_completed BOOLEAN;
  v_zone cleaning_zones%ROWTYPE;
  v_completion_id UUID;
  v_helper RECORD;
BEGIN
  SELECT ct.zone_id, cz.household_id INTO v_zone_id, v_household_id
  FROM cleaning_tasks ct
  JOIN cleaning_zones cz ON cz.id = ct.zone_id
  WHERE ct.id = p_task_id;

  IF v_zone_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tarea no encontrada');
  END IF;

  SELECT * INTO v_zone FROM cleaning_zones WHERE id = v_zone_id;

  SELECT assigned_user_id INTO v_assigned_user_id
  FROM rpc_get_current_zone_assignments(v_household_id, p_week_start::TIMESTAMPTZ)
  WHERE zone_id = v_zone_id;

  SELECT EXISTS (
    SELECT 1 
    FROM cleaning_helpers ch
    JOIN cleaning_help_requests chr ON chr.id = ch.help_request_id
    WHERE chr.zone_id = v_zone_id 
      AND chr.week_start = p_week_start
      AND ch.helper_id = p_user_id
  ) INTO v_is_helper;

  IF v_assigned_user_id != p_user_id AND NOT v_is_helper THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '🔒 Esta no es tu zona esta semana. Solo puedes limpiar tu zona asignada o actuar como ayudante aceptado.'
    );
  END IF;

  SELECT id INTO v_existing_check 
  FROM cleaning_weekly_task_checks
  WHERE task_id = p_task_id AND week_start = p_week_start;

  IF v_existing_check IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'La tarea ya está completada y no se puede desmarcar.');
  ELSE
    INSERT INTO cleaning_weekly_task_checks (task_id, week_start, completed_by)
    VALUES (p_task_id, p_week_start, p_user_id);
  END IF;

  SELECT count(*) INTO v_total_tasks FROM cleaning_tasks WHERE zone_id = v_zone_id;
  SELECT count(*) INTO v_checked_tasks 
  FROM cleaning_weekly_task_checks cwtc
  JOIN cleaning_tasks ct ON ct.id = cwtc.task_id
  WHERE ct.zone_id = v_zone_id AND cwtc.week_start = p_week_start;

  v_is_now_completed := (v_total_tasks > 0 AND v_checked_tasks = v_total_tasks);

  IF v_is_now_completed THEN
    IF NOT EXISTS (SELECT 1 FROM cleaning_completions WHERE zone_id = v_zone_id AND week_start = p_week_start) THEN
      INSERT INTO cleaning_completions (household_id, zone_id, week_start, responsible_user_id, points_awarded)
      VALUES (v_household_id, v_zone_id, p_week_start, v_assigned_user_id, v_zone.default_points)
      RETURNING id INTO v_completion_id;

      INSERT INTO point_transactions (household_id, user_id, points, type, reference_id, description)
      VALUES (
        v_household_id,
        v_assigned_user_id,
        v_zone.default_points,
        'cleaning',
        v_completion_id,
        'Limpieza completada: ' || v_zone.name
      );

      FOR v_helper IN 
        SELECT ch.id, ch.helper_id, p.name 
        FROM cleaning_helpers ch
        JOIN cleaning_help_requests chr ON chr.id = ch.help_request_id
        JOIN profiles p ON p.id = ch.helper_id
        WHERE chr.zone_id = v_zone_id AND chr.week_start = p_week_start
      LOOP
        UPDATE cleaning_helpers 
        SET points_awarded = v_zone.help_points 
        WHERE id = v_helper.id;

        INSERT INTO point_transactions (household_id, user_id, points, type, reference_id, description)
        VALUES (
          v_household_id,
          v_helper.helper_id,
          v_zone.help_points,
          'helping',
          v_helper.id,
          'Ayuda en limpieza de ' || v_zone.name
        );
      END LOOP;

      UPDATE cleaning_help_requests 
      SET status = 'completed'
      WHERE zone_id = v_zone_id AND week_start = p_week_start;
    END IF;
  ELSE
    DELETE FROM point_transactions 
    WHERE reference_id IN (
      SELECT id FROM cleaning_completions WHERE zone_id = v_zone_id AND week_start = p_week_start
    );
    DELETE FROM point_transactions
    WHERE reference_id IN (
      SELECT ch.id FROM cleaning_helpers ch
      JOIN cleaning_help_requests chr ON chr.id = ch.help_request_id
      WHERE chr.zone_id = v_zone_id AND chr.week_start = p_week_start
    );
    DELETE FROM cleaning_completions WHERE zone_id = v_zone_id AND week_start = p_week_start;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'action', 'checked', 
    'task_id', p_task_id, 
    'is_completed', v_is_now_completed,
    'checked_tasks', v_checked_tasks,
    'total_tasks', v_total_tasks
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_request_cleaning_help(
  p_household_id UUID,
  p_zone_id UUID,
  p_user_id UUID,
  p_week_start DATE DEFAULT get_iso_week_monday(now())
)
RETURNS JSONB AS $$
DECLARE
  v_assigned_user_id UUID;
  v_req_id UUID;
BEGIN
  SELECT assigned_user_id INTO v_assigned_user_id
  FROM rpc_get_current_zone_assignments(p_household_id, p_week_start::TIMESTAMPTZ)
  WHERE zone_id = p_zone_id;

  IF v_assigned_user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo el usuario asignado a la zona puede solicitar ayuda.');
  END IF;

  INSERT INTO cleaning_help_requests (household_id, zone_id, requester_id, week_start, status)
  VALUES (p_household_id, p_zone_id, p_user_id, p_week_start, 'open')
  ON CONFLICT (zone_id, week_start, requester_id) 
  DO UPDATE SET status = 'open'
  RETURNING id INTO v_req_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_accept_cleaning_help(
  p_help_request_id UUID,
  p_helper_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_req cleaning_help_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM cleaning_help_requests WHERE id = p_help_request_id;
  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solicitud de ayuda no encontrada.');
  END IF;

  IF v_req.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta solicitud ya no está abierta.');
  END IF;

  IF v_req.requester_id = p_helper_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes aceptar tu propia solicitud de ayuda.');
  END IF;

  INSERT INTO cleaning_helpers (help_request_id, helper_id)
  VALUES (p_help_request_id, p_helper_id)
  ON CONFLICT (help_request_id, helper_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_record_trash(
  p_household_id UUID,
  p_user_id UUID,
  p_trash_type TEXT DEFAULT 'general'
)
RETURNS JSONB AS $$
DECLARE
  v_event_id UUID;
  v_points INT := 1;
BEGIN
  -- Regla de negocio: máximo 1 vez al día por persona
  IF EXISTS (
    SELECT 1 FROM trash_events
    WHERE user_id = p_user_id
      AND created_at >= date_trunc('day', now())
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Ya has registrado la basura hoy. Solo se permite una vez al día por persona.'
    );
  END IF;

  INSERT INTO trash_events (household_id, user_id, trash_type)
  VALUES (p_household_id, p_user_id, p_trash_type)
  RETURNING id INTO v_event_id;

  INSERT INTO point_transactions (household_id, user_id, points, type, reference_id, description)
  VALUES (p_household_id, p_user_id, v_points, 'trash', v_event_id, 'Tirar la basura');

  RETURN jsonb_build_object('success', true, 'event_id', v_event_id, 'points', v_points);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rpc_admin_reassign_zone(
  p_household_id UUID,
  p_admin_id UUID,
  p_user_id UUID,
  p_zone_id UUID,
  p_week_start DATE DEFAULT get_iso_week_monday(now()),
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_prev_zone_id UUID;
BEGIN
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = p_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo el administrador puede realizar reasignaciones excepcionales.');
  END IF;

  SELECT zone_id INTO v_prev_zone_id
  FROM rpc_get_current_zone_assignments(p_household_id, p_week_start::TIMESTAMPTZ)
  WHERE assigned_user_id = p_user_id;

  INSERT INTO cleaning_assignment_overrides (
    household_id, week_start, user_id, zone_id, assigned_by, previous_zone_id, reason
  )
  VALUES (
    p_household_id, p_week_start, p_user_id, p_zone_id, p_admin_id, v_prev_zone_id, p_reason
  )
  ON CONFLICT (household_id, week_start, user_id)
  DO UPDATE SET zone_id = p_zone_id, assigned_by = p_admin_id, previous_zone_id = v_prev_zone_id, reason = p_reason, created_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

INSERT INTO cleaning_zones (id, household_id, slug, name, icon, default_points, help_points, rotation_order)
VALUES
  ('c0c10a00-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'cocina', 'Cocina', '🍳', 1, 1, 0),
  ('5a100000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'salon',  'Salón',  '🛋️', 3, 1, 1),
  ('ba700000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'bano',   'Baño',   '🚿', 2, 1, 2)
ON CONFLICT (slug) DO UPDATE 
SET default_points = EXCLUDED.default_points, 
    rotation_order = EXCLUDED.rotation_order;

INSERT INTO cleaning_tasks (id, zone_id, title, order_index)
VALUES
  ('70000000-0000-4000-8000-000000000001', '5a100000-0000-4000-8000-000000000002', 'Barrer / aspirar', 1),
  ('70000000-0000-4000-8000-000000000002', '5a100000-0000-4000-8000-000000000002', 'Fregar', 2),
  ('70000000-0000-4000-8000-000000000003', '5a100000-0000-4000-8000-000000000002', 'Limpiar superficies', 3),
  ('70000000-0000-4000-8000-000000000004', '5a100000-0000-4000-8000-000000000002', 'Ordenar', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cleaning_tasks (id, zone_id, title, order_index)
VALUES
  ('80000000-0000-4000-8000-000000000001', 'ba700000-0000-4000-8000-000000000003', 'Limpiar lavabo', 1),
  ('80000000-0000-4000-8000-000000000002', 'ba700000-0000-4000-8000-000000000003', 'Limpiar WC', 2),
  ('80000000-0000-4000-8000-000000000003', 'ba700000-0000-4000-8000-000000000003', 'Limpiar ducha / bañera', 3),
  ('80000000-0000-4000-8000-000000000004', 'ba700000-0000-4000-8000-000000000003', 'Limpiar espejo', 4),
  ('80000000-0000-4000-8000-000000000005', 'ba700000-0000-4000-8000-000000000003', 'Barrer / fregar', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO cleaning_tasks (id, zone_id, title, order_index)
VALUES
  ('90000000-0000-4000-8000-000000000001', 'c0c10a00-0000-4000-8000-000000000001', 'Limpiar encimera', 1),
  ('90000000-0000-4000-8000-000000000002', 'c0c10a00-0000-4000-8000-000000000001', 'Limpiar fogones', 2),
  ('90000000-0000-4000-8000-000000000003', 'c0c10a00-0000-4000-8000-000000000001', 'Limpiar fregadero', 3),
  ('90000000-0000-4000-8000-000000000004', 'c0c10a00-0000-4000-8000-000000000001', 'Barrer / fregar', 4),
  ('90000000-0000-4000-8000-000000000005', 'c0c10a00-0000-4000-8000-000000000001', 'Ordenar', 5)
ON CONFLICT (id) DO NOTHING;

