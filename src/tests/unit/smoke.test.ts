import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { preconfiguredUserSchema } from "@/validations/common";

describe("Smoke & Setup Verification", () => {
  it("should merge tailwind classes properly with cn()", () => {
    const result = cn("p-4 text-red-500", "p-6", { "bg-blue-500": true });
    expect(result).toContain("p-6");
    expect(result).not.toContain("p-4");
    expect(result).toContain("bg-blue-500");
  });

  it("should validate preconfigured user schema correctly", () => {
    const validJorge = {
      name: "Jorge",
      role: "admin",
    };
    const parsed = preconfiguredUserSchema.safeParse(validJorge);
    expect(parsed.success).toBe(true);

    const invalidUser = {
      name: "Unknown",
      role: "guest",
    };
    const invalidParsed = preconfiguredUserSchema.safeParse(invalidUser);
    expect(invalidParsed.success).toBe(false);
  });
});
