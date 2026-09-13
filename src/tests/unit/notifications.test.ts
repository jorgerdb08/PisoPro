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

  it("formats shopping alert notice accurately", async () => {
    const sendSpy = vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);
    await notificationService.sendShoppingAlertNotice("Jorge", "Papel higiénico");

    expect(sendSpy).toHaveBeenCalledWith(
      "🛒 Falta en el piso: Papel higiénico",
      expect.objectContaining({
        body: expect.stringContaining("Papel higiénico"),
        tag: "shopping-alert-papel-higiénico",
      })
    );
  });

  it("formats overtake notice accurately for target user and flatmate", async () => {
    const sendSpy = vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);

    // When target user is overtaken
    await notificationService.sendOvertakeNotice("Samuel", "Jorge", 5, true);
    expect(sendSpy).toHaveBeenCalledWith(
      "⚡ ¡Samuel te ha superado!",
      expect.objectContaining({
        body: expect.stringContaining("5 pts"),
      })
    );

    // Generic flatmate overtake
    await notificationService.sendOvertakeNotice("David", "Samuel", 8, false);
    expect(sendSpy).toHaveBeenCalledWith(
      "🏆 Cambio en el ranking del piso",
      expect.objectContaining({
        body: expect.stringContaining("David ha superado a Samuel con 8 pts"),
      })
    );
  });

  it("formats weekly zone cleaning notice accurately", async () => {
    const sendSpy = vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);
    await notificationService.sendWeeklyZoneNotice("Jorge", "Cocina");

    expect(sendSpy).toHaveBeenCalledWith(
      "🧹 Nueva semana de limpieza",
      expect.objectContaining({
        body: expect.stringContaining("esta semana te toca limpiar: Cocina"),
        tag: "weekly-zone-cocina",
      })
    );
  });

  it("manages in-app notifications lifecycle (dispatch, read, clear)", async () => {
    vi.spyOn(notificationService, "sendNotification").mockResolvedValue(true);

    // 1. Dispatch notification
    const notif1 = await notificationService.dispatchNotification({
      type: "shopping_alert",
      title: "Falta aceite",
      body: "No queda aceite en la cocina",
      actorName: "Samuel",
      data: { url: "/compra" },
    });

    const notif2 = await notificationService.dispatchNotification({
      type: "weekly_zone",
      title: "Nueva semana",
      body: "Te toca Baño",
      targetUserId: "user-target-1",
      data: { url: "/tareas" },
    });
    expect(notif2.id).toBeDefined();

    // 2. Fetch all
    const all = notificationService.getInAppNotifications();
    expect(all.length).toBe(2);
    expect(all[0]?.read).toBe(false);

    // 3. Mark single as read
    notificationService.markAsRead(notif1.id);
    const afterReadOne = notificationService.getInAppNotifications();
    expect(afterReadOne.find((n) => n.id === notif1.id)?.read).toBe(true);

    // 4. Filter by target user
    const filtered = notificationService.getInAppNotifications(undefined, "user-target-1");
    expect(filtered.length).toBe(2); // notif1 has target_user_id null (all), notif2 targets user-target-1

    // 5. Mark all as read
    notificationService.markAllAsRead();
    const afterAllRead = notificationService.getInAppNotifications();
    expect(afterAllRead.every((n) => n.read)).toBe(true);

    // 6. Delete single
    notificationService.deleteNotification(notif1.id);
    const afterDelete = notificationService.getInAppNotifications();
    expect(afterDelete.length).toBe(1);

    // 7. Clear all
    notificationService.clearAllNotifications();
    expect(notificationService.getInAppNotifications()).toHaveLength(0);
  });
});

