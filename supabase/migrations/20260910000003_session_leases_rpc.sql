-- ==============================================================================
-- 20260910000003_session_leases_rpc.sql
-- PisoPro: Atomic Profile Claiming, Heartbeat and Leases in PostgreSQL
-- ==============================================================================

-- 1. Atomic Profile Claim
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
  -- Lock the profile row to ensure atomicity across concurrent requests
  SELECT name INTO v_user_name
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil de usuario no encontrado'
    );
  END IF;

  -- Check if another active session holds a valid lease
  SELECT id, device_id, session_token, expires_at INTO v_existing_session
  FROM user_sessions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY claimed_at DESC
  LIMIT 1
  FOR UPDATE;

  IF FOUND THEN
    -- If the same device is claiming again, renew the lease
    IF v_existing_session.device_id = p_device_id THEN
      v_expires_at := now() + (p_lease_seconds || ' seconds')::interval;
      UPDATE user_sessions
      SET last_seen = now(),
          expires_at = v_expires_at
      WHERE id = v_existing_session.id;

      RETURN jsonb_build_object(
        'success', true,
        'session_token', v_existing_session.session_token,
        'expires_at', v_expires_at,
        'user_id', p_user_id,
        'renewed', true
      );
    ELSE
      -- A different device currently holds an active lease
      RETURN jsonb_build_object(
        'success', false,
        'error', v_user_name || ' está en uso en otro dispositivo',
        'is_busy', true,
        'expires_at', v_existing_session.expires_at
      );
    END IF;
  END IF;

  -- Deactivate any previous expired sessions for this user
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = p_user_id AND is_active = true;

  -- Generate secure random token and expiration time
  v_new_token := encode(gen_random_bytes(32), 'hex');
  v_expires_at := now() + (p_lease_seconds || ' seconds')::interval;

  -- Create fresh active session lease
  INSERT INTO user_sessions (
    user_id,
    device_id,
    session_token,
    last_seen,
    expires_at,
    is_active,
    claimed_at
  ) VALUES (
    p_user_id,
    p_device_id,
    v_new_token,
    now(),
    v_expires_at,
    true,
    now()
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

-- 2. Heartbeat to extend active lease
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
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Sesión no válida o caducada'
    );
  END IF;

  v_new_expires_at := now() + (p_extend_seconds || ' seconds')::interval;

  UPDATE user_sessions
  SET last_seen = now(),
      expires_at = v_new_expires_at
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_new_expires_at,
    'user_id', v_session.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Voluntary profile release (Logout)
CREATE OR REPLACE FUNCTION release_profile(
  p_session_token TEXT
)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE session_token = p_session_token;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin Force Release (Jorge can release any stuck user)
CREATE OR REPLACE FUNCTION admin_force_release_profile(
  p_user_id UUID
)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_sessions
  SET is_active = false
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Availability overview of all 3 profiles with realtime status
CREATE OR REPLACE FUNCTION get_profiles_availability(
  p_current_device_id TEXT DEFAULT ''
)
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
