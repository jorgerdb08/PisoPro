"use client";

import React from "react";
import { FLATMATES } from "@/lib/constants";
import { parseMentions, isUserMentioned } from "../mentions";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import type { Message } from "@/types";

interface ChatMessageBubbleProps {
  message: Message;
  currentUserId?: string;
  currentUserName?: string;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export function ChatMessageBubble({
  message,
  currentUserId,
  currentUserName,
  isAdmin,
  onDelete,
}: ChatMessageBubbleProps) {
  const isMine = message.user_id === currentUserId;
  const sender = FLATMATES.find((f) => f.id === message.user_id);
  const senderName = sender?.name || "Compañero";

  const mentionedMe = isUserMentioned(message.content, currentUserName);
  const segments = parseMentions(message.content);

  const formattedTime = (() => {
    try {
      const date = new Date(message.created_at);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  })();

  const canDelete = isMine || isAdmin;

  return (
    <div
      data-testid={`chat-message-${message.id}`}
      className={cn(
        "group flex w-full flex-col gap-1 transition-all",
        isMine ? "items-end" : "items-start"
      )}
    >
      {/* Sender Header (only for others' messages) */}
      {!isMine && (
        <div className="flex items-center gap-1.5 pl-2 text-[11px] font-semibold text-muted-foreground">
          <span
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-black text-white",
              sender?.color || "bg-muted-foreground"
            )}
          >
            {senderName[0]}
          </span>
          <span>{senderName}</span>
        </div>
      )}

      <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
        {/* Delete button on hover for mine (or admin) */}
        {isMine && canDelete && onDelete && (
          <button
            type="button"
            data-testid={`delete-msg-${message.id}`}
            onClick={() => onDelete(message.id)}
            title="Eliminar mensaje"
            className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "relative rounded-2xl px-3.5 py-2.5 shadow-xs text-sm break-words transition-all",
            isMine
              ? "rounded-br-xs bg-slate-900 text-white"
              : cn(
                  "rounded-bl-xs border border-slate-200 bg-white text-slate-900",
                  mentionedMe && "ring-1 ring-slate-900 bg-slate-50 border-slate-300"
                )
          )}
        >
          {/* Content with Mentions */}
          <p className="leading-relaxed">
            {segments.map((segment, index) => {
              if (segment.type === "mention") {
                const isTargetMe =
                  segment.target === "all" ||
                  segment.target?.toLowerCase() === currentUserName?.toLowerCase();

                return (
                  <span
                    key={index}
                    className={cn(
                      "inline-flex items-center rounded-md px-1.5 py-0.2 mx-0.5 text-xs font-bold transition-all",
                      isMine
                        ? "bg-white/20 text-white"
                        : isTargetMe
                        ? "bg-emerald-500 text-white font-extrabold shadow-xs"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                    )}
                  >
                    {segment.value}
                  </span>
                );
              }
              return <span key={index}>{segment.value}</span>;
            })}
          </p>

          {/* Timestamp */}
          <div
            className={cn(
              "mt-1 flex items-center justify-end text-[10px] font-medium select-none",
              isMine ? "text-emerald-100/80" : "text-muted-foreground"
            )}
          >
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Delete button on hover for others if admin */}
        {!isMine && canDelete && onDelete && (
          <button
            type="button"
            data-testid={`delete-msg-${message.id}`}
            onClick={() => onDelete(message.id)}
            title="Eliminar mensaje (Admin)"
            className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all active:scale-90"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
