"use client";

import React, { useState } from "react";
import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuth } from "@/features/auth/AuthContext";
import { ProfileSelectorModal } from "@/features/auth/components/ProfileSelectorModal";
import { AdminModal } from "@/features/admin/components/AdminModal";
import { ShoppingView } from "@/features/shopping/components/ShoppingView";
import { Loader2 } from "lucide-react";

export default function CompraPage() {
  const { currentUser, isLoading, logout } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center space-y-3 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Cargando Compra...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return <ProfileSelectorModal />;
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <TopHeader
        title="Compra"
        subtitle="Lista compartida"
        userName={currentUser.name}
        userRole={currentUser.role}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onLogout={logout}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <main className="flex-1 px-4 py-4">
        <ShoppingView />
      </main>

      <BottomNav />
    </div>
  );
}
