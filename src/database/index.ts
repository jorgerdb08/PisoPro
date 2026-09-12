/**
 * Capa de Base de Datos de PisoPro
 * Constantes y referencias al esquema relacional de Supabase.
 */

export const DATABASE_VERSION = "0.2.0";

export const INITIAL_HOUSEHOLD_ID = "11111111-1111-4111-8111-111111111111";

export const PRECONFIGURED_PROFILES = [
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Jorge" as const,
    role: "admin" as const,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Jorge",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Samuel" as const,
    role: "member" as const,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=Samuel",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "David" as const,
    role: "member" as const,
    avatarUrl: "https://api.dicebear.com/7.x/bottts/svg?seed=David",
  },
] as const;

export const DEFAULT_LEASE_DURATION_SECONDS = 60;
export const HEARTBEAT_INTERVAL_MS = 25000;
