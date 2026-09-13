"use client";

import React, { useState } from "react";
import type { CleaningHelpRequest } from "@/types";
import { AlertCircle, Handshake, Loader2 } from "lucide-react";

interface HelpRequestBannerProps {
  helpRequests: CleaningHelpRequest[];
  onAcceptHelp: (requestId: string) => Promise<{ success: boolean; error?: string }>;
}

export const HelpRequestBanner: React.FC<HelpRequestBannerProps> = ({
  helpRequests,
  onAcceptHelp,
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (!helpRequests || helpRequests.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {helpRequests.map((req) => (
        <div
          key={req.id}
          className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {req.requester_name || "Un compañero"} solicita ayuda en {req.zone_name || "su zona"}
              </p>
              <p className="text-[11px] text-slate-500">
                Ayuda a completarla y recibe <span className="font-semibold text-emerald-700">+1 punto</span>
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              setLoadingId(req.id);
              try {
                await onAcceptHelp(req.id);
              } finally {
                setLoadingId(null);
              }
            }}
            disabled={loadingId === req.id}
            className="px-3 py-1.5 bg-[#31405F] hover:bg-[#194F6B] text-white text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
          >
            {loadingId === req.id ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uniéndose...</span>
              </>
            ) : (
              <>
                <Handshake className="w-3.5 h-3.5" />
                <span>Ayudar</span>
              </>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};
