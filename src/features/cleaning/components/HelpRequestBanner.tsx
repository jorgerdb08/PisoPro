"use client";

import React, { useState } from "react";
import type { CleaningHelpRequest } from "@/types";

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
          className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{req.zone_icon || "🚨"}</span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                🚨 {req.requester_name || "Un compañero"} necesita ayuda con {req.zone_name || "su zona"}
              </p>
              <p className="text-xs text-amber-700">
                Ayuda a completarla y gana <span className="font-bold">+1 punto</span>
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
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow transition-colors flex items-center space-x-1 disabled:opacity-50"
          >
            {loadingId === req.id ? (
              <span>Uniéndose...</span>
            ) : (
              <span>🤝 [ AYUDAR ]</span>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};
