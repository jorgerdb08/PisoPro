/**
 * Utilidades para la identificación y persistencia del dispositivo en PisoPro
 */

const DEVICE_ID_KEY = "pisopro_device_id";
const SESSION_TOKEN_KEY = "pisopro_session_token";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") {
    return "ssr-device-placeholder";
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch {
    // Fallback if localStorage is restricted
    return "session-temp-device-" + Math.random().toString(36).substring(2, 12);
  }
}

export function getStoredSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function storeSessionToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  } catch {
    // Ignore error
  }
}

export function clearStoredSessionToken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {
    // Ignore error
  }
}
