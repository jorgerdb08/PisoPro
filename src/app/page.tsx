"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthContext";
import { useChores } from "@/features/chores/useChores";
import { useExpenses } from "@/features/expenses/useExpenses";
import { ProfileSelectorModal } from "@/features/auth/components/ProfileSelectorModal";
import { AdminModal } from "@/features/admin/components/AdminModal";
import {
  CheckCircle2,
  Wallet,
  CheckSquare,
  ShoppingCart,
  MessageSquare,
  Sparkles,
  Loader2,
  ArrowRight,
  PartyPopper,
} from "lucide-react";

export default function HomePage() {
  const { currentUser, isLoading, logout } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { myPendingTasks, pendingTasks, toggleTask, actionLoading } = useChores();
  const { userSummary } = useExpenses();

  const currentTask = myPendingTasks[0];

  // 1. Loading state while checking session and device lease
  if (isLoading) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center space-y-3 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Cargando PisoPro...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated state: display "¿Quién eres?" profile selector screen
  if (!currentUser) {
    return <ProfileSelectorModal />;
  }

  // 3. Authenticated state: personalized flat dashboard for the current user
  return (
    <div className="flex min-h-screen flex-col pb-24">
      <TopHeader
        title="PisoPro"
        subtitle="Nuestro piso"
        userName={currentUser.name}
        userRole={currentUser.role}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onLogout={logout}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      <main className="flex-1 space-y-4 px-4 py-5">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-foreground text-xl font-extrabold tracking-tight">
              Hola, {currentUser.name} 👋
            </h2>
            <p className="text-muted-foreground text-xs">
              {currentUser.role === "admin"
                ? "Administrador del piso"
                : "Compañero de piso"}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="gap-1 border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-400"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            En línea
          </Badge>
        </div>

        {/* Hoy te toca Banner */}
        {currentTask ? (
          <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between text-xs font-medium text-emerald-100">
                <span className="text-[10px] font-bold tracking-wider uppercase">
                  Hoy te toca
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                  +{currentTask.points} {currentTask.points === 1 ? "pt" : "pts"}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">{currentTask.title}</h3>
                <p className="text-xs text-emerald-100/90">
                  {currentTask.description || "Tarea asignada a ti esta semana"}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-emerald-200">
                  {myPendingTasks.length > 1
                    ? `Tienes ${myPendingTasks.length} tareas pendientes`
                    : "Asignada a ti esta semana"}
                </span>
                <Button
                  data-testid="home-chore-done-btn"
                  size="sm"
                  disabled={actionLoading === currentTask.id}
                  onClick={() => toggleTask(currentTask.id)}
                  className="h-8 rounded-lg bg-white px-3 text-xs font-semibold text-emerald-700 shadow-sm hover:bg-white/90 active:scale-95 transition-transform"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                  {actionLoading === currentTask.id ? "Guardando..." : "Hecho"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-background text-foreground shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <PartyPopper className="h-3 w-3" />
                  ¡Todo al día!
                </span>
                <h3 className="text-sm font-bold">No tienes tareas pendientes</h3>
                <p className="text-muted-foreground text-xs">
                  Has completado tus tareas de esta semana. ¡Buen trabajo!
                </p>
              </div>
              <Link
                href="/tareas"
                className="rounded-xl border border-border/80 bg-secondary/80 px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition-colors"
              >
                Ver todas
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Balances Summary Card */}
        <Link href="/gastos">
          <Card data-testid="home-balance-card" className="cursor-pointer transition-colors hover:border-emerald-500/40">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Balance Compartido</span>
                </span>
                <span className="flex cursor-pointer items-center text-xs font-semibold text-emerald-600 hover:underline">
                  Detalles <ArrowRight className="ml-0.5 h-3 w-3" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-border/80 bg-secondary/50 rounded-xl border p-3">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Debes
                  </span>
                  <p className="text-foreground text-base font-bold">
                    {userSummary.totalOwedByMe.toFixed(2).replace(".", ",")} €
                  </p>
                </div>
                <div className="border-border/80 bg-secondary/50 rounded-xl border p-3">
                  <span className="text-muted-foreground text-[11px] font-medium">
                    Te deben
                  </span>
                  <p className="text-base font-bold text-emerald-600">
                    {userSummary.totalOwedToMe.toFixed(2).replace(".", ",")} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Grid: Tareas & Compra */}
        <div className="grid grid-cols-2 gap-3">
          {/* Tareas Card */}
          <Link href="/tareas">
            <Card
              data-testid="home-tasks-card"
              className="cursor-pointer transition-colors hover:border-emerald-500/40 h-full"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                    Tareas
                  </h4>
                  <p className="text-foreground mt-0.5 text-sm font-extrabold">
                    {pendingTasks.length} pendientes
                  </p>
                </div>
                <p className="text-muted-foreground text-[11px]">Rotación semanal</p>
              </CardContent>
            </Card>
          </Link>

          {/* Compra Card */}
          <Card className="cursor-pointer transition-colors hover:border-emerald-500/40">
            <CardContent className="space-y-2 p-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                  Compra
                </h4>
                <p className="text-foreground mt-0.5 text-sm font-extrabold">
                  3 productos
                </p>
              </div>
              <p className="text-muted-foreground text-[11px]">Leche, café, papel...</p>
            </CardContent>
          </Card>
        </div>

        {/* Chat del Piso Preview */}
        <Card className="cursor-pointer transition-colors hover:border-emerald-500/40">
          <CardContent className="space-y-2.5 p-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Chat del Piso</span>
              </span>
              <span className="text-muted-foreground text-[11px]">Hoy</span>
            </div>
            <div className="border-border/80 bg-secondary/30 space-y-1 rounded-xl border p-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-xs font-semibold">Jorge</span>
                <span className="text-muted-foreground text-[10px]">Bienvenida</span>
              </div>
              <p className="text-muted-foreground line-clamp-2 text-xs">
                ¡Bienvenidos a PisoPro! Aquí organizaremos las tareas, los gastos y las
                compras del piso.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active Session Lease Info */}
        <div className="border-border/60 bg-muted/30 rounded-xl border p-3 text-center">
          <div className="text-muted-foreground flex items-center justify-center gap-1.5 text-[11px] font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Perfil bloqueado para este dispositivo · Heartbeat activo</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
