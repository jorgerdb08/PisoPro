"use client";

import React, { useRef, useEffect } from "react";
import { useChat } from "../useChat";
import { useAuth } from "@/features/auth/AuthContext";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { ChatInputBar } from "./ChatInputBar";
import { MessageSquare, Sparkles, Loader2 } from "lucide-react";

export function ChatView() {
  const { messages, isLoading, isSending, sendMessage, deleteMessage } = useChat();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Conectando al chat del piso...
        </p>
      </div>
    );
  }

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="flex flex-col h-[calc(100dvh-130px)] max-h-[calc(100dvh-130px)]">
      {/* Pinned Info Banner */}
      <div className="mx-4 mt-2 mb-1 flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium">
            Canal en vivo del piso. Usa <strong className="font-bold">@Jorge</strong>, <strong className="font-bold">@Samuel</strong> o <strong className="font-bold">@todos</strong>
          </span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              currentUserId={currentUser?.id}
              currentUserName={currentUser?.name}
              isAdmin={isAdmin}
              onDelete={deleteMessage}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-muted-foreground p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-foreground">El chat está tranquilo</h3>
            <p className="text-xs max-w-xs">
              Envía el primer mensaje o aviso para tus compañeros de piso.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <ChatInputBar onSendMessage={sendMessage} isSending={isSending} />
    </div>
  );
}
