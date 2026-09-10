import { UserRole } from "@/types";

export type Permission =
  | "manage_house"
  | "force_release_sessions"
  | "manage_members"
  | "reassign_chores"
  | "delete_chores"
  | "edit_chores"
  | "complete_chore"
  | "create_expense"
  | "delete_any_expense"
  | "manage_shopping"
  | "send_chat";

export type UserLike = {
  role?: UserRole;
};

const ROLE_PERMISSIONS: Record<UserRole, ReadonlySet<Permission>> = {
  admin: new Set<Permission>([
    "manage_house",
    "force_release_sessions",
    "manage_members",
    "reassign_chores",
    "delete_chores",
    "edit_chores",
    "complete_chore",
    "create_expense",
    "delete_any_expense",
    "manage_shopping",
    "send_chat",
  ]),
  member: new Set<Permission>([
    "complete_chore",
    "create_expense",
    "manage_shopping",
    "send_chat",
  ]),
};

/**
 * Comprueba si un rol específico tiene un permiso determinado
 */
export function hasPermission(role: UserRole | undefined | null, permission: Permission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Comprueba si un usuario es Administrador (Jorge)
 */
export function isAdmin(user: UserLike | undefined | null): boolean {
  return user?.role === "admin";
}

/**
 * Comprueba si un usuario puede forzar la liberación de sesiones bloqueadas
 */
export function canForceRelease(user: UserLike | undefined | null): boolean {
  return hasPermission(user?.role, "force_release_sessions");
}

/**
 * Comprueba si un usuario puede gestionar la configuración del piso
 */
export function canManageHouse(user: UserLike | undefined | null): boolean {
  return hasPermission(user?.role, "manage_house");
}

/**
 * Comprueba si un usuario puede reasignar tareas a otros compañeros
 */
export function canReassignChores(user: UserLike | undefined | null): boolean {
  return hasPermission(user?.role, "reassign_chores");
}

/**
 * Comprueba si un usuario puede editar o crear tareas
 */
export function canEditChores(user: UserLike | undefined | null): boolean {
  return hasPermission(user?.role, "edit_chores");
}
