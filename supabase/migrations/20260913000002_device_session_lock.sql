-- ==============================================================================
-- PISOPRO MIGRATION: PERSISTENT DEVICE SESSION LOCK & ATOMIC CLAIM
-- ==============================================================================

-- 1. Añadir columnas de status y device_name a user_sessions si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_sessions' AND column_name = 'device_name'
  ) THEN
    ALTER TABLE user_sessions ADD COLUMN device_name TEXT NOT NULL DEFAULT 'Dispositivo desconocido';
  END IF;
END $$;

-- 2. Asegurar constraint de unicidad estricta para sesiones activas concurrentes
-- Esto garantiza a nivel de base de datos que 1 usuario solo puede tener 1 sesión activa simultánea
DROP INDEX IF EXISTS idx_unique_active_user_session;
CREATE UNIQUE INDEX idx_unique_active_user_session 
ON user_sessions(user_id) 
WHERE (status = 'ACTIVE' AND is_active = true AND expires_at > now());

DROP INDEX IF EXISTS idx_user_sessions_device_lookup;
CREATE INDEX idx_user_sessions_device_lookup 
ON user_sessions(device_id, is_active, status);

-- 3. Actualizar función ATÓMICA claim_profile
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

-- Overload para compatibilidad con firmas de llamada con 2 argumentos
CREATE OR REPLACE FUNCTION claim_profile(
  p_user_id UUID,
  p_device_id TEXT
)
RETURNS JSONB AS $$
BEGIN
  RETURN claim_profile(p_user_id, p_device_id, 'Dispositivo desconocido', 30);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Actualizar función heartbeat_session
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

-- Overload para compatibilidad con heartbeat_session de 1 argumento
CREATE OR REPLACE FUNCTION heartbeat_session(
  p_session_token TEXT
)
RETURNS JSONB AS $$
BEGIN
  RETURN heartbeat_session(p_session_token, NULL, 30);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Función de validación autoritativa en arranque (validate_session)
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

  -- Comprobar concordancia de dispositivo
  IF v_record.device_id != p_device_id THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'DEVICE_MISMATCH');
  END IF;

  -- Comprobar vigencia y estado activo
  IF v_record.is_active = false OR v_record.status != 'ACTIVE' OR v_record.expires_at <= now() THEN
    RETURN jsonb_build_object(
      'valid', false, 
      'reason', v_record.status,
      'is_revoked', (v_record.status = 'REVOKED'),
      'is_expired', (v_record.status = 'EXPIRED' OR v_record.expires_at <= now())
    );
  END IF;

  -- Refrescar última actividad al validar inicio
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

-- 6. Función para liberar/desvincular dispositivo propio
CREATE OR REPLACE FUNCTION release_profile(p_session_token TEXT)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false, status = 'REVOKED'
  WHERE session_token = p_session_token;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Función para desvinculación administrativa (Jorge)
CREATE OR REPLACE FUNCTION admin_force_release_profile(p_user_id UUID)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false, status = 'REVOKED'
  WHERE user_id = p_user_id AND is_active = true;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Actualizar get_profiles_availability con estados claros y device_name
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
