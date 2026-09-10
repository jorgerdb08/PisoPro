import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface ProfileAvailability {
  id: string;
  name: "Jorge" | "Samuel" | "David";
  role: "admin" | "member";
  avatar_url: string | null;
  is_busy: boolean;
  is_current_device: boolean;
  last_seen: string | null;
  expires_at: string | null;
}

export interface ClaimResult {
  success: boolean;
  session_token?: string;
  expires_at?: string;
  user_id?: string;
  error?: string;
  is_busy?: boolean;
  renewed?: boolean;
}

export interface HeartbeatResult {
  success: boolean;
  expires_at?: string;
  user_id?: string;
  error?: string;
}

export const authService = {
  /**
   * Obtiene los 3 perfiles con su estado de disponibilidad en tiempo real
   */
  async getProfilesAvailability(deviceId: string): Promise<ProfileAvailability[]> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await (supabase.rpc as any)("get_profiles_availability", {
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
    leaseSeconds: number = 60
  ): Promise<ClaimResult> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await (supabase.rpc as any)("claim_profile", {
      p_user_id: userId,
      p_device_id: deviceId,
      p_lease_seconds: leaseSeconds,
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
   * Extiende el lease de una sesión activa (Heartbeat)
   */
  async sendHeartbeat(
    sessionToken: string,
    extendSeconds: number = 60
  ): Promise<HeartbeatResult> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await (supabase.rpc as any)("heartbeat_session", {
      p_session_token: sessionToken,
      p_extend_seconds: extendSeconds,
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
   * Libera voluntariamente el perfil en la base de datos (Logout)
   */
  async releaseProfile(sessionToken: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await (supabase.rpc as any)("release_profile", {
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
   * Permite a Jorge (admin) forzar la liberación de un usuario bloqueado
   */
  async adminForceRelease(userId: string): Promise<boolean> {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await (supabase.rpc as any)("admin_force_release_profile", {
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
