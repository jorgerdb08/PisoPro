import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { PisoProNotification, NotificationType } from "@/types";

const PREF_KEY = "pisopro_notifications_enabled";

function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const notificationService = {
  /**
   * Reproduce un suave sonido de notificación (chime de 2 tonos) vía Web Audio API nativa
   */
  playNotificationSound(): void {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Nota 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Nota 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.08);
      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.38);
    } catch {
      // AudioContext puede requerir interacción previa del usuario
    }
  },

  /**
   * Comprueba si la API de notificaciones está soportada en el navegador
   */
  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  },

  /**
   * Obtiene el estado actual de los permisos del navegador
   */
  getPermission(): NotificationPermission {
    if (!this.isSupported()) return "denied";
    return Notification.permission;
  },

  /**
   * Comprueba si el usuario tiene las notificaciones activadas en sus ajustes locales
   */
  isEnabled(): boolean {
    if (!this.isSupported()) return false;
    if (Notification.permission !== "granted") return false;
    try {
      return localStorage.getItem(PREF_KEY) !== "false";
    } catch {
      return true;
    }
  },

  /**
   * Solicita permisos de notificación al usuario y guarda su preferencia
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      localStorage.setItem(PREF_KEY, granted ? "true" : "false");
      return granted;
    } catch (err) {
      console.error("[notificationService] Error requesting permission:", err);
      return false;
    }
  },

  /**
   * Desactiva las notificaciones en ajustes locales
   */
  disable(): void {
    try {
      localStorage.setItem(PREF_KEY, "false");
    } catch {
      // ignore
    }
  },

  /**
   * Emite una notificación nativa local a través del Service Worker o API directa
   */
  async sendNotification(
    title: string,
    options?: {
      body?: string;
      icon?: string;
      tag?: string;
      data?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const opts: NotificationOptions = {
      body: options?.body,
      icon: options?.icon || "/icons/icon-192x192.png",
      tag: options?.tag,
      data: options?.data,
    };

    try {
      // Intentar vía Service Worker Registration si está activo
      if (
        typeof navigator !== "undefined" &&
        "serviceWorker" in navigator &&
        navigator.serviceWorker.controller
      ) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification(title, opts);
          return true;
        }
      }

      // Fallback a Notification directa
      new Notification(title, opts);
      return true;
    } catch (err) {
      console.error("[notificationService] Error displaying notification:", err);
      return false;
    }
  },

  /**
   * Recordatorio de tarea asignada al usuario
   */
  async sendChoreReminder(choreTitle: string): Promise<boolean> {
    return this.sendNotification("🧹 Te toca hacer una tarea", {
      body: `Recuerda completar: "${choreTitle}" esta semana.`,
      tag: "chore-reminder",
      data: { url: "/tareas" },
    });
  },

  /**
   * Aviso de nuevo gasto compartido registrado en el piso
   */
  async sendExpenseNotice(
    payerName: string,
    amount: number,
    description: string
  ): Promise<boolean> {
    return this.sendNotification("Nuevo gasto compartido", {
      body: `${payerName} ha registrado ${amount.toFixed(2).replace(".", ",")} € en "${description}".`,
      tag: "expense-notice",
      data: { url: "/gastos" },
    });
  },

  /**
   * Aviso de recordatorio de deuda pendiente
   */
  async sendDebtReminderNotice(params: {
    senderName: string;
    senderUserId?: string;
    debtorName: string;
    debtorUserId: string;
    amount: number;
    concept: string;
    householdId?: string;
  }) {
    const formattedAmount = params.amount.toFixed(2).replace(".", ",") + " €";
    return this.dispatchNotification({
      type: "debt_reminder",
      title: `Recordatorio: ${params.concept}`,
      body: `${params.senderName} te recuerda transferir ${formattedAmount} por ${params.concept}.`,
      householdId: params.householdId,
      targetUserId: params.debtorUserId,
      actorUserId: params.senderUserId,
      actorName: params.senderName,
      data: { url: "/gastos", concept: params.concept, amount: params.amount },
    });
  },

  /**
   * Aviso de que el compañero ya ha realizado el pago/transferencia
   */
  async sendPaymentSentNotice(params: {
    senderName: string;
    senderUserId?: string;
    creditorName: string;
    creditorUserId: string;
    amount: number;
    concept: string;
    householdId?: string;
  }) {
    const formattedAmount = params.amount.toFixed(2).replace(".", ",") + " €";
    return this.dispatchNotification({
      type: "payment_sent",
      title: `Pago realizado: ${params.concept}`,
      body: `${params.senderName} te avisa de que ya te ha transferido los ${formattedAmount} de ${params.concept}.`,
      householdId: params.householdId,
      targetUserId: params.creditorUserId,
      actorUserId: params.senderUserId,
      actorName: params.senderName,
      data: { url: "/gastos", concept: params.concept, amount: params.amount },
    });
  },

  /**
   * Aviso de que el acreedor ha confirmado la recepción del pago
   */
  async sendPaymentReceivedNotice(params: {
    senderName: string;
    senderUserId?: string;
    debtorName: string;
    debtorUserId: string;
    amount: number;
    concept: string;
    householdId?: string;
  }) {
    const formattedAmount = params.amount.toFixed(2).replace(".", ",") + " €";
    return this.dispatchNotification({
      type: "payment_received",
      title: `Cobro confirmado: ${params.concept}`,
      body: `${params.senderName} ha confirmado haber recibido los ${formattedAmount} de ${params.concept}.`,
      householdId: params.householdId,
      targetUserId: params.debtorUserId,
      actorUserId: params.senderUserId,
      actorName: params.senderName,
      data: { url: "/gastos", concept: params.concept, amount: params.amount },
    });
  },

  /**
   * Aviso de mención directa en el chat del piso
   */
  async sendChatMentionNotice(
    senderName: string,
    messageSnippet: string
  ): Promise<boolean> {
    return this.sendNotification(`💬 Mención de ${senderName}`, {
      body: messageSnippet,
      tag: "chat-mention",
      data: { url: "/chat" },
    });
  },

  /**
   * Aviso urgente de compra al piso (ej. no queda papel higiénico)
   */
  async sendShoppingAlertNotice(
    senderName: string,
    itemName: string
  ): Promise<boolean> {
    return this.sendNotification(`🛒 Falta en el piso: ${itemName}`, {
      body: `${senderName} avisa que se ha terminado "${itemName}". ¡Añadido a la lista!`,
      tag: `shopping-alert-${itemName.toLowerCase().replace(/\s+/g, "-")}`,
      data: { url: "/compra" },
    });
  },

  /**
   * Aviso de superación en el ranking de puntos de convivencia
   */
  async sendOvertakeNotice(
    overtakerName: string,
    overtakenName: string,
    points: number,
    isCurrentTarget: boolean = false
  ): Promise<boolean> {
    const title = isCurrentTarget
      ? `⚡ ¡${overtakerName} te ha superado!`
      : `🏆 Cambio en el ranking del piso`;
    const body = isCurrentTarget
      ? `${overtakerName} te ha adelantado en el ranking con ${points} pts de convivencia.`
      : `${overtakerName} ha superado a ${overtakenName} con ${points} pts de convivencia.`;

    return this.sendNotification(title, {
      body,
      tag: `overtake-${overtakerName.toLowerCase()}-${Date.now()}`,
      data: { url: "/" },
    });
  },

  /**
   * Aviso de nueva semana y asignación de zona de limpieza
   */
  async sendWeeklyZoneNotice(
    userName: string,
    zoneName: string
  ): Promise<boolean> {
    return this.sendNotification("🧹 Nueva semana de limpieza", {
      body: `${userName}, esta semana te toca limpiar: ${zoneName}. ¡A por ella!`,
      tag: `weekly-zone-${zoneName.toLowerCase()}`,
      data: { url: "/tareas" },
    });
  },

  /**
   * Obtiene la lista de notificaciones in-app almacenadas
   */
  getInAppNotifications(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    userId?: string
  ): PisoProNotification[] {
    if (typeof window === "undefined") return [];
    try {
      const key = `pisopro_notifications_${householdId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const list = JSON.parse(raw) as PisoProNotification[];
      // Filtrar notificaciones dirigidas al usuario o generadas por él
      if (!userId) return list;
      return list.filter(
        (n) => !n.target_user_id || n.target_user_id === userId || n.actor_user_id === userId
      );
    } catch {
      return [];
    }
  },

  /**
   * Guarda o actualiza la lista de notificaciones in-app
   */
  saveInAppNotifications(
    notifications: PisoProNotification[],
    householdId: string = DEFAULT_HOUSEHOLD_ID
  ): void {
    if (typeof window === "undefined") return;
    try {
      const key = `pisopro_notifications_${householdId}`;
      // Limitar a las 50 más recientes para mantener el almacenamiento ligero
      const trimmed = notifications.slice(0, 50);
      localStorage.setItem(key, JSON.stringify(trimmed));
      window.dispatchEvent(new CustomEvent("pisopro-notification-updated"));
    } catch {
      // ignore
    }
  },

  /**
   * Marca una notificación como leída
   */
  markAsRead(
    notificationId: string,
    householdId: string = DEFAULT_HOUSEHOLD_ID
  ): void {
    const list = this.getInAppNotifications(householdId);
    const updated = list.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.saveInAppNotifications(updated, householdId);
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  markAllAsRead(householdId: string = DEFAULT_HOUSEHOLD_ID): void {
    const list = this.getInAppNotifications(householdId);
    const updated = list.map((n) => ({ ...n, read: true }));
    this.saveInAppNotifications(updated, householdId);
  },

  /**
   * Elimina una notificación por su ID
   */
  deleteNotification(
    notificationId: string,
    householdId: string = DEFAULT_HOUSEHOLD_ID
  ): void {
    const list = this.getInAppNotifications(householdId);
    const updated = list.filter((n) => n.id !== notificationId);
    this.saveInAppNotifications(updated, householdId);
  },

  /**
   * Borra todas las notificaciones
   */
  clearAllNotifications(householdId: string = DEFAULT_HOUSEHOLD_ID): void {
    this.saveInAppNotifications([], householdId);
  },

  /**
   * Despacha una notificación completa:
   * 1. Almacena en lista in-app local
   * 2. Envía notificación nativa si aplica
   * 3. Persiste en la tabla 'notifications' de Supabase (dispara Realtime postgres_changes a todos los dispositivos)
   * 4. Transmite por canal Realtime broadcast como respaldo
   */
  async dispatchNotification(
    params: {
      type: NotificationType;
      title: string;
      body: string;
      householdId?: string;
      targetUserId?: string | null;
      actorUserId?: string | null;
      actorName?: string | null;
      data?: Record<string, unknown>;
    }
  ): Promise<PisoProNotification> {
    const householdId = params.householdId || DEFAULT_HOUSEHOLD_ID;
    const targetUserId = isValidUuid(params.targetUserId) ? params.targetUserId : null;
    const actorUserId = isValidUuid(params.actorUserId) ? params.actorUserId : null;

    const notification: PisoProNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      household_id: householdId,
      type: params.type,
      title: params.title,
      body: params.body,
      created_at: new Date().toISOString(),
      read: false,
      target_user_id: targetUserId,
      actor_user_id: actorUserId,
      actor_name: params.actorName ?? null,
      data: params.data,
    };

    // 1. Guardar localmente
    const currentList = this.getInAppNotifications(householdId);
    this.saveInAppNotifications([notification, ...currentList], householdId);

    // 2. Notificación nativa si procede
    void this.sendNotification(params.title, {
      body: params.body,
      data: params.data,
    });

    // 3. Persistir en la tabla 'notifications' de Supabase
    // Al insertarse, PostgreSQL emite el evento postgres_changes vía WebSocket a todos los usuarios conectados
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await (supabase.from("notifications") as any)
        .insert({
          household_id: householdId,
          target_user_id: targetUserId,
          actor_user_id: actorUserId,
          type: params.type,
          title: params.title,
          body: params.body,
          data: params.data ?? {},
          read: false,
        })
        .select()
        .single();

      if (!error && data) {
        notification.id = data.id;
        notification.created_at = data.created_at;
      } else if (error) {
        console.warn("[notificationService] Supabase insert warning:", error.message || error);
      }
    } catch (err) {
      console.warn("[notificationService] Exception inserting notification to Supabase:", err);
    }

    // 4. Transmitir por broadcast como respaldo secundario
    try {
      const supabase = getSupabaseBrowserClient();
      const channel = supabase.channel(`pisopro-broadcast-${householdId}`);
      await channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.send({
            type: "broadcast",
            event: "new-notification",
            payload: notification,
          });
        }
      });
    } catch (err) {
      // ignore
    }

    return notification;
  },
};

