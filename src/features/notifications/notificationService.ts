const PREF_KEY = "pisopro_notifications_enabled";

export const notificationService = {
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
    return this.sendNotification("💰 Nuevo gasto compartido", {
      body: `${payerName} ha registrado ${amount.toFixed(2).replace(".", ",")} € en "${description}".`,
      tag: "expense-notice",
      data: { url: "/gastos" },
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
};
