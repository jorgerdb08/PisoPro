"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TopHeader } from "@/components/layout/TopHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/features/auth/AuthContext";
import { useChores } from "@/features/chores/useChores";
import { useExpenses } from "@/features/expenses/useExpenses";
import { useShopping } from "@/features/shopping/useShopping";
import { useChat } from "@/features/chat/useChat";
import { useCleaning } from "@/features/cleaning/useCleaning";
import { useTrash } from "@/features/cleaning/useTrash";
import { HelpRequestBanner } from "@/features/cleaning/components/HelpRequestBanner";
import { FLATMATES } from "@/lib/constants";
import { ProfileSelectorModal } from "@/features/auth/components/ProfileSelectorModal";
import { AdminModal } from "@/features/admin/components/AdminModal";
import {
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
  const { pendingTasks } = useChores();
  const { userSummary } = useExpenses();
  const { pendingItems } = useShopping();
  const { lastMessage } = useChat();

  const lastSender = lastMessage ? FLATMATES.find((f) => f.id === lastMessage.user_id) : null;
  const lastSenderName = lastSender?.name || (lastMessage ? "Compañero" : "PisoPro");

  // Sistema de limpieza por zonas, ayuda y basura
  const {
    myAssignedZone,
    activeHelpRequests,
    acceptHelp,
    requestHelp,
  } = useCleaning();
  const { recordTrash } = useTrash();



  // 1. Loading state while checking session and device lease
  if (isLoading) {
    return (
      <div className="bg-[#FAFBFC] flex min-h-screen flex-col items-center justify-center space-y-3 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#31405F] text-white shadow-xs">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-[#607283] text-xs font-semibold tracking-wide uppercase">
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
            <h2 className="text-[#31405F] text-xl font-bold tracking-tight">
              Hola, {currentUser.name} 👋
            </h2>
            <p className="text-[#607283] text-xs">
              {currentUser.role === "admin"
                ? "Administrador del piso"
                : "Compañero de piso"}
            </p>
          </div>
          <Badge
            variant="secondary"
            className="gap-1 border-[#094152]/30 bg-[#094152]/10 px-2 py-0.5 text-xs text-[#094152]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#094152]" />
            En línea
          </Badge>
        </div>

        {/* Solicitudes de ayuda activas de compañeros (en tiempo real) */}
        <HelpRequestBanner
          helpRequests={activeHelpRequests}
          onAcceptHelp={acceptHelp}
        />

        {/* Tarjeta Principal: ESTA SEMANA TE TOCA */}
        <Card className="overflow-hidden border-[#BFC6CC]/70 bg-gradient-to-br from-white via-[#F4F8FA] to-[#E6F0F4] text-[#31405F] shadow-sm">
          <CardContent className="space-y-3.5 p-5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#607283] flex items-center gap-1.5">
                <span>📅</span> ESTA SEMANA TE TOCA
              </span>
              {myAssignedZone && (
                <span className="rounded-full bg-[#31405F]/10 border border-[#31405F]/20 px-2.5 py-0.5 text-[11px] font-bold text-[#31405F]">
                  +{myAssignedZone.zone_default_points} pts
                </span>
              )}
            </div>

            {myAssignedZone ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl p-2 bg-white rounded-2xl shadow-2xs">
                    {myAssignedZone.zone_icon}
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-[#31405F] tracking-tight">
                      {myAssignedZone.zone_name.toUpperCase()}
                    </h3>
                    <p className="text-xs text-[#607283]">
                      {myAssignedZone.is_completed
                        ? "✓ ¡Zona completada esta semana!"
                        : "Tu zona de responsabilidad exclusiva esta semana"}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div>
                  <div className="flex justify-between text-xs font-semibold text-[#607283] mb-1">
                    <span>
                      {myAssignedZone.checked_count} / {myAssignedZone.total_count} tareas
                    </span>
                    <span className={myAssignedZone.is_completed ? "text-emerald-600 font-bold" : ""}>
                      {myAssignedZone.total_count > 0
                        ? Math.round((myAssignedZone.checked_count / myAssignedZone.total_count) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        myAssignedZone.is_completed ? "bg-emerald-500" : "bg-[#194F6B]"
                      }`}
                      style={{
                        width: `${
                          myAssignedZone.total_count > 0
                            ? (myAssignedZone.checked_count / myAssignedZone.total_count) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Acciones de Tareas y Ayuda */}
                <div className="pt-2 border-t border-[#BFC6CC]/40 flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href="/tareas"
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#31405F] to-[#194F6B] text-white text-xs font-bold shadow-xs hover:opacity-95 transition"
                  >
                    [ VER TAREAS ]
                  </Link>

                  {myAssignedZone.help_request?.status === "open" ? (
                    <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                      🚨 Ayuda pedida ({myAssignedZone.helpers.length} ayudando)
                    </span>
                  ) : !myAssignedZone.is_completed ? (
                    <button
                      onClick={() => requestHelp(myAssignedZone.zone_id)}
                      className="text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      🤝 ¿Necesitas ayuda? [ PEDIR AYUDA ]
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="py-2 space-y-2">
                <div className="flex items-center space-x-2 text-amber-800">
                  <span className="text-2xl">🎲</span>
                  <div>
                    <h4 className="text-sm font-bold">Zonas pendientes de sorteo</h4>
                    <p className="text-xs text-[#607283]">
                      Las 3 zonas principales están sin asignar.
                    </p>
                  </div>
                </div>
                <Link
                  href="/tareas"
                  className="inline-block px-4 py-2 bg-[#31405F] text-white text-xs font-bold rounded-xl"
                >
                  Ir al Sorteo Inicial
                </Link>
              </div>
            )}

            {/* Quick Action: Tirar la Basura */}
            <div className="pt-3 border-t border-[#BFC6CC]/50 flex items-center justify-between bg-white/70 -mx-5 -mb-5 p-3.5 rounded-b-2xl">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🗑️</span>
                <span className="text-xs font-bold text-[#31405F]">
                  ¿Has tirado la basura?
                </span>
              </div>
              <button
                onClick={async () => {
                  const res = await recordTrash("general");
                  if (res.success) {
                    alert("✓ Basura registrada: +1 punto añadido a tu contribución.");
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                [ + REGISTRAR (+1 pt) ]
              </button>
            </div>
          </CardContent>
        </Card>


        {/* Balances Summary Card */}
        <Link href="/gastos" className="block">
          <Card data-testid="home-balance-card" className="cursor-pointer border-[#BFC6CC]/60 bg-white shadow-xs hover:border-[#194F6B]/40 transition">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[#607283] flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <Wallet className="h-3.5 w-3.5 text-[#194F6B]" />
                  <span>Balance Compartido</span>
                </span>
                <span className="flex items-center text-xs font-medium text-[#194F6B] hover:text-[#31405F]">
                  Detalles <ArrowRight className="ml-0.5 h-3 w-3" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="border-[#C995A2]/30 bg-[#C995A2]/10 rounded-xl border p-3">
                  <span className="text-[#8B4B5B] text-[11px] font-medium">
                    Debes
                  </span>
                  <p className="text-[#8B4B5B] text-base font-bold">
                    {userSummary.totalOwedByMe.toFixed(2).replace(".", ",")} €
                  </p>
                </div>
                <div className="border-[#094152]/20 bg-[#094152]/5 rounded-xl border p-3">
                  <span className="text-[#094152] text-[11px] font-medium">
                    Te deben
                  </span>
                  <p className="text-base font-bold text-[#094152]">
                    {userSummary.totalOwedToMe.toFixed(2).replace(".", ",")} €
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quick Grid: Tareas & Compra */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Tareas Card */}
          <Link href="/tareas">
            <Card
              data-testid="home-tasks-card"
              className="cursor-pointer border-[#BFC6CC]/60 bg-white shadow-xs hover:border-[#194F6B]/40 transition h-full"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#094152]/10 text-[#094152]">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[#607283] text-xs font-bold tracking-wider uppercase">
                    Tareas
                  </h4>
                  <p className="text-[#31405F] mt-0.5 text-sm font-bold">
                    {pendingTasks.length} pendientes
                  </p>
                </div>
                <p className="text-[#607283] text-[11px]">Rotación semanal</p>
              </CardContent>
            </Card>
          </Link>

          {/* Compra Card */}
          <Link href="/compra" className="h-full">
            <Card
              data-testid="home-shopping-card"
              className="cursor-pointer border-[#BFC6CC]/60 bg-white shadow-xs hover:border-[#194F6B]/40 transition h-full"
            >
              <CardContent className="space-y-2 p-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#194F6B]/10 text-[#194F6B]">
                  <ShoppingCart className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-[#607283] text-xs font-bold tracking-wider uppercase">
                    Compra
                  </h4>
                  <p className="text-[#31405F] mt-0.5 text-sm font-bold">
                    {pendingItems.length}{" "}
                    {pendingItems.length === 1 ? "producto" : "productos"}
                  </p>
                </div>
                <p className="text-[#607283] text-[11px] truncate">
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
            className="cursor-pointer border-[#BFC6CC]/60 bg-white shadow-xs hover:border-[#194F6B]/40 transition"
          >
            <CardContent className="space-y-2.5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[#607283] flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                  <MessageSquare className="h-3.5 w-3.5 text-[#31405F]" />
                  <span>Chat del Piso</span>
                </span>
                <span className="text-[#607283] text-[11px]">
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
              <div className="border-[#BFC6CC]/40 bg-[#F4F7F8] space-y-1 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[#31405F] text-xs font-semibold">
                    {lastSenderName}
                  </span>
                  <span className="text-[#607283] text-[10px]">
                    {lastMessage ? "Último mensaje" : "Sin mensajes"}
                  </span>
                </div>
                <p className="text-[#607283] line-clamp-2 text-xs">
                  {lastMessage?.content ||
                    "Pulsa para chatear con tus compañeros de piso..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </main>

      <BottomNav />
    </div>
  );
}
