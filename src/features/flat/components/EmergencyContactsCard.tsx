"use client";

import React from "react";
import { Phone, PhoneCall, AlertCircle } from "lucide-react";
import { EMERGENCY_CONTACTS, FLAT_INFO } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EmergencyContactsCard() {
  return (
    <div className="space-y-4">
      {/* Landlord & Contract Summary Card */}
      <div className="rounded-3xl border border-[#BFC6CC]/60 bg-white p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#607283] flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-[#094152]" />
            <span>Datos del Alquiler</span>
          </span>
          <span className="text-xs font-extrabold text-[#31405F]">
            {FLAT_INFO.rentAmount}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="rounded-xl border border-[#BFC6CC]/40 bg-[#F4F7F8] p-2.5">
            <span className="text-[10px] text-[#607283] font-semibold">Propietario / Casero</span>
            <p className="font-bold text-[#31405F] mt-0.5">{FLAT_INFO.landlordName}</p>
            <a
              href={`tel:${FLAT_INFO.landlordPhone}`}
              className="text-[#194F6B] font-semibold hover:underline flex items-center gap-1 mt-1"
            >
              <Phone className="h-3 w-3" />
              <span>{FLAT_INFO.landlordPhone}</span>
            </a>
          </div>

          <div className="rounded-xl border border-[#BFC6CC]/40 bg-[#F4F7F8] p-2.5">
            <span className="text-[10px] text-[#607283] font-semibold">Cobro del Alquiler</span>
            <p className="font-bold text-[#31405F] mt-0.5">{FLAT_INFO.rentDueDay}</p>
            <span className="text-[11px] text-[#607283] block mt-1">
              Dirección: {FLAT_INFO.address}
            </span>
          </div>
        </div>
      </div>

      {/* Directory List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#607283] flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-[#094152]" />
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
                  ? "border-[#C995A2]/40 bg-[#C995A2]/10 hover:border-[#C995A2]/60"
                  : "border-[#BFC6CC]/60 bg-white hover:border-[#194F6B]/40"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-base",
                    contact.isUrgent ? "bg-[#C995A2]/20 text-[#8B4B5B]" : "bg-[#F4F7F8] text-[#31405F]"
                  )}
                >
                  {contact.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#31405F]">
                    {contact.name}
                  </h4>
                  <p className="text-xs text-[#607283]">{contact.role}</p>
                  <p className="text-xs font-mono font-semibold text-[#31405F]/80 mt-0.5">
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
                    ? "bg-[#C995A2] text-white hover:bg-[#8B4B5B] shadow-xs"
                    : "bg-[#194F6B] text-white hover:bg-[#31405F] shadow-xs"
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
