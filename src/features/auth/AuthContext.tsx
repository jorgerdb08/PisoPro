"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  authService,
  type ProfileAvailability,
  type ClaimResult,
} from "@/services/authService";
import {
  getOrCreateDeviceId,
  getStoredSessionToken,
  storeSessionToken,
  clearStoredSessionToken,
  getDeviceFriendlyName,
} from "@/features/auth/device";
import { useHeartbeat } from "@/features/auth/useHeartbeat";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface CurrentUser {
  id: string;
  name: "Jorge" | "Samuel" | "David";
  role: "admin" | "member";
  avatar_url: string | null;
}

interface AuthContextType {
  currentUser: CurrentUser | null;
  sessionToken: string | null;
  deviceId: string;
  deviceName: string;
  profiles: ProfileAvailability[];
  isLoading: boolean;
  isClaiming: boolean;
  claimError: string | null;
  revokedNotification: string | null;
  selectProfile: (userId: string) => Promise<ClaimResult>;
  unlinkDevice: () => Promise<void>;
  logout: () => Promise<void>; // Alias for unlinkDevice
  forceReleaseUser: (userId: string) => Promise<boolean>;
  refreshProfiles: () => Promise<void>;
  clearRevokedNotification: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [deviceId] = useState<string>(() =>
    typeof window !== "undefined" ? getOrCreateDeviceId() : ""
  );
  const [deviceName] = useState<string>(() =>
    typeof window !== "undefined" ? getDeviceFriendlyName() : "Dispositivo desconocido"
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [revokedNotification, setRevokedNotification] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();
  const activeSessionRef = useRef<string | null>(null);
  const currentUserRef = useRef<CurrentUser | null>(null);

  useEffect(() => {
    activeSessionRef.current = sessionToken;
  }, [sessionToken]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const clearRevokedNotification = useCallback(() => {
    setRevokedNotification(null);
  }, []);

  const refreshProfiles = useCallback(async () => {
    const devId = deviceId || getOrCreateDeviceId();
    const list = await authService.getProfilesAvailability(devId);
    setProfiles(list);

    // If we have an active session, verify if our session is still active in the database
    if (activeSessionRef.current && currentUserRef.current) {
      const currentInList = list.find((p) => p.id === currentUserRef.current?.id);
      if (currentInList) {
        // If current device was revoked or released in backend, handle disconnect
        if (currentInList.status === "REVOKED" || !currentInList.is_current_device) {
          console.warn("[Auth] Current device session has been revoked or transferred");
          clearStoredSessionToken();
          setSessionToken(null);
          setCurrentUser(null);
          setRevokedNotification("Tu sesión ha sido desvinculada.");
        }
      }
    }
  }, [deviceId]);

  // Handle session expiration or revocation detected by heartbeat
  const handleSessionExpired = useCallback(
    (reason?: string) => {
      console.warn("[Auth] Session lease expired or revoked:", reason);
      clearStoredSessionToken();
      setSessionToken(null);
      setCurrentUser(null);
      if (reason === "REVOKED") {
        setRevokedNotification("Tu sesión ha sido desvinculada.");
      }
      void refreshProfiles();
    },
    [refreshProfiles]
  );

  // Heartbeat integration: sends periodic last_seen and checks session validity
  useHeartbeat({
    sessionToken,
    isActive: !!currentUser,
    onSessionExpired: handleSessionExpired,
  });

  // Initial initialization: authoritatively validate session with Supabase
  useEffect(() => {
    const devId = deviceId || getOrCreateDeviceId();
    const storedToken = getStoredSessionToken();

    async function init() {
      setIsLoading(true);
      try {
        // 1. Fetch real-time profile availability
        const list = await authService.getProfilesAvailability(devId);
        setProfiles(list);

        // 2. If a session token exists locally, validate it against Supabase backend authority
        if (storedToken) {
          const validation = await authService.validateSession(storedToken, devId);

          if (validation.valid && validation.user_id && validation.name && validation.role) {
            setSessionToken(storedToken);
            setCurrentUser({
              id: validation.user_id,
              name: validation.name,
              role: validation.role,
              avatar_url: validation.avatar_url ?? null,
            });
          } else {
            console.warn("[Auth] Stored session invalid or expired:", validation.reason);
            if (validation.is_revoked || validation.reason === "REVOKED") {
              setRevokedNotification("Tu sesión ha sido desvinculada.");
            }
            clearStoredSessionToken();
            setSessionToken(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.error("[Auth] Initialization error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    void init();
  }, [deviceId]);

  // Supabase Realtime Subscription: listen for changes in user_sessions & profiles
  useEffect(() => {
    const channel = supabase
      .channel("pisopro-sessions-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_sessions" },
        (payload) => {
          // If the payload corresponds to our active session and was revoked
          const newRow = payload.new as { session_token?: string; status?: string; is_active?: boolean } | null;
          if (
            newRow &&
            activeSessionRef.current &&
            newRow.session_token === activeSessionRef.current
          ) {
            if (newRow.status === "REVOKED" || newRow.is_active === false) {
              handleSessionExpired("REVOKED");
              return;
            }
          }
          void refreshProfiles();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void refreshProfiles();
        }
      )
      .subscribe();

    // Fallback passive refresh every 15s
    const timer = setInterval(() => {
      void refreshProfiles();
    }, 15000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [supabase, refreshProfiles, handleSessionExpired]);

  // Select profile action (Atomic Claim)
  const selectProfile = useCallback(
    async (userId: string): Promise<ClaimResult> => {
      setIsClaiming(true);
      setClaimError(null);
      setRevokedNotification(null);

      try {
        const devId = deviceId || getOrCreateDeviceId();
        const devName = getDeviceFriendlyName();
        const result = await authService.claimProfile(userId, devId, devName, 30);

        if (result.success && result.session_token) {
          storeSessionToken(result.session_token);
          setSessionToken(result.session_token);

          // Update profiles list
          const updatedList = await authService.getProfilesAvailability(devId);
          setProfiles(updatedList);
          const claimed = updatedList.find((p) => p.id === userId);

          if (claimed) {
            setCurrentUser({
              id: claimed.id,
              name: claimed.name,
              role: claimed.role,
              avatar_url: claimed.avatar_url,
            });
          }
        } else {
          setClaimError(result.error || "No se pudo vincular este perfil");
          void refreshProfiles();
        }

        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error inesperado";
        setClaimError(message);
        return { success: false, error: message };
      } finally {
        setIsClaiming(false);
      }
    },
    [deviceId, refreshProfiles]
  );

  // Explicit action: "Desvincular este dispositivo"
  const unlinkDevice = useCallback(async () => {
    if (sessionToken) {
      await authService.releaseProfile(sessionToken);
    }
    clearStoredSessionToken();
    setSessionToken(null);
    setCurrentUser(null);
    await refreshProfiles();
  }, [sessionToken, refreshProfiles]);

  // Admin Force Release / Revoke device
  const forceReleaseUser = useCallback(
    async (userId: string): Promise<boolean> => {
      const success = await authService.adminForceRelease(userId);
      if (success) {
        await refreshProfiles();
      }
      return success;
    },
    [refreshProfiles]
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        sessionToken,
        deviceId,
        deviceName,
        profiles,
        isLoading,
        isClaiming,
        claimError,
        revokedNotification,
        selectProfile,
        unlinkDevice,
        logout: unlinkDevice,
        forceReleaseUser,
        refreshProfiles,
        clearRevokedNotification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
