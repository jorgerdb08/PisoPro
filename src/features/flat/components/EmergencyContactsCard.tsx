"use client";

import React from "react";
import { Phone, PhoneCall, AlertCircle } from "lucide-react";
import { EMERGENCY_CONTACTS, FLAT_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EmergencyContactsCard() {
  return (
    <div className="space-y-4">
      {/* Landlord & Contract Summary Card */}
      <div className="rounded-3xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
            <span>Datos del Alquiler</span>
          </span>
          <span className="text-xs font-extrabold text-foreground">
            {FLAT_INFO.rentAmount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5">
            <span className="text-[10px] text-muted-foreground font-semibold">Propietario / Casero</span>
            <p className="font-bold text-foreground mt-0.5">{FLAT_INFO.landlordName}</p>
            <a
              href={`tel:${FLAT_INFO.landlordPhone}`}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1 mt-1"
            >
              <Phone className="h-3 w-3" />
              <span>{FLAT_INFO.landlordPhone}</span>
            </a>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5">
            <span className="text-[10px] text-muted-foreground font-semibold">Cobro del Alquiler</span>
            <p className="font-bold text-foreground mt-0.5">{FLAT_INFO.rentDueDay}</p>
            <span className="text-[11px] text-muted-foreground block mt-1">
              Dirección: {FLAT_INFO.address}
            </span>
          </div>
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-emerald-600" />
          <span>Contactos de Asistencia y Emergencia</span>
        </h3>

        <div className="space-y-2.5">
          {EMERGENCY_CONTACTS.map((contact, index) => (
            <div
              key={index}
              data-testid={`contact-card-${index}`}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-3.5 shadow-xs transition-all",
                contact.isUrgent
                  ? "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50"
                  : "border-border/80 bg-card hover:border-emerald-500/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base",
                    contact.isUrgent ? "bg-rose-500/15 text-rose-600" : "bg-secondary text-foreground"
                  )}
                >
                  {contact.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {contact.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">{contact.role}</p>
                  <p className="text-xs font-mono font-semibold text-foreground/80 mt-0.5">
                    {contact.phone}
                  </p>
                </div>
              </div>

              <a
                href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                aria-label={`Llamar a ${contact.name}`}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all active:scale-90",
                  contact.isUrgent
                    ? "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/30"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20"
                )}
              >
                <PhoneCall className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
