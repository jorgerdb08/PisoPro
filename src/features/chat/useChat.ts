"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { chatService } from "@/services/chatService";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/features/auth/AuthContext";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { Message } from "@/types";

export function useChat() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);

  const supabase = getSupabaseBrowserClient();

  const fetchMessages = useCallback(async () => {
    try {
      const data = await chatService.getMessages(DEFAULT_HOUSEHOLD_ID);
      setMessages(data);
    } catch (err) {
      console.error("[useChat] Error fetching messages:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and Supabase Realtime channel subscription
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const data = await chatService.getMessages(DEFAULT_HOUSEHOLD_ID);
        if (isMounted) {
          setMessages(data);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("[useChat] Error loading messages in effect:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    const channel = supabase
      .channel("pisopro-chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Send Message
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!currentUser || !content.trim()) return false;

      const trimmed = content.trim();
      setIsSending(true);

      // Optimistic message
      const tempId = `temp-${Date.now()}`;
      const optimisticMsg: Message = {
        id: tempId,
        household_id: DEFAULT_HOUSEHOLD_ID,
        user_id: currentUser.id,
        content: trimmed,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        const created = await chatService.sendMessage({
          household_id: DEFAULT_HOUSEHOLD_ID,
          user_id: currentUser.id,
          content: trimmed,
        });

        if (created) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? created : m))
          );
          return true;
        } else {
          // Revert optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          return false;
        }
      } catch (err) {
        console.error("[useChat] Error sending message:", err);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [currentUser]
  );

  // Delete Message
  const deleteMessage = useCallback(
    async (messageId: string): Promise<boolean> => {
      // Optimistic delete
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      try {
        const success = await chatService.deleteMessage(messageId);
        if (!success) {
          void fetchMessages();
        }
        return success;
      } catch (err) {
        console.error("[useChat] Error deleting message:", err);
        void fetchMessages();
        return false;
      }
    },
    [fetchMessages]
  );

  const lastMessage = useMemo(() => {
    return messages.length > 0 ? messages[messages.length - 1] ?? null : null;
  }, [messages]);

  return {
    messages,
    isLoading,
    isSending,
    lastMessage,
    sendMessage,
    deleteMessage,
    refresh: fetchMessages,
  };
}
