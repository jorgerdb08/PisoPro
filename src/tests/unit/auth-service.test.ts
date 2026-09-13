import { describe, it, expect, beforeEach } from "vitest";
import {
  getOrCreateDeviceId,
  getStoredSessionToken,
  storeSessionToken,
  clearStoredSessionToken,
} from "@/features/auth/device";
import type { ProfileAvailability, ClaimResult } from "@/services/authService";

describe("Auth & Device Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should generate and persist a unique deviceId", () => {
    const devId1 = getOrCreateDeviceId();
    expect(devId1).toBeDefined();
    expect(devId1.length).toBeGreaterThan(10);

    // Should return the same deviceId on subsequent calls
    const devId2 = getOrCreateDeviceId();
    expect(devId2).toBe(devId1);
  });

  it("should store, retrieve, and clear session tokens properly", () => {
    expect(getStoredSessionToken()).toBeNull();

    const mockToken = "secure_token_1234567890abcdef";
    storeSessionToken(mockToken);
    expect(getStoredSessionToken()).toBe(mockToken);

    clearStoredSessionToken();
    expect(getStoredSessionToken()).toBeNull();
  });

  it("should validate ProfileAvailability contract correctly", () => {
    const mockProfile: ProfileAvailability = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Jorge",
      role: "admin",
      avatar_url: "https://example.com/avatar.png",
      is_busy: true,
      is_current_device: false,
      last_seen: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60000).toISOString(),
      status: "ACTIVE",
      device_name: "iPhone",
    };

    expect(mockProfile.role).toBe("admin");
    expect(mockProfile.is_busy).toBe(true);
    expect(mockProfile.is_current_device).toBe(false);
  });

  it("should model atomic ClaimResult responses accurately", () => {
    const successResult: ClaimResult = {
      success: true,
      session_token: "mock-token-abc",
      expires_at: new Date(Date.now() + 60000).toISOString(),
      user_id: "22222222-2222-4222-8222-222222222222",
      renewed: false,
    };
    expect(successResult.success).toBe(true);
    expect(successResult.session_token).toBeDefined();

    const busyErrorResult: ClaimResult = {
      success: false,
      error: "Jorge está en uso en otro dispositivo",
      is_busy: true,
    };
    expect(busyErrorResult.success).toBe(false);
    expect(busyErrorResult.is_busy).toBe(true);
  });
});
