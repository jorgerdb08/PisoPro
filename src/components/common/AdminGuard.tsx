"use client";

import React from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { isAdmin, type UserLike } from "@/features/auth/permissions";

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  user?: UserLike | null;
}

/**
 * Componente que renderiza a sus hijos únicamente si el usuario tiene rol de Administrador.
 * Si no se proporciona un `user` explícito por props, comprueba el `currentUser` del AuthContext.
 */
export function AdminGuard({ children, fallback = null, user }: AdminGuardProps) {
  const { currentUser } = useAuth();
  const targetUser = user !== undefined ? user : currentUser;

  if (!isAdmin(targetUser)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
