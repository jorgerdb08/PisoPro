import { z } from "zod";

export const uuidSchema = z.string().uuid({ message: "ID no válido" });

export const userRoleSchema = z.enum(["admin", "member"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const preconfiguredUserSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.enum(["Jorge", "Samuel", "David"]),
  role: userRoleSchema,
  avatarUrl: z.string().url().optional(),
});
export type PreconfiguredUser = z.infer<typeof preconfiguredUserSchema>;
