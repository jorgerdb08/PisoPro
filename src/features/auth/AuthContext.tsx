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
  profiles: ProfileAvailability[];
  isLoading: boolean;
  isClaiming: boolean;
  claimError: string | null;
  selectProfile: (userId: string) => Promise<ClaimResult>;
  logout: () => Promise<void>;
  forceReleaseUser: (userId: string) => Promise<boolean>;
  refreshProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [deviceId] = useState<string>(() =>
    typeof window !== "undefined" ? getOrCreateDeviceId() : ""
  );
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileAvailability[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();
  const activeSessionRef = useRef<string | null>(null);

  useEffect(() => {
    activeSessionRef.current = sessionToken;
  }, [sessionToken]);

  const refreshProfiles = useCallback(async () => {
    const devId = deviceId || getOrCreateDeviceId();
    const list = await authService.getProfilesAvailability(devId);
    setProfiles(list);

    // If we have an active session, verify if the current device is still valid
    if (activeSessionRef.current) {
      const currentInList = list.find((p) => p.is_current_device);
      if (currentInList) {
        setCurrentUser({
          id: currentInList.id,
          name: currentInList.name,
          role: currentInList.role,
          avatar_url: currentInList.avatar_url,
        });
      }
    }
  }, [deviceId]);

  // Handle session expiration detected by heartbeat or server
  const handleSessionExpired = useCallback(() => {
    console.warn("[Auth] Session lease expired or released elsewhere");
    clearStoredSessionToken();
    setSessionToken(null);
    setCurrentUser(null);
    void refreshProfiles();
  }, [refreshProfiles]);

  // Heartbeat integration
  useHeartbeat({
    sessionToken,
    isActive: !!currentUser,
    onSessionExpired: handleSessionExpired,
  });

  // Initial initialization: check stored session, fetch profiles
  useEffect(() => {
    const devId = deviceId || getOrCreateDeviceId();
    const storedToken = getStoredSessionToken();

    async function init() {
      setIsLoading(true);
      try {
        const list = await authService.getProfilesAvailability(devId);
        setProfiles(list);

        if (storedToken) {
          // Check if this device already holds an active valid session in the database
          const activeDeviceProfile = list.find((p) => p.is_current_device);
          if (activeDeviceProfile) {
            setSessionToken(storedToken);
            setCurrentUser({
              id: activeDeviceProfile.id,
              name: activeDeviceProfile.name,
              role: activeDeviceProfile.role,
              avatar_url: activeDeviceProfile.avatar_url,
            });
          } else {
            // Expired or released by admin
            clearStoredSessionToken();
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
        () => {
          void refreshProfiles();
        }
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void refreshProfiles();
      })
      .subscribe();

    // Fallback passive refresh every 15s to detect leases that expired passively
    const timer = setInterval(() => {
      void refreshProfiles();
    }, 15000);

    return () => {
      void supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [supabase, refreshProfiles]);

  // Select profile action (Atomic Claim)
  const selectProfile = useCallback(
    async (userId: string): Promise<ClaimResult> => {
      setIsClaiming(true);
      setClaimError(null);

      try {
        const devId = deviceId || getOrCreateDeviceId();
        const result = await authService.claimProfile(userId, devId, 60);

        if (result.success && result.session_token) {
          storeSessionToken(result.session_token);
          setSessionToken(result.session_token);

          // Update current user
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
          setClaimError(result.error || "No se pudo seleccionar el perfil");
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

  // Logout / Release Profile
  const logout = useCallback(async () => {
    if (sessionToken) {
      await authService.releaseProfile(sessionToken);
    }
    clearStoredSessionToken();
    setSessionToken(null);
    setCurrentUser(null);
    await refreshProfiles();
  }, [sessionToken, refreshProfiles]);

  // Admin Force Release
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
        profiles,
        isLoading,
        isClaiming,
        claimError,
        selectProfile,
        logout,
        forceReleaseUser,
        refreshProfiles,
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
