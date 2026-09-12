import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseMentions,
  isUserMentioned,
  AVAILABLE_MENTIONS,
} from "@/features/chat/mentions";
import { chatService } from "@/services/chatService";

// Mock Supabase Browser Client
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: vi.fn(),
}));

describe("Chat Mentions Unit Tests", () => {
  it("provides available mentions for all flatmates and @todos", () => {
    const labels = AVAILABLE_MENTIONS.map((m) => m.label);
    expect(labels).toContain("@Jorge");
    expect(labels).toContain("@Samuel");
    expect(labels).toContain("@David");
    expect(labels).toContain("@todos");
  });

  it("parses single mention correctly", () => {
    const text = "Oye @Jorge acuérdate de bajar la basura";
    const segments = parseMentions(text);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: "text", value: "Oye " });
    expect(segments[1]).toEqual({ type: "mention", value: "@Jorge", target: "Jorge" });
    expect(segments[2]).toEqual({
      type: "text",
      value: " acuérdate de bajar la basura",
    });
  });

  it("parses multiple mentions in a single message", () => {
    const text = "Hola @Samuel y @David ¿cenamos hoy?";
    const segments = parseMentions(text);

    expect(segments).toHaveLength(5);
    expect(segments[0]?.value).toBe("Hola ");
    expect(segments[1]?.value).toBe("@Samuel");
    expect(segments[1]?.target).toBe("Samuel");
    expect(segments[2]?.value).toBe(" y ");
    expect(segments[3]?.value).toBe("@David");
    expect(segments[3]?.target).toBe("David");
    expect(segments[4]?.value).toBe(" ¿cenamos hoy?");
  });

  it("parses @todos broadcast mention", () => {
    const text = "Aviso urgente para @todos en el piso";
    const segments = parseMentions(text);

    expect(segments).toHaveLength(3);
    expect(segments[1]).toEqual({ type: "mention", value: "@todos", target: "all" });
  });

  it("returns single text segment if no mentions exist", () => {
    const text = "Hola a todos, hoy me toca cocinar";
    const segments = parseMentions(text);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toEqual({ type: "text", value: text });
  });

  it("handles empty or null text safely", () => {
    expect(parseMentions("")).toEqual([]);
  });

  it("correctly identifies if the active flatmate is mentioned", () => {
    expect(isUserMentioned("Oye @Jorge ven", "Jorge")).toBe(true);
    expect(isUserMentioned("Oye @jorge ven", "Jorge")).toBe(true);
    expect(isUserMentioned("Oye @Samuel ven", "Jorge")).toBe(false);
    expect(isUserMentioned("Aviso para @todos los del piso", "David")).toBe(true);
    expect(isUserMentioned("Aviso para @todos los del piso", "Samuel")).toBe(true);
    expect(isUserMentioned("Sin menciones aquí", "David")).toBe(false);
  });
});

describe("Chat Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gracefully returns empty array on Supabase error", async () => {
    const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
    vi.mocked(getSupabaseBrowserClient).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Failed to connect" },
              }),
            }),
          }),
        }),
      }),
    } as unknown as ReturnType<typeof getSupabaseBrowserClient>);

    const messages = await chatService.getMessages("h1");
    expect(messages).toEqual([]);
  });
});
