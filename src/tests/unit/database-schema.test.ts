import { describe, it, expect } from "vitest";
import {
  INITIAL_HOUSEHOLD_ID,
  PRECONFIGURED_PROFILES,
  DEFAULT_LEASE_DURATION_SECONDS,
  HEARTBEAT_INTERVAL_MS,
} from "@/database";
import { preconfiguredUserSchema } from "@/validations/common";

describe("Database Schema & Seed Configuration", () => {
  it("should define exactly 3 preconfigured profiles", () => {
    expect(PRECONFIGURED_PROFILES).toHaveLength(3);
  });

  it("should configure Jorge as admin and Samuel & David as members", () => {
    const jorge = PRECONFIGURED_PROFILES.find((p) => p.name === "Jorge");
    const samuel = PRECONFIGURED_PROFILES.find((p) => p.name === "Samuel");
    const david = PRECONFIGURED_PROFILES.find((p) => p.name === "David");

    expect(jorge).toBeDefined();
    expect(jorge?.role).toBe("admin");

    expect(samuel).toBeDefined();
    expect(samuel?.role).toBe("member");

    expect(david).toBeDefined();
    expect(david?.role).toBe("member");
  });

  it("all preconfigured profiles should validate against preconfiguredUserSchema", () => {
    for (const profile of PRECONFIGURED_PROFILES) {
      const parsed = preconfiguredUserSchema.safeParse(profile);
      expect(parsed.success).toBe(true);
    }
  });

  it("should have a valid initial household UUID", () => {
    expect(INITIAL_HOUSEHOLD_ID).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("heartbeat interval should be well under the lease duration to prevent unintended expiration", () => {
    const leaseMs = DEFAULT_LEASE_DURATION_SECONDS * 1000;
    expect(HEARTBEAT_INTERVAL_MS).toBeLessThan(leaseMs / 2);
  });
});
