"use client";

import React, { useState, useRef } from "react";
import { Send, AtSign, Loader2 } from "lucide-react";
import { AVAILABLE_MENTIONS } from "../mentions";

interface ChatInputBarProps {
  onSendMessage: (content: string) => Promise<boolean>;
  isSending?: boolean;
}

export function ChatInputBar({ onSendMessage, isSending }: ChatInputBarProps) {
  const [content, setContent] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() || isSending) return;

    const textToSend = content.trim();
    setContent("");
    await onSendMessage(textToSend);

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleInsertMention = (mentionValue: string) => {
    setContent((prev) => {
      const space = prev.length > 0 && !prev.endsWith(" ") ? " " : "";
      return `${prev}${space}${mentionValue} `;
    });
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="border-t border-border/80 bg-background/95 p-3 backdrop-blur-md space-y-2">
      {/* Quick Mention Suggestions */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mr-1">
          <AtSign className="h-3 w-3 text-emerald-600" />
          <span>Mencionar:</span>
        </div>
        {AVAILABLE_MENTIONS.map((mention) => (
          <button
            key={mention.value}
            type="button"
            onClick={() => handleInsertMention(mention.value)}
            className="shrink-0 rounded-full border border-border/80 bg-secondary/70 px-2.5 py-0.5 text-xs font-semibold text-foreground hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
          >
            {mention.label}
          </button>
        ))}
      </div>

      {/* Input Row */}
      <form onSubmit={handleSend} className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          data-testid="chat-message-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje o aviso..."
          className="flex-1 rounded-2xl border border-border/80 bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />

        <button
          type="submit"
          data-testid="chat-send-btn"
          disabled={!content.trim() || isSending}
          aria-label="Enviar mensaje"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 active:scale-95 transition-all"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4 stroke-[2.5]" />
          )}
        </button>
      </form>
    </div>
  );
}
