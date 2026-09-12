-- ==============================================================================
-- 20260913000001_cleaning_rules_and_point_transactions.sql
-- PisoPro: Sistema de Limpieza por Zonas, Sorteo, Rotación Determinista,
-- Ayuda en Tiempo Real, Basura y Transacciones de Puntos
-- ==============================================================================

-- 1. TABLA: cleaning_zones (Zonas Principales: Salón, Baño, Cocina)
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

-- 2. TABLA: cleaning_tasks (Checklist de tareas por zona)
CREATE TABLE IF NOT EXISTS cleaning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES cleaning_zones(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cleaning_tasks_zone ON cleaning_tasks(zone_id);

-- 3. TABLA: cleaning_lottery (Registro único de sorteo inicial)
CREATE TABLE IF NOT EXISTS cleaning_lottery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE UNIQUE,
  executed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  base_week_start DATE NOT NULL,
  is_locked BOOLEAN NOT NULL DEFAULT true
);

-- 4. TABLA: initial_zone_assignments (Resultado del sorteo inicial 1:1)
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

-- 5. TABLA: cleaning_assignment_overrides (Reasignaciones excepcionales de Admin)
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

-- 6. TABLA: cleaning_weekly_task_checks (Marcado de checklist semanal)
CREATE TABLE IF NOT EXISTS cleaning_weekly_task_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  completed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_task_week_check UNIQUE (task_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_weekly_checks_task_week ON cleaning_weekly_task_checks(task_id, week_start);

-- 7. TABLA: cleaning_completions (Registro de zonas completadas)
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

-- 8. TABLA: cleaning_help_requests (Peticiones de ayuda en tiempo real)
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

-- 9. TABLA: cleaning_helpers (Compañeros que aceptan ayudar)
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

-- 10. TABLA: trash_events (Registro independiente de tirar basura)
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

-- 11. TABLA: point_transactions (Libro mayor inmutable de puntos)
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

-- ==============================================================================
-- HABILITAR RLS Y POLÍTICAS
-- ==============================================================================
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

-- ==============================================================================
-- REALTIME
-- ==============================================================================
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

-- ==============================================================================
-- FUNCIONES RPC ATÓMICAS (Lógica de Negocio y Seguridad)
-- ==============================================================================

-- Helper: Obtener lunes 00:00 (ISO)
CREATE OR REPLACE FUNCTION get_iso_week_monday(p_date TIMESTAMPTZ DEFAULT now())
RETURNS DATE AS $$
BEGIN
  RETURN date_trunc('week', p_date)::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 1. Sorteo Inicial Único (🎲 REALIZAR SORTEO)
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
  -- Validar rol de admin
  SELECT (role = 'admin') INTO v_is_admin FROM profiles WHERE id = p_admin_id;
  IF v_is_admin IS NOT TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo el administrador puede realizar el sorteo.');
  END IF;

  -- Validar que no se haya realizado antes
  SELECT EXISTS (SELECT 1 FROM cleaning_lottery WHERE household_id = p_household_id) INTO v_already_executed;
  IF v_already_executed THEN
    RETURN jsonb_build_object('success', false, 'error', 'El sorteo ya ha sido realizado y está bloqueado.');
  END IF;

  v_week_monday := get_iso_week_monday(now());

  -- Obtener perfiles ordenados aleatoriamente (shuffle)
  SELECT array_agg(id) INTO v_users FROM (
    SELECT id FROM profiles ORDER BY random()
  ) u;

  -- Obtener zonas ordenadas por rotation_order
  SELECT array_agg(id) INTO v_zones FROM (
    SELECT id FROM cleaning_zones WHERE household_id = p_household_id ORDER BY rotation_order ASC
  ) z;

  v_user_count := array_length(v_users, 1);
  v_zone_count := array_length(v_zones, 1);

  IF v_user_count != 3 OR v_zone_count != 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Se requieren exactamente 3 usuarios y 3 zonas para el sorteo.');
  END IF;

  -- Insertar registro del sorteo
  INSERT INTO cleaning_lottery (household_id, executed_by, base_week_start, is_locked)
  VALUES (p_household_id, p_admin_id, v_week_monday, true)
  RETURNING id INTO v_lottery_id;

  -- Asignar 1:1 biyectivamente
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

-- 2. Obtener Asignación de Zonas para una Semana (Determinista)
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

  -- Si aún no hay sorteo, devolver zonas sin asignar
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

  -- Semanas transcurridas desde el sorteo
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
      -- Orden inicial que le tocó al usuario: (target_order - v_weeks_diff) mod 3
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

-- 3. Marcar/Desmarcar Tarea de Limpieza (con validación de zona propia)
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
  -- Obtener zona y household de la tarea
  SELECT ct.zone_id, cz.household_id INTO v_zone_id, v_household_id
  FROM cleaning_tasks ct
  JOIN cleaning_zones cz ON cz.id = ct.zone_id
  WHERE ct.id = p_task_id;

  IF v_zone_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tarea no encontrada');
  END IF;

  SELECT * INTO v_zone FROM cleaning_zones WHERE id = v_zone_id;

  -- Resolver usuario asignado para esta zona y semana
  SELECT assigned_user_id INTO v_assigned_user_id
  FROM rpc_get_current_zone_assignments(v_household_id, p_week_start::TIMESTAMPTZ)
  WHERE zone_id = v_zone_id;

  -- Comprobar si el usuario es ayudante registrado y aceptado
  SELECT EXISTS (
    SELECT 1 
    FROM cleaning_helpers ch
    JOIN cleaning_help_requests chr ON chr.id = ch.help_request_id
    WHERE chr.zone_id = v_zone_id 
      AND chr.week_start = p_week_start
      AND ch.helper_id = p_user_id
  ) INTO v_is_helper;

  -- REGLA FUNDAMENTAL: Solo el responsable de la zona o un ayudante autorizado pueden marcarla
  IF v_assigned_user_id != p_user_id AND NOT v_is_helper THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', '🔒 Esta no es tu zona esta semana. Solo puedes limpiar tu zona asignada o actuar como ayudante aceptado.'
    );
  END IF;

  -- Comprobar si ya estaba marcada
  SELECT id INTO v_existing_check 
  FROM cleaning_weekly_task_checks
  WHERE task_id = p_task_id AND week_start = p_week_start;

  IF v_existing_check IS NOT NULL THEN
    -- Desmarcar tarea
    DELETE FROM cleaning_weekly_task_checks WHERE id = v_existing_check;
    RETURN jsonb_build_object('success', true, 'action', 'unckecked', 'task_id', p_task_id);
  ELSE
    -- Marcar tarea
    INSERT INTO cleaning_weekly_task_checks (task_id, week_start, completed_by)
    VALUES (p_task_id, p_week_start, p_user_id);
  END IF;

  -- Verificar si todas las tareas de la zona están completadas
  SELECT count(*) INTO v_total_tasks FROM cleaning_tasks WHERE zone_id = v_zone_id;
  SELECT count(*) INTO v_checked_tasks 
  FROM cleaning_weekly_task_checks cwtc
  JOIN cleaning_tasks ct ON ct.id = cwtc.task_id
  WHERE ct.zone_id = v_zone_id AND cwtc.week_start = p_week_start;

  v_is_now_completed := (v_total_tasks > 0 AND v_checked_tasks = v_total_tasks);

  IF v_is_now_completed THEN
    -- Registrar finalización de zona si aún no está registrada
    IF NOT EXISTS (SELECT 1 FROM cleaning_completions WHERE zone_id = v_zone_id AND week_start = p_week_start) THEN
      INSERT INTO cleaning_completions (household_id, zone_id, week_start, responsible_user_id, points_awarded)
      VALUES (v_household_id, v_zone_id, p_week_start, v_assigned_user_id, v_zone.default_points)
      RETURNING id INTO v_completion_id;

      -- Registrar puntos de limpieza para el responsable
      INSERT INTO point_transactions (household_id, user_id, points, type, reference_id, description)
      VALUES (
        v_household_id, 
        v_assigned_user_id, 
        v_zone.default_points, 
        'cleaning', 
        v_completion_id, 
        'Limpieza completada: ' || v_zone.name
      );

      -- Conceder +1 punto a cada ayudante de esta zona y semana
      FOR v_helper IN 
        SELECT ch.id, ch.helper_id
        FROM cleaning_helpers ch
        JOIN cleaning_help_requests chr ON chr.id = ch.help_request_id
        WHERE chr.zone_id = v_zone_id AND chr.week_start = p_week_start
      LOOP
        UPDATE cleaning_helpers SET points_awarded = v_zone.help_points WHERE id = v_helper.id;

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

      -- Marcar solicitud de ayuda como completada
      UPDATE cleaning_help_requests 
      SET status = 'completed' 
      WHERE zone_id = v_zone_id AND week_start = p_week_start AND status = 'open';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true, 
    'action', 'checked', 
    'task_id', p_task_id, 
    'is_zone_completed', v_is_now_completed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Pedir Ayuda con Zona (🤝 NECESITO AYUDA)
CREATE OR REPLACE FUNCTION rpc_request_cleaning_help(
  p_zone_id UUID,
  p_user_id UUID,
  p_week_start DATE DEFAULT get_iso_week_monday(now())
)
RETURNS JSONB AS $$
DECLARE
  v_household_id UUID;
  v_assigned_user_id UUID;
  v_request_id UUID;
BEGIN
  SELECT household_id INTO v_household_id FROM cleaning_zones WHERE id = p_zone_id;

  -- Comprobar si el usuario es el responsable de la zona
  SELECT assigned_user_id INTO v_assigned_user_id
  FROM rpc_get_current_zone_assignments(v_household_id, p_week_start::TIMESTAMPTZ)
  WHERE zone_id = p_zone_id;

  IF v_assigned_user_id != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Solo el responsable asignado a la zona puede solicitar ayuda.');
  END IF;

  -- Insertar solicitud
  INSERT INTO cleaning_help_requests (household_id, zone_id, requester_id, week_start, status)
  VALUES (v_household_id, p_zone_id, p_user_id, p_week_start, 'open')
  ON CONFLICT (zone_id, week_start, requester_id) DO UPDATE SET status = 'open'
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object('success', true, 'request_id', v_request_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Aceptar Ayuda ([ AYUDAR ])
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
    RETURN jsonb_build_object('success', false, 'error', 'Solicitud de ayuda no encontrada');
  END IF;

  IF v_req.requester_id = p_helper_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puedes ayudarte a ti mismo.');
  END IF;

  INSERT INTO cleaning_helpers (help_request_id, helper_id)
  VALUES (p_help_request_id, p_helper_id)
  ON CONFLICT (help_request_id, helper_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Registrar Evento de Basura (🗑️ HE TIRADO LA BASURA)
CREATE OR REPLACE FUNCTION rpc_record_trash(
  p_household_id UUID,
  p_user_id UUID,
  p_trash_type TEXT DEFAULT 'general'
)
RETURNS JSONB AS $$
DECLARE
  v_event_id UUID;
  v_user_name TEXT;
BEGIN
  SELECT name INTO v_user_name FROM profiles WHERE id = p_user_id;

  INSERT INTO trash_events (household_id, user_id, trash_type)
  VALUES (p_household_id, p_user_id, p_trash_type)
  RETURNING id INTO v_event_id;

  -- Exactamente +1 punto real sin multiplicadores
  INSERT INTO point_transactions (household_id, user_id, points, type, reference_id, description)
  VALUES (p_household_id, p_user_id, 1, 'trash', v_event_id, 'Basura depositada');

  RETURN jsonb_build_object(
    'success', true, 
    'event_id', v_event_id, 
    'user_name', v_user_name, 
    'created_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Reasignación Excepcional de Zona (Admin)
CREATE OR REPLACE FUNCTION rpc_admin_reassign_zone(
  p_household_id UUID,
  p_admin_id UUID,
  p_user_id UUID,
  p_zone_id UUID,
  p_week_start DATE,
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

  -- Determinar zona previa
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

-- ==============================================================================
-- SEED INICIAL: Zonas y Checklists Base
-- ==============================================================================
INSERT INTO cleaning_zones (id, household_id, slug, name, icon, default_points, help_points, rotation_order)
VALUES
  ('c0c10a00-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'cocina', 'Cocina', '🍳', 1, 1, 0),
  ('5a100000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'salon',  'Salón',  '🛋️', 3, 1, 1),
  ('ba700000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'bano',   'Baño',   '🚿', 2, 1, 2)
ON CONFLICT (slug) DO UPDATE 
SET default_points = EXCLUDED.default_points, 
    rotation_order = EXCLUDED.rotation_order;

-- Checklists de cada zona:
-- SALÓN
INSERT INTO cleaning_tasks (id, zone_id, title, order_index)
VALUES
  ('70000000-0000-4000-8000-000000000001', '5a100000-0000-4000-8000-000000000002', 'Barrer / aspirar', 1),
  ('70000000-0000-4000-8000-000000000002', '5a100000-0000-4000-8000-000000000002', 'Fregar', 2),
  ('70000000-0000-4000-8000-000000000003', '5a100000-0000-4000-8000-000000000002', 'Limpiar superficies', 3),
  ('70000000-0000-4000-8000-000000000004', '5a100000-0000-4000-8000-000000000002', 'Ordenar', 4)
ON CONFLICT (id) DO NOTHING;

-- BAÑO
INSERT INTO cleaning_tasks (id, zone_id, title, order_index)
VALUES
  ('80000000-0000-4000-8000-000000000001', 'ba700000-0000-4000-8000-000000000003', 'Limpiar lavabo', 1),
  ('80000000-0000-4000-8000-000000000002', 'ba700000-0000-4000-8000-000000000003', 'Limpiar WC', 2),
  ('80000000-0000-4000-8000-000000000003', 'ba700000-0000-4000-8000-000000000003', 'Limpiar ducha / bañera', 3),
  ('80000000-0000-4000-8000-000000000004', 'ba700000-0000-4000-8000-000000000003', 'Limpiar espejo', 4),
  ('80000000-0000-4000-8000-000000000005', 'ba700000-0000-4000-8000-000000000003', 'Barrer / fregar', 5)
ON CONFLICT (id) DO NOTHING;

-- COCINA
INSERT INTO cleaning_tasks (id, zone_id, title, order_index)
VALUES
  ('90000000-0000-4000-8000-000000000001', 'c0c10a00-0000-4000-8000-000000000001', 'Limpiar encimera', 1),
  ('90000000-0000-4000-8000-000000000002', 'c0c10a00-0000-4000-8000-000000000001', 'Limpiar fogones', 2),
  ('90000000-0000-4000-8000-000000000003', 'c0c10a00-0000-4000-8000-000000000001', 'Limpiar fregadero', 3),
  ('90000000-0000-4000-8000-000000000004', 'c0c10a00-0000-4000-8000-000000000001', 'Barrer / fregar', 4),
  ('90000000-0000-4000-8000-000000000005', 'c0c10a00-0000-4000-8000-000000000001', 'Ordenar', 5)
ON CONFLICT (id) DO NOTHING;
