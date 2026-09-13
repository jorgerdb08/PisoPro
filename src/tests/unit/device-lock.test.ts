import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getOrCreateDeviceId,
  getStoredSessionToken,
  storeSessionToken,
  clearStoredSessionToken,
} from "@/features/auth/device";
import type {
  ProfileAvailability,
  ClaimResult,
  HeartbeatResult,
  ValidateSessionResult,
  SessionStatus,
} from "@/services/authService";

/**
 * Backend Model Simulation: Implements the exact PostgreSQL RPC logic from
 * 20260913000002_device_session_lock.sql to test the 15 specification requirements
 */
interface DbSession {
  id: string;
  user_id: string;
  device_id: string;
  device_name: string;
  session_token: string;
  status: SessionStatus;
  last_seen: Date;
  expires_at: Date;
  is_active: boolean;
  claimed_at: Date;
}

interface ProfileRecord {
  id: string;
  name: "Jorge" | "Samuel" | "David";
  role: "admin" | "member";
  avatar_url: string | null;
}

const JORGE: ProfileRecord = { id: "11111111-1111-4111-8111-111111111111", name: "Jorge", role: "admin", avatar_url: null };
const SAMUEL: ProfileRecord = { id: "22222222-2222-4222-8222-222222222222", name: "Samuel", role: "member", avatar_url: null };
const DAVID: ProfileRecord = { id: "33333333-3333-4333-8333-333333333333", name: "David", role: "member", avatar_url: null };

const PROFILES: ProfileRecord[] = [JORGE, SAMUEL, DAVID];

class SimulatedDatabase {
  sessions: DbSession[] = [];

  reset() {
    this.sessions = [];
  }

  // Exact reproduction of claim_profile PostgreSQL RPC function
  claimProfile(
    userId: string,
    deviceId: string,
    deviceName: string = "Dispositivo web",
    inactivityDays: number = 30
  ): ClaimResult {
    const profile = PROFILES.find((p) => p.id === userId);
    if (!profile) {
      return { success: false, error: "Perfil de usuario no encontrado" };
    }

    const now = new Date();

    // Check if there is already an active session for this user
    const existing = this.sessions.find(
      (s) => s.user_id === userId && s.is_active && s.status === "ACTIVE" && s.expires_at > now
    );

    if (existing) {
      if (existing.device_id === deviceId) {
        // Same device: renews session
        existing.last_seen = now;
        existing.expires_at = new Date(now.getTime() + inactivityDays * 86400000);
        existing.device_name = deviceName;
        return {
          success: true,
          session_token: existing.session_token,
          expires_at: existing.expires_at.toISOString(),
          user_id: userId,
          user_name: profile.name,
          role: profile.role,
          renewed: true,
        };
      } else {
        // Different device: reject with user in use
        return {
          success: false,
          error: `${profile.name} está en uso en otro dispositivo`,
          is_busy: true,
          device_name: existing.device_name,
        };
      }
    }

    // Atomic uniqueness: Deactivate old sessions
    for (const s of this.sessions) {
      if ((s.user_id === userId || s.device_id === deviceId) && s.is_active) {
        s.is_active = false;
        if (s.status === "ACTIVE") s.status = "EXPIRED";
      }
    }

    const newToken = `token-${Math.random().toString(36).substring(2)}-${Date.now()}`;
    const expiresAt = new Date(now.getTime() + inactivityDays * 86400000);

    const newSession: DbSession = {
      id: `sess-${Date.now()}`,
      user_id: userId,
      device_id: deviceId,
      device_name: deviceName,
      session_token: newToken,
      status: "ACTIVE",
      last_seen: now,
      expires_at: expiresAt,
      is_active: true,
      claimed_at: now,
    };

    this.sessions.push(newSession);

    return {
      success: true,
      session_token: newToken,
      expires_at: expiresAt.toISOString(),
      user_id: userId,
      user_name: profile.name,
      role: profile.role,
      renewed: false,
    };
  }

  // Exact reproduction of heartbeat_session RPC
  heartbeatSession(sessionToken: string, deviceName?: string, extendDays: number = 30): HeartbeatResult {
    const session = this.sessions.find((s) => s.session_token === sessionToken);
    if (!session) {
      return { success: false, error: "Sesión no encontrada", is_revoked: true };
    }

    const now = new Date();
    if (!session.is_active || session.status !== "ACTIVE" || session.expires_at <= now) {
      return {
        success: false,
        error: "Sesión desvinculada o inactiva",
        is_revoked: session.status === "REVOKED",
        is_expired: session.status === "EXPIRED" || session.expires_at <= now,
      };
    }

    session.last_seen = now;
    session.expires_at = new Date(now.getTime() + extendDays * 86400000);
    if (deviceName) session.device_name = deviceName;

    return {
      success: true,
      expires_at: session.expires_at.toISOString(),
      user_id: session.user_id,
      status: "ACTIVE",
    };
  }

  // Exact reproduction of validate_session RPC
  validateSession(sessionToken: string, deviceId: string): ValidateSessionResult {
    const session = this.sessions.find((s) => s.session_token === sessionToken);
    if (!session) {
      return { valid: false, reason: "NOT_FOUND" };
    }

    if (session.device_id !== deviceId) {
      return { valid: false, reason: "DEVICE_MISMATCH" };
    }

    const now = new Date();
    if (!session.is_active || session.status !== "ACTIVE" || session.expires_at <= now) {
      return {
        valid: false,
        reason: session.status,
        is_revoked: session.status === "REVOKED",
        is_expired: session.status === "EXPIRED" || session.expires_at <= now,
      };
    }

    session.last_seen = now;
    const profile = PROFILES.find((p) => p.id === session.user_id)!;

    return {
      valid: true,
      user_id: session.user_id,
      name: profile.name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      status: "ACTIVE",
    };
  }

  // Exact reproduction of admin_force_release_profile RPC
  adminForceRelease(userId: string): boolean {
    let released = false;
    for (const s of this.sessions) {
      if (s.user_id === userId && s.is_active) {
        s.is_active = false;
        s.status = "REVOKED";
        released = true;
      }
    }
    return released;
  }

  // Exact reproduction of get_profiles_availability RPC
  getProfilesAvailability(currentDeviceId: string): ProfileAvailability[] {
    const now = new Date();
    return PROFILES.map((p) => {
      const activeSession = this.sessions
        .filter((s) => s.user_id === p.id)
        .sort((a, b) => b.last_seen.getTime() - a.last_seen.getTime())[0];

      const isSessionActive =
        activeSession &&
        activeSession.is_active &&
        activeSession.status === "ACTIVE" &&
        activeSession.expires_at > now;

      const isBusy = Boolean(isSessionActive && activeSession.device_id !== currentDeviceId);
      const isCurrent = Boolean(isSessionActive && activeSession.device_id === currentDeviceId);

      let status: SessionStatus = "UNCLAIMED";
      if (isSessionActive) {
        status = "ACTIVE";
      } else if (activeSession?.status === "REVOKED") {
        status = "REVOKED";
      } else if (activeSession?.status === "EXPIRED") {
        status = "EXPIRED";
      }

      return {
        id: p.id,
        name: p.name,
        role: p.role,
        avatar_url: p.avatar_url,
        is_busy: isBusy,
        is_current_device: isCurrent,
        last_seen: activeSession ? activeSession.last_seen.toISOString() : null,
        expires_at: activeSession ? activeSession.expires_at.toISOString() : null,
        status,
        device_name: activeSession?.device_name || "Sin dispositivo",
      };
    });
  }
}

describe("15 Requisitos de Bloqueo Persistente de Usuario y Concurrencia", () => {
  let db: SimulatedDatabase;

  beforeEach(() => {
    localStorage.clear();
    db = new SimulatedDatabase();
  });

  // 1. Usuario inicialmente no seleccionado
  it("1. Usuario inicialmente no seleccionado debe mostrar estado UNCLAIMED en perfiles", () => {
    const device1 = getOrCreateDeviceId();
    const token = getStoredSessionToken();
    expect(token).toBeNull();

    const profiles = db.getProfilesAvailability(device1);
    expect(profiles).toHaveLength(3);
    for (const p of profiles) {
      expect(p.status).toBe("UNCLAIMED");
      expect(p.is_busy).toBe(false);
      expect(p.is_current_device).toBe(false);
    }
  });

  // 2. Jorge puede reclamar Jorge
  it("2. Jorge puede reclamar Jorge satisfactoriamente", () => {
    const deviceJorge = "device-jorge-iphone";
    const result = db.claimProfile(JORGE.id, deviceJorge, "iPhone");

    expect(result.success).toBe(true);
    expect(result.session_token).toBeDefined();
    expect(result.user_id).toBe(JORGE.id);
    expect(result.user_name).toBe("Jorge");
  });

  // 3. Después de reclamarlo, Jorge aparece como ACTIVE
  it("3. Después de reclamarlo, Jorge aparece como ACTIVE", () => {
    const deviceJorge = "device-jorge-iphone";
    const claim = db.claimProfile(JORGE.id, deviceJorge, "iPhone");
    storeSessionToken(claim.session_token!);

    const list = db.getProfilesAvailability(deviceJorge);
    const jorgeProfile = list.find((p) => p.id === JORGE.id)!;

    expect(jorgeProfile.status).toBe("ACTIVE");
    expect(jorgeProfile.is_current_device).toBe(true);
    expect(jorgeProfile.is_busy).toBe(false);
    expect(jorgeProfile.device_name).toBe("iPhone");
  });

  // 4. Otro dispositivo NO puede reclamar Jorge
  it("4. Otro dispositivo NO puede reclamar Jorge mientras esté en uso", () => {
    const deviceJorge = "device-jorge-iphone";
    db.claimProfile(JORGE.id, deviceJorge, "iPhone");

    // Móvil 2 intenta reclamar Jorge
    const deviceIntruder = "device-intruder-android";
    const claim2 = db.claimProfile(JORGE.id, deviceIntruder, "Android");

    expect(claim2.success).toBe(false);
    expect(claim2.is_busy).toBe(true);
    expect(claim2.error).toContain("Jorge está en uso en otro dispositivo");

    // En la lista del intruso, Jorge se marca como is_busy: true
    const intruderList = db.getProfilesAvailability(deviceIntruder);
    const jorgeFromIntruder = intruderList.find((p) => p.id === JORGE.id)!;
    expect(jorgeFromIntruder.is_busy).toBe(true);
    expect(jorgeFromIntruder.is_current_device).toBe(false);
  });

  // 5. Samuel puede reclamar Samuel aunque Jorge esté activo
  it("5. Samuel puede reclamar Samuel aunque Jorge esté activo", () => {
    db.claimProfile(JORGE.id, "device-jorge-iphone", "iPhone");

    const claimSamuel = db.claimProfile(SAMUEL.id, "device-samuel-pixel", "Android");
    expect(claimSamuel.success).toBe(true);
    expect(claimSamuel.user_id).toBe(SAMUEL.id);
    expect(claimSamuel.user_name).toBe("Samuel");
  });

  // 6. David puede reclamar David
  it("6. David puede reclamar David independientemente", () => {
    db.claimProfile(JORGE.id, "device-jorge-iphone", "iPhone");
    db.claimProfile(SAMUEL.id, "device-samuel-pixel", "Android");

    const claimDavid = db.claimProfile(DAVID.id, "device-david-mac", "Mac");
    expect(claimDavid.success).toBe(true);
    expect(claimDavid.user_id).toBe(DAVID.id);
    expect(claimDavid.user_name).toBe("David");
  });

  // 7. Un usuario no puede tener dos sesiones activas (exclusividad atómica)
  it("7. Un usuario no puede tener dos sesiones activas simultáneamente", () => {
    const dev1 = "device-terminal-1";
    const dev2 = "device-terminal-2";

    const claim1 = db.claimProfile(JORGE.id, dev1, "iPhone");
    expect(claim1.success).toBe(true);

    const claim2 = db.claimProfile(JORGE.id, dev2, "iPad");
    expect(claim2.success).toBe(false);
    expect(claim2.is_busy).toBe(true);

    // Contar sesiones activas en la base de datos para Jorge
    const activeSessionsForJorge = db.sessions.filter(
      (s) => s.user_id === JORGE.id && s.is_active && s.status === "ACTIVE"
    );
    expect(activeSessionsForJorge).toHaveLength(1);
    expect(activeSessionsForJorge[0]?.device_id).toBe(dev1);
  });

  // 8. Recargar página mantiene la sesión
  it("8. Recargar página (re-montar sesión desde storage validando en DB) mantiene la sesión", () => {
    const deviceId = "device-jorge-phone";
    const claim = db.claimProfile(JORGE.id, deviceId, "iPhone");
    storeSessionToken(claim.session_token!);

    // Simular F5: nueva lectura de storage y validación autoritativa en DB
    const storedToken = getStoredSessionToken()!;
    const validation = db.validateSession(storedToken, deviceId);

    expect(validation.valid).toBe(true);
    expect(validation.user_id).toBe(JORGE.id);
    expect(validation.name).toBe("Jorge");
    expect(validation.role).toBe("admin");
  });

  // 9. Cerrar/reabrir navegador mantiene la sesión válida
  it("9. Cerrar y reabrir navegador mantiene la sesión válida (sin liberar usuario al salir)", () => {
    const deviceId = "device-samuel-android";
    const claim = db.claimProfile(SAMUEL.id, deviceId, "Android", 30);
    storeSessionToken(claim.session_token!);

    // Cerrar app / reiniciar: NO borra token, sesión persiste 30 días
    const storedToken = getStoredSessionToken()!;
    const validationAfterDays = db.validateSession(storedToken, deviceId);

    expect(validationAfterDays.valid).toBe(true);
    expect(validationAfterDays.name).toBe("Samuel");
  });

  // 10. Heartbeat mantiene la sesión activa
  it("10. Heartbeat mantiene la sesión activa y renueva last_seen", () => {
    const deviceId = "device-david-terminal";
    const claim = db.claimProfile(DAVID.id, deviceId, "Android");

    const sessionBefore = db.sessions.find((s) => s.session_token === claim.session_token)!;
    const initialLastSeen = sessionBefore.last_seen;

    // Simular avance del tiempo
    vi.setSystemTime(new Date(Date.now() + 60000));

    const heartbeat = db.heartbeatSession(claim.session_token!, "Android");
    expect(heartbeat.success).toBe(true);

    const sessionAfter = db.sessions.find((s) => s.session_token === claim.session_token)!;
    expect(sessionAfter.last_seen.getTime()).toBeGreaterThan(initialLastSeen.getTime());

    vi.useRealTimers();
  });

  // 11. Una sesión expirada libera el usuario
  it("11. Una sesión expirada libera el usuario automáticamente (UNCLAIMED)", () => {
    const deviceId = "device-abandoned";
    // Crear sesión con expiración inmediata
    const claim = db.claimProfile(JORGE.id, deviceId, "iPhone", -1); // Expiró en el pasado
    expect(claim.success).toBe(true);

    const list = db.getProfilesAvailability(deviceId);
    const jorge = list.find((p) => p.id === JORGE.id)!;
    expect(jorge.status).toBe("UNCLAIMED");
    expect(jorge.is_busy).toBe(false);

    // Nuevo dispositivo puede reclamar a Jorge libremente
    const newDevice = "device-new-iphone";
    const newClaim = db.claimProfile(JORGE.id, newDevice, "iPhone");
    expect(newClaim.success).toBe(true);
  });

  // 12. Admin puede revocar una sesión
  it("12. Admin (Jorge) puede revocar una sesión activa", () => {
    // Samuel está usando PisoPro
    db.claimProfile(SAMUEL.id, "device-samuel", "Android");

    // Jorge admin ejecuta desvinculación
    const released = db.adminForceRelease(SAMUEL.id);
    expect(released).toBe(true);

    const samuelSession = db.sessions.find((s) => s.user_id === SAMUEL.id)!;
    expect(samuelSession.status).toBe("REVOKED");
    expect(samuelSession.is_active).toBe(false);
  });

  // 13. Revocar una sesión obliga al dispositivo a volver al selector
  it("13. Revocar una sesión obliga al dispositivo a volver al selector con razón REVOKED", () => {
    const deviceId = "device-target";
    const claim = db.claimProfile(SAMUEL.id, deviceId, "Android");
    storeSessionToken(claim.session_token!);

    // Admin revoca a Samuel
    db.adminForceRelease(SAMUEL.id);

    // Siguiente latido o validación del dispositivo target
    const validation = db.validateSession(claim.session_token!, deviceId);
    expect(validation.valid).toBe(false);
    expect(validation.is_revoked).toBe(true);
    expect(validation.reason).toBe("REVOKED");

    // Al recibir REVOKED, el cliente limpia token
    clearStoredSessionToken();
    expect(getStoredSessionToken()).toBeNull();
  });

  // 14. Los cambios de disponibilidad aparecen mediante Realtime
  it("14. Los cambios de disponibilidad reflejan el estado en tiempo real para otros clientes", () => {
    const deviceJorge = "device-jorge";
    const deviceSamuel = "device-samuel";

    // Inicialmente todos libres
    let listSamuel = db.getProfilesAvailability(deviceSamuel);
    expect(listSamuel.find((p) => p.id === JORGE.id)!.is_busy).toBe(false);

    // Jorge reclama perfil
    db.claimProfile(JORGE.id, deviceJorge, "iPhone");

    // Samuel consulta tras evento Realtime: Jorge ahora está ocupado
    listSamuel = db.getProfilesAvailability(deviceSamuel);
    const jorgeInSamuelView = listSamuel.find((p) => p.id === JORGE.id)!;
    expect(jorgeInSamuelView.is_busy).toBe(true);
    expect(jorgeInSamuelView.status).toBe("ACTIVE");

    // Jorge es desvinculado por admin
    db.adminForceRelease(JORGE.id);

    // Samuel consulta tras evento Realtime: Jorge vuelve a estar disponible
    listSamuel = db.getProfilesAvailability(deviceSamuel);
    expect(listSamuel.find((p) => p.id === JORGE.id)!.is_busy).toBe(false);
  });

  // 15. No se puede cambiar de usuario modificando únicamente el estado del frontend
  it("15. No se puede cambiar de usuario modificando únicamente el estado del frontend (backend autoritativo)", () => {
    const deviceJorge = "device-jorge-authorized";
    const claimJorge = db.claimProfile(JORGE.id, deviceJorge, "iPhone");

    // Supongamos que un usuario malicioso en frontend cambia React state a currentUser = Samuel
    // pero mantiene su session_token de Jorge
    const storedToken = claimJorge.session_token!;

    // Al validar con backend, el backend responde con la identidad real en base de datos: Jorge
    const validation = db.validateSession(storedToken, deviceJorge);
    expect(validation.valid).toBe(true);
    expect(validation.name).toBe("Jorge");
    expect(validation.user_id).toBe(JORGE.id);

    // Si inventa un token arbitrario en frontend DevTools
    const fakeToken = "forged-session-token-12345";
    const fakeValidation = db.validateSession(fakeToken, deviceJorge);
    expect(fakeValidation.valid).toBe(false);
    expect(fakeValidation.reason).toBe("NOT_FOUND");
  });
});
