"use client";

import React, { createContext, useContext } from "react";
import { usePWA } from "@/hooks/usePWA";
import { OfflineBanner } from "@/components/common/OfflineBanner";
import { Download } from "lucide-react";

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextType>({
  isInstallable: false,
  isInstalled: false,
  promptInstall: async () => false,
});

export const usePwaContext = () => useContext(PwaContext);

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const { isInstallable, isInstalled, promptInstall } = usePWA();

  return (
    <PwaContext.Provider value={{ isInstallable, isInstalled, promptInstall }}>
      <OfflineBanner />
      {children}
      {isInstallable && (
        <aside
          aria-label="Aviso de instalación PWA"
          className="border-[#BFC6CC]/60 bg-white/95 fixed right-4 bottom-20 left-4 z-40 flex items-center justify-between rounded-xl border p-3 shadow-lg backdrop-blur-md transition-all sm:right-6 sm:left-auto sm:w-80"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#31405F] text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[#31405F] text-xs font-semibold">Instalar PisoPro</p>
              <p className="text-[#607283] text-[11px]">
                Acceso rápido y modo offline
              </p>
            </div>
          </div>
          <button
            onClick={() => promptInstall()}
            className="rounded-lg bg-[#31405F] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#194F6B] active:scale-95"
          >
            Instalar
          </button>
        </aside>
      )}
    </PwaContext.Provider>
  );
}
