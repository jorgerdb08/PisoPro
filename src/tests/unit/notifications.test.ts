import { describe, it, expect, vi, beforeEach } from "vitest";
import { notificationService } from "@/features/notifications/notificationService";

describe("Notification Service Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("checks browser notification support correctly", () => {
    // In node/vitest environment without Notification on window, should return false or handle gracefully
    const supported = notificationService.isSupported();
    expect(typeof supported).toBe("boolean");
  });

  it("disables notifications preference in localStorage", () => {
    notificationService.disable();
    expect(localStorage.getItem("pisopro_notifications_enabled")).toBe("false");
    expect(notificationService.isEnabled()).toBe(false);
  });

  it("formats chore reminder options accurately", async () => {
    const sendSpy = vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);
    await notificationService.sendChoreReminder("Limpiar cocina");

    expect(sendSpy).toHaveBeenCalledWith(
      "🧹 Te toca hacer una tarea",
      expect.objectContaining({
        body: expect.stringContaining("Limpiar cocina"),
        tag: "chore-reminder",
      })
    );
  });

  it("formats expense notice options accurately", async () => {
    const sendSpy = vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);
    await notificationService.sendExpenseNotice("Jorge", 45.5, "Mercadona");

    expect(sendSpy).toHaveBeenCalledWith(
      "💰 Nuevo gasto compartido",
      expect.objectContaining({
        body: expect.stringContaining("45,50 €"),
        tag: "expense-notice",
      })
    );
  });

  it("formats chat mention notice accurately", async () => {
    const sendSpy = vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);
    await notificationService.sendChatMentionNotice("Samuel", "¿Quién baja la basura?");

    expect(sendSpy).toHaveBeenCalledWith(
      "💬 Mención de Samuel",
      expect.objectContaining({
        body: "¿Quién baja la basura?",
        tag: "chat-mention",
      })
    );
  });
});
