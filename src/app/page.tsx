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
import { useShopping } from "@/features/shopping/useShopping";
import { useChat } from "@/features/chat/useChat";
import { FLATMATES } from "@/lib/constants";
import { ProfileSelectorModal } from "@/features/auth/components/ProfileSelectorModal";
import { AdminModal } from "@/features/admin/components/AdminModal";
import {
  CheckCircle2,
  Wallet,
  CheckSquare,
  ShoppingCart,
  MessageSquare,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  const { currentUser, isLoading, logout } = useAuth();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const { myPendingTasks, pendingTasks, toggleTask, actionLoading } = useChores();
  const { userSummary } = useExpenses();
  const { pendingItems } = useShopping();
  const { lastMessage } = useChat();

  const lastSender = lastMessage ? FLATMATES.find((f) => f.id === lastMessage.user_id) : null;
  const lastSenderName = lastSender?.name || (lastMessage ? "Compañero" : "PisoPro");

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
          <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-xs">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  Hoy te toca
                </span>
                <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                  +{currentTask.points} {currentTask.points === 1 ? "pt" : "pts"}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{currentTask.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentTask.description || "Tarea asignada a ti esta semana"}
                </p>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <span className="text-[11px] text-slate-500">
                  {myPendingTasks.length > 1
                    ? `Tienes ${myPendingTasks.length} tareas pendientes`
                    : "Asignada a ti esta semana"}
                </span>
                <Button
                  data-testid="home-chore-done-btn"
                  size="sm"
                  disabled={actionLoading === currentTask.id}
                  onClick={() => toggleTask(currentTask.id)}
                  className="h-8 rounded-lg bg-slate-900 text-white px-3 text-xs font-medium shadow-xs hover:bg-slate-800 active:scale-95 transition"
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-white" />
                  {actionLoading === currentTask.id ? "Guardando..." : "Hecho"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden border-slate-200 bg-white text-slate-900 shadow-xs">
            <CardContent className="flex items-center justify-between p-4">
              <div className="space-y-0.5">
                <span className="text-slate-500 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  ¡Todo al día!
                </span>
                <h3 className="text-sm font-semibold text-slate-900">No tienes tareas pendientes</h3>
                <p className="text-slate-500 text-xs">
                  Has completado tus tareas de esta semana.
                </p>
              </div>
              <Link
                href="/tareas"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                Ver todas
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Balances Summary Card */}
        <Link href="/gastos">
          <Card data-testid="home-balance-card" className="cursor-pointer border-slate-200 bg-white shadow-xs hover:border-slate-300 transition">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Balance Compartido</span>
                </span>
                <span className="flex items-center text-xs font-medium text-slate-600 hover:text-slate-900">
                  Detalles <ArrowRight className="ml-0.5 h-3 w-3" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-slate-100 bg-slate-50 rounded-xl border p-3">
                  <span className="text-slate-500 text-[11px] font-medium">
                    Debes
                  </span>
                  <p className="text-slate-900 text-base font-semibold">
                    {userSummary.totalOwedByMe.toFixed(2).replace(".", ",")} €
                  </p>
                </div>
                <div className="border-slate-100 bg-slate-50 rounded-xl border p-3">
                  <span className="text-slate-500 text-[11px] font-medium">
                    Te deben
                  </span>
                  <p className="text-base font-semibold text-emerald-700">
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
              className="cursor-pointer border-slate-200 bg-white shadow-xs hover:border-slate-300 transition h-full"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-slate-500 text-xs font-bold tracking-wider uppercase">
                    Tareas
                  </h4>
                  <p className="text-slate-900 mt-0.5 text-sm font-bold">
                    {pendingTasks.length} pendientes
                  </p>
                </div>
                <p className="text-slate-500 text-[11px]">Rotación semanal</p>
              </CardContent>
            </Card>
          </Link>

          {/* Compra Card */}
          <Link href="/compra" className="h-full">
            <Card
              data-testid="home-shopping-card"
              className="cursor-pointer border-slate-200 bg-white shadow-xs hover:border-slate-300 transition h-full"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-slate-500 text-xs font-bold tracking-wider uppercase">
                    Compra
                  </h4>
                  <p className="text-slate-900 mt-0.5 text-sm font-bold">
                    {pendingItems.length}{" "}
                    {pendingItems.length === 1 ? "producto" : "productos"}
                  </p>
                </div>
                <p className="text-slate-500 text-[11px] truncate">
                  {pendingItems.length > 0
                    ? pendingItems
                        .slice(0, 3)
                        .map((i) => i.name)
                        .join(", ")
                    : "Todo al día"}
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Chat del Piso Preview */}
        <Link href="/chat">
          <Card
            data-testid="home-chat-card"
            className="cursor-pointer border-slate-200 bg-white shadow-xs hover:border-slate-300 transition"
          >
            <CardContent className="space-y-2.5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Chat del Piso</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  {lastMessage
                    ? (() => {
                        try {
                          return new Date(lastMessage.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                        } catch {
                          return "En vivo";
                        }
                      })()
                    : "En vivo"}
                </span>
              </div>
              <div className="border-slate-100 bg-slate-50 space-y-1 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-900 text-xs font-semibold">
                    {lastSenderName}
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    {lastMessage ? "Último mensaje" : "Sin mensajes"}
                  </span>
                </div>
                <p className="text-slate-600 line-clamp-2 text-xs">
                  {lastMessage?.content ||
                    "Pulsa para chatear con tus compañeros de piso..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Active Session Lease Info */}
        <div className="border-slate-200 bg-white rounded-xl border p-3 text-center shadow-xs">
          <div className="text-slate-500 flex items-center justify-center gap-1.5 text-[11px] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            <span>Perfil bloqueado para este dispositivo · Heartbeat activo</span>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
