"use client";

import React, { useState } from "react";
import { Wifi, Copy, Check, ShieldCheck } from "lucide-react";
import { FLAT_INFO } from "@/lib/constants";

export function WifiCard() {
  const [copied, setCopied] = useState(false);

  const handleCopyPassword = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(FLAT_INFO.wifiPass);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Error al copiar contraseña WiFi:", err);
    }
  };

  return (
    <div
      data-testid="wifi-card"
      className="relative overflow-hidden rounded-3xl border border-[#BFC6CC]/60 bg-white p-5 shadow-xs space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#094152] text-white shadow-xs">
            <Wifi className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#094152]">
              Conexión Fibra 5G
            </span>
            <h3 className="text-sm font-bold text-[#31405F]">Red WiFi del Piso</h3>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[#094152]/10 px-2.5 py-1 text-[11px] font-bold text-[#094152]">
          <ShieldCheck className="h-3 w-3" />
          <span>Segura</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* SSID */}
        <div className="rounded-2xl border border-[#BFC6CC]/60 bg-[#F4F7F8] p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#607283]">
            Nombre de red (SSID)
          </span>
          <p className="text-sm font-bold text-[#31405F] mt-0.5 select-all">
            {FLAT_INFO.wifiSsid}
          </p>
        </div>

        {/* Password & Copy Action */}
        <div className="rounded-2xl border border-[#BFC6CC]/60 bg-[#F4F7F8] p-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#607283]">
              Contraseña
            </span>
            <p
              data-testid="wifi-password-value"
              className="text-sm font-mono font-bold text-[#31405F] mt-0.5 select-all tracking-wider"
            >
              {FLAT_INFO.wifiPass}
            </p>
          </div>

          <button
            type="button"
            data-testid="copy-wifi-btn"
            onClick={handleCopyPassword}
            title="Copiar contraseña"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#194F6B] text-white shadow-xs hover:bg-[#31405F] active:scale-90 transition-all ml-2 shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 stroke-[3]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {copied && (
        <p className="text-center text-xs font-semibold text-[#094152] animate-in fade-in duration-150">
          ¡Contraseña copiada al portapapeles! Lista para compartir con visitas.
        </p>
      )}
    </div>
  );
}
