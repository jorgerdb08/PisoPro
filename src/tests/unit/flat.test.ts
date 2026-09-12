import { describe, it, expect, vi, beforeEach } from "vitest";
import { flatService } from "@/services/flatService";
import { FLAT_INFO } from "@/lib/constants";

// Mock Supabase Browser Client
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

describe("Flat Management Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns predefined flat rules correctly", () => {
    const rules = flatService.getRules();
    expect(rules).toHaveLength(5);
    expect(rules[0]?.title).toBe("Horario de Silencio");
    expect(rules.map((r) => r.category)).toContain("limpieza");
    expect(rules.map((r) => r.category)).toContain("convivencia");
  });

  it("returns emergency and assistance contacts with valid phone numbers", () => {
    const contacts = flatService.getEmergencyContacts();
    expect(contacts.length).toBeGreaterThanOrEqual(4);

    const urgent = contacts.filter((c) => c.isUrgent);
    expect(urgent).toHaveLength(1);
    expect(urgent[0]?.phone).toBe("112");

    contacts.forEach((c) => {
      expect(c.phone).toBeTruthy();
      expect(c.name).toBeTruthy();
    });
  });

  it("returns flat details with valid WiFi credentials and 3 rooms", () => {
    const details = flatService.getFlatDetails();
    expect(details.name).toBe("Nuestro piso");
    expect(details.wifiSsid).toBe("PisoPro_5G_Fibra");
    expect(details.wifiPass).toBe("PisoPro2026!WiFi");
    expect(details.rooms).toHaveLength(3);

    const occupants = details.rooms.map((r) => r.occupantName);
    expect(occupants).toContain("Jorge");
    expect(occupants).toContain("Samuel");
    expect(occupants).toContain("David");
  });

  it("calculates leaderboard scores and ranks flatmates descending by points", async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { completed_by: "22222222-2222-4222-8222-222222222222", points_awarded: 10 },
            { completed_by: "22222222-2222-4222-8222-222222222222", points_awarded: 5 },
            { completed_by: "33333333-3333-4333-8333-333333333333", points_awarded: 20 },
            { completed_by: "44444444-4444-4444-8444-444444444444", points_awarded: 5 },
          ],
          error: null,
        }),
      }),
    } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

    const leaderboard = await flatService.getLeaderboard();
    expect(leaderboard).toHaveLength(3);

    // Samuel has 20 points -> 1st place
    expect(leaderboard[0]?.name).toBe("Samuel");
    expect(leaderboard[0]?.points).toBe(20);
    expect(leaderboard[0]?.completedTasks).toBe(1);

    // Jorge has 15 points -> 2nd place
    expect(leaderboard[1]?.name).toBe("Jorge");
    expect(leaderboard[1]?.points).toBe(15);
    expect(leaderboard[1]?.completedTasks).toBe(2);

    // David has 5 points -> 3rd place
    expect(leaderboard[2]?.name).toBe("David");
    expect(leaderboard[2]?.points).toBe(5);
  });

  it("gracefully falls back to default household on query error", async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Error fetching household" },
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

    const household = await flatService.getHousehold("h1");
    expect(household).toBeTruthy();
    expect(household?.name).toBe(FLAT_INFO.name);
  });
});
