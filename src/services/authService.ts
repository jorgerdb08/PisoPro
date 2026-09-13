import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionStatus = "ACTIVE" | "EXPIRED" | "REVOKED" | "UNCLAIMED";

export interface ProfileAvailability {
  id: string;
  name: "Jorge" | "Samuel" | "David";
  role: "admin" | "member";
  avatar_url: string | null;
  is_busy: boolean;
  is_current_device: boolean;
  last_seen: string | null;
  expires_at: string | null;
  status: SessionStatus;
  device_name: string;
}

export interface ClaimResult {
  success: boolean;
  session_token?: string;
  expires_at?: string;
  user_id?: string;
  user_name?: string;
  role?: "admin" | "member";
  avatar_url?: string | null;
  device_name?: string;
  error?: string;
  is_busy?: boolean;
  renewed?: boolean;
}

export interface HeartbeatResult {
  success: boolean;
  expires_at?: string;
  user_id?: string;
  status?: string;
  is_revoked?: boolean;
  is_expired?: boolean;
  error?: string;
}

export interface ValidateSessionResult {
  valid: boolean;
  user_id?: string;
  name?: "Jorge" | "Samuel" | "David";
  role?: "admin" | "member";
  avatar_url?: string | null;
  status?: SessionStatus;
  reason?: string;
  is_revoked?: boolean;
  is_expired?: boolean;
}

interface SupabaseRpcClient {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>;
}

function getRpcClient(): SupabaseRpcClient {
  return getSupabaseBrowserClient() as unknown as SupabaseRpcClient;
}

export const authService = {
  /**
   * Obtiene los 3 perfiles con su estado de disponibilidad en tiempo real
   */
  async getProfilesAvailability(deviceId: string): Promise<ProfileAvailability[]> {
    const client = getRpcClient();
    const { data, error } = await client.rpc("get_profiles_availability", {
      p_current_device_id: deviceId,
    });

    if (error) {
      console.error("[authService] Error getting profiles availability:", error);
      return [];
    }

    return (data || []) as ProfileAvailability[];
  },

  /**
   * Intenta seleccionar un perfil de forma atómica en PostgreSQL
   */
  async claimProfile(
    userId: string,
    deviceId: string,
    deviceName: string = "Dispositivo desconocido",
    inactivityDays: number = 30
  ): Promise<ClaimResult> {
    const client = getRpcClient();
    const { data, error } = await client.rpc("claim_profile", {
      p_user_id: userId,
      p_device_id: deviceId,
      p_device_name: deviceName,
      p_inactivity_days: inactivityDays,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Error al reclamar perfil de usuario",
      };
    }

    return (
      (data as unknown as ClaimResult) || { success: false, error: "Respuesta vacía" }
    );
  },

  /**
   * Valida autoritativamente el token y dispositivo contra Supabase al iniciar
   */
  async validateSession(
    sessionToken: string,
    deviceId: string
  ): Promise<ValidateSessionResult> {
    const client = getRpcClient();
    const { data, error } = await client.rpc("validate_session", {
      p_session_token: sessionToken,
      p_device_id: deviceId,
    });

    if (error) {
      console.warn("[authService] Error validating session:", error);
      return { valid: false, reason: error.message };
    }

    return (data as unknown as ValidateSessionResult) || { valid: false, reason: "EMPTY" };
  },

  /**
   * Extiende el lease de una sesión activa y actualiza last_seen (Heartbeat)
   */
  async sendHeartbeat(
    sessionToken: string,
    deviceName?: string,
    extendDays: number = 30
  ): Promise<HeartbeatResult> {
    const client = getRpcClient();
    const { data, error } = await client.rpc("heartbeat_session", {
      p_session_token: sessionToken,
      p_device_name: deviceName || null,
      p_extend_days: extendDays,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return (data as unknown as HeartbeatResult) || { success: false };
  },

  /**
   * Libera voluntariamente el dispositivo en la base de datos (Unlink device)
   */
  async releaseProfile(sessionToken: string): Promise<boolean> {
    const client = getRpcClient();
    const { data, error } = await client.rpc("release_profile", {
      p_session_token: sessionToken,
    });

    if (error) {
      console.warn("[authService] Error releasing profile:", error);
      return false;
    }

    const res = data as unknown as { success?: boolean };
    return res?.success === true;
  },

  /**
   * Permite a Jorge (admin) forzar la desvinculación de un usuario
   */
  async adminForceRelease(userId: string): Promise<boolean> {
    const client = getRpcClient();
    const { data, error } = await client.rpc("admin_force_release_profile", {
      p_user_id: userId,
    });

    if (error) {
      console.error("[authService] Error in admin force release:", error);
      return false;
    }

    const res = data as unknown as { success?: boolean };
    return res?.success === true;
  },
};
