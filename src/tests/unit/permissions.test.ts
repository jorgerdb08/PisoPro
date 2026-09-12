import { describe, it, expect } from "vitest";
import {
  isAdmin,
  canForceRelease,
  canManageHouse,
  canReassignChores,
  canEditChores,
  hasPermission,
  type Permission,
} from "@/features/auth/permissions";

describe("Permissions & RBAC System", () => {
  const adminUser = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Jorge" as const,
    role: "admin" as const,
  };

  const memberUser = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Samuel" as const,
    role: "member" as const,
  };

  describe("isAdmin helper", () => {
    it("identifies admin correctly", () => {
      expect(isAdmin(adminUser)).toBe(true);
    });

    it("identifies member as non-admin", () => {
      expect(isAdmin(memberUser)).toBe(false);
    });

    it("handles null or undefined user safely", () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });
  });

  describe("Specific capability helpers", () => {
    it("allows admin to force release sessions and rejects member", () => {
      expect(canForceRelease(adminUser)).toBe(true);
      expect(canForceRelease(memberUser)).toBe(false);
      expect(canForceRelease(null)).toBe(false);
    });

    it("allows admin to manage house and rejects member", () => {
      expect(canManageHouse(adminUser)).toBe(true);
      expect(canManageHouse(memberUser)).toBe(false);
    });

    it("allows admin to reassign chores and rejects member", () => {
      expect(canReassignChores(adminUser)).toBe(true);
      expect(canReassignChores(memberUser)).toBe(false);
    });

    it("allows admin to edit chores and rejects member", () => {
      expect(canEditChores(adminUser)).toBe(true);
      expect(canEditChores(memberUser)).toBe(false);
    });
  });

  describe("Full Permission Matrix", () => {
    const adminOnlyPermissions: Permission[] = [
      "manage_house",
      "force_release_sessions",
      "manage_members",
      "reassign_chores",
      "delete_chores",
      "edit_chores",
      "delete_any_expense",
    ];

    const sharedPermissions: Permission[] = [
      "complete_chore",
      "create_expense",
      "manage_shopping",
      "send_chat",
    ];

    it("grants all permissions to admin role", () => {
      [...adminOnlyPermissions, ...sharedPermissions].forEach((perm) => {
        expect(hasPermission("admin", perm)).toBe(true);
      });
    });

    it("grants shared permissions to member role", () => {
      sharedPermissions.forEach((perm) => {
        expect(hasPermission("member", perm)).toBe(true);
      });
    });

    it("strictly forbids administrative permissions to member role", () => {
      adminOnlyPermissions.forEach((perm) => {
        expect(hasPermission("member", perm)).toBe(false);
      });
    });

    it("returns false for undefined or null roles", () => {
      expect(hasPermission(undefined, "complete_chore")).toBe(false);
      expect(hasPermission(null, "send_chat")).toBe(false);
    });
  });
});
