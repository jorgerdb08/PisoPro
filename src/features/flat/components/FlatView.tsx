"use client";

import React, { useState } from "react";
import { Wifi, BookOpen, Phone, MapPin, Loader2 } from "lucide-react";
import { useFlat } from "../useFlat";
import { WifiCard } from "./WifiCard";
import { FlatmatesList } from "./FlatmatesList";
import { HouseRulesCard } from "./HouseRulesCard";
import { EmergencyContactsCard } from "./EmergencyContactsCard";
import { cn } from "@/lib/utils";

export function FlatView() {
  const { flatInfo, leaderboard, isLoading } = useFlat();
  const [activeTab, setActiveTab] = useState<"general" | "rules" | "contacts">("general");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Cargando datos del piso...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header Info Banner */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-[#31405F]">
            {flatInfo.name}
          </h2>
          <span className="rounded-full border border-[#094152]/30 bg-[#094152]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#094152]">
            3 Habitaciones
          </span>
        </div>
        <p className="text-xs text-[#607283] flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-[#094152] shrink-0" />
          <span>
            {flatInfo.address} · {flatInfo.city}
          </span>
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-3 rounded-2xl border border-[#BFC6CC]/60 bg-[#F4F7F8] p-1 text-xs font-bold">
        <button
          type="button"
          data-testid="tab-flat-general"
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all",
            activeTab === "general"
              ? "bg-white text-[#31405F] shadow-xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Wifi className="h-3.5 w-3.5" />
          <span>WiFi & Piso</span>
        </button>

        <button
          type="button"
          data-testid="tab-flat-rules"
          onClick={() => setActiveTab("rules")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all",
            activeTab === "rules"
              ? "bg-white text-[#31405F] shadow-xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <BookOpen className="h-3.5 w-3.5" />
          <span>Normas</span>
        </button>

        <button
          type="button"
          data-testid="tab-flat-contacts"
          onClick={() => setActiveTab("contacts")}
          className={cn(
            "flex items-center justify-center gap-1.5 rounded-xl py-2 transition-all",
            activeTab === "contacts"
              ? "bg-white text-[#31405F] shadow-xs"
              : "text-[#607283] hover:text-[#31405F]"
          )}
        >
          <Phone className="h-3.5 w-3.5" />
          <span>Contactos</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === "general" && (
          <>
            <WifiCard />
            <FlatmatesList scores={leaderboard} />
          </>
        )}

        {activeTab === "rules" && <HouseRulesCard />}

        {activeTab === "contacts" && <EmergencyContactsCard />}
      </div>
    </div>
  );
}
