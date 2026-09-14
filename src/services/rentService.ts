import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  DEFAULT_HOUSEHOLD_ID,
  FLATMATES,
  TOTAL_MONTHLY_RENT,
  RENT_PER_FLATMATE,
} from "@/lib/constants";
import { chatService } from "./chatService";
import { notificationService } from "@/features/notifications/notificationService";
import { expensesService } from "./expensesService";
import type { ExpenseItem } from "@/features/expenses/calculations";

export interface FlatmateRentStatus {
  userId: string;
  userName: "Jorge" | "Samuel" | "David";
  amount: number; // 200
  isPaid: boolean;
  paidDate?: string;
  paidDay?: number;
  isOnTime?: boolean; // día <= 5
  pointsAwarded?: number; // +1 si puntual, -1 si tardío
}

export interface MonthlyRentSummary {
  monthStr: string; // "2026-09"
  monthName: string; // "Septiembre 2026"
  totalRent: number; // 600
  rentPerPerson: number; // 200
  paidCount: number; // 0 a 3
  totalCollected: number; // 0 a 600
  deadlineDay: number; // 5
  isDeadlinePassed: boolean;
  flatmateStatuses: FlatmateRentStatus[];
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function getMonthDisplayName(monthStr: string): string {
  try {
    const [year, month] = monthStr.split("-").map(Number);
    if (!year || !month) return monthStr;
    return `${MONTH_NAMES[month - 1]!} ${year}`;
  } catch {
    return monthStr;
  }
}

export function getCurrentMonthStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export const rentService = {
  /**
   * Obtiene el estado del alquiler mensual para cada compañero
   */
  getMonthlyRentStatus(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    monthStr: string = getCurrentMonthStr(),
    expenses?: ExpenseItem[]
  ): MonthlyRentSummary {
    const storageKey = `pisopro_rent_${householdId}_${monthStr}`;
    let savedRecords: Record<string, { paidDate: string; pointsAwarded: number }> = {};

    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) savedRecords = JSON.parse(raw);
      } catch {
        savedRecords = {};
      }
    }

    // Sincronización en tiempo real desde Supabase expenses (rent_payment)
    if (expenses && expenses.length > 0) {
      expenses.forEach((e) => {
        if (
          e.category === "rent_payment" &&
          e.notes?.startsWith(`rent_paid:${monthStr}:`)
        ) {
          const parts = e.notes.split(":");
          const userId = parts[2];
          const paidDate = parts[3] || e.date || "";
          const points = Number(parts[4]) || 0;
          if (userId && !savedRecords[userId]) {
            savedRecords[userId] = { paidDate, pointsAwarded: points };
          }
        }
      });
    }

    const today = new Date();
    const currentMonthStr = getCurrentMonthStr(today);
    const isCurrentMonth = monthStr === currentMonthStr;
    const isDeadlinePassed = isCurrentMonth ? today.getDate() > 5 : true;

    const statuses: FlatmateRentStatus[] = FLATMATES.map((f) => {
      const record = savedRecords[f.id];
      if (record) {
        const paidDate = record.paidDate;
        const paidDay = new Date(paidDate).getDate();
        const isOnTime = paidDay <= 5;
        return {
          userId: f.id,
          userName: f.name,
          amount: RENT_PER_FLATMATE,
          isPaid: true,
          paidDate,
          paidDay,
          isOnTime,
          pointsAwarded: record.pointsAwarded,
        };
      }

      return {
        userId: f.id,
        userName: f.name,
        amount: RENT_PER_FLATMATE,
        isPaid: false,
        pointsAwarded: isDeadlinePassed ? -1 : 0,
      };
    });

    const paidCount = statuses.filter((s) => s.isPaid).length;

    return {
      monthStr,
      monthName: getMonthDisplayName(monthStr),
      totalRent: TOTAL_MONTHLY_RENT,
      rentPerPerson: RENT_PER_FLATMATE,
      paidCount,
      totalCollected: paidCount * RENT_PER_FLATMATE,
      deadlineDay: 5,
      isDeadlinePassed,
      flatmateStatuses: statuses,
    };
  },

  /**
   * Alterna el estado de pago de alquiler de un compañero (1 clic: Pagado / Pendiente)
   */
  async toggleRentPayment(params: {
    householdId?: string;
    userId: string;
    monthStr: string;
  }): Promise<{ isPaid: boolean }> {
    const householdId = params.householdId || DEFAULT_HOUSEHOLD_ID;
    const current = this.getMonthlyRentStatus(householdId, params.monthStr);
    const userStat = current.flatmateStatuses.find((s) => s.userId === params.userId);

    if (userStat?.isPaid) {
      if (typeof window !== "undefined") {
        try {
          const storageKey = `pisopro_rent_${householdId}_${params.monthStr}`;
          const raw = localStorage.getItem(storageKey);
          const records = raw ? JSON.parse(raw) : {};
          delete records[params.userId];
          localStorage.setItem(storageKey, JSON.stringify(records));
          window.dispatchEvent(new CustomEvent("pisopro-rent-updated"));
        } catch (err) {
          console.error("[rentService] Error toggling rent status:", err);
        }
      }

      // Eliminar registro de rent_payment en Supabase si existe
      try {
        const allExp = await expensesService.getExpenses(householdId);
        const match = allExp.find(
          (e) =>
            e.category === "rent_payment" &&
            e.notes?.startsWith(`rent_paid:${params.monthStr}:${params.userId}`)
        );
        if (match) {
          await expensesService.deleteExpense(match.id);
        }
      } catch {
        // ignore
      }

      return { isPaid: false };
    } else {
      await this.recordRentPayment({
        householdId,
        userId: params.userId,
        monthStr: params.monthStr,
      });
      return { isPaid: true };
    }
  },

  /**
   * Registra el pago del alquiler de un compañero y aplica la regla de puntos
   * (+1 si se paga en los días 1-5; -1 si se retrasa después del día 5)
   */
  async recordRentPayment(params: {
    householdId?: string;
    userId: string;
    monthStr: string;
    paidDate?: string;
  }): Promise<{ success: boolean; pointsAwarded: number; isOnTime: boolean }> {
    const householdId = params.householdId || DEFAULT_HOUSEHOLD_ID;
    const paidDate = params.paidDate || new Date().toISOString().split("T")[0]!;
    const paidDay = new Date(paidDate).getDate();
    const isOnTime = paidDay <= 5;
    const pointsAwarded = isOnTime ? 1 : -1;

    const flatmate = FLATMATES.find((f) => f.id === params.userId);
    const userName = flatmate?.name || "Compañero";
    const monthName = getMonthDisplayName(params.monthStr);

    // 1. Guardar en almacenamiento local resiliente
    if (typeof window !== "undefined") {
      try {
        const storageKey = `pisopro_rent_${householdId}_${params.monthStr}`;
        const raw = localStorage.getItem(storageKey);
        const records = raw ? JSON.parse(raw) : {};
        records[params.userId] = { paidDate, pointsAwarded };
        localStorage.setItem(storageKey, JSON.stringify(records));
        window.dispatchEvent(new CustomEvent("pisopro-rent-updated"));
      } catch (err) {
        console.error("[rentService] Error saving rent payment locally:", err);
      }
    }

    // 2. Registrar en expenses de Supabase para sincronización en tiempo real entre todos los dispositivos
    try {
      await expensesService.createExpense({
        household_id: householdId,
        description: `Pago alquiler ${monthName} - ${userName}`,
        amount: RENT_PER_FLATMATE,
        paid_by: params.userId,
        category: "rent_payment",
        notes: `rent_paid:${params.monthStr}:${params.userId}:${paidDate}:${pointsAwarded}`,
        date: paidDate,
        participantUserIds: [params.userId],
      });
    } catch (err) {
      console.warn("[rentService] Error syncing rent payment to Supabase expenses:", err);
    }

    // 2. Registrar transacción de puntos en base de datos
    try {
      const supabase = getSupabaseBrowserClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("point_transactions").insert({
        household_id: householdId,
        user_id: params.userId,
        points: pointsAwarded,
        type: "admin_adjustment",
        description: isOnTime
          ? `Alquiler puntual de ${monthName}`
          : `Penalización: Retraso alquiler ${monthName}`,
      });
    } catch (err) {
      console.warn("[rentService] Error inserting point transaction:", err);
    }

    // 3. Enviar mensaje informativo al Chat del Piso
    try {
      const pointsMsg = isOnTime
        ? "(+1 pt de convivencia por puntualidad)"
        : "(-1 pt de convivencia por retraso tras el día 5)";

      await chatService.sendMessage({
        household_id: householdId,
        user_id: params.userId,
        content: `[ALQUILER] ${userName} ha registrado el pago de su cuota de alquiler de ${monthName} (200 €). ${pointsMsg}`,
      });
    } catch (err) {
      console.warn("[rentService] Error sending chat message:", err);
    }

    // 4. Emitir notificación
    try {
      const notifTitle = isOnTime
        ? `+1 pt: Alquiler de ${monthName} pagado a tiempo`
        : `-1 pt: Alquiler de ${monthName} pagado fuera de plazo`;

      const notifBody = isOnTime
        ? `${userName} ha abonado los 200 € de alquiler dentro de los 5 primeros días del mes.`
        : `${userName} ha abonado el alquiler tras el día 5 límite del mes.`;

      await notificationService.dispatchNotification({
        type: "expense_notice",
        title: notifTitle,
        body: notifBody,
        householdId,
        actorUserId: params.userId,
        actorName: userName,
        data: { url: "/gastos", monthStr: params.monthStr },
      });
    } catch (err) {
      console.warn("[rentService] Error dispatching notification:", err);
    }

    return { success: true, pointsAwarded, isOnTime };
  },

  /**
   * Envía un recordatorio formal al chat y a notificaciones
   * avisando a los compañeros que aún no han pagado su alquiler
   */
  async sendRentPaymentReminder(
    householdId: string = DEFAULT_HOUSEHOLD_ID,
    monthStr: string = getCurrentMonthStr()
  ): Promise<boolean> {
    const status = this.getMonthlyRentStatus(householdId, monthStr);
    const pending = status.flatmateStatuses.filter((s) => !s.isPaid);

    if (pending.length === 0) return false;

    const pendingNames = pending.map((s) => s.userName).join(", ");
    const monthName = status.monthName;

    // 1. Mensaje en chat
    try {
      await chatService.sendMessage({
        household_id: householdId,
        user_id: FLATMATES[0]!.id, // Emitido en nombre del piso/admin
        content: `[AVISO DE ALQUILER] Recordatorio de pago de la mensualidad de ${monthName} (200 €/persona). Pendientes por abonar: ${pendingNames}. Recordad que pagar antes del día 5 suma +1 pt, tras el día 5 penaliza con -1 pt.`,
      });
    } catch (err) {
      console.warn("[rentService] Error sending reminder to chat:", err);
    }

    // 2. Notificación a los compañeros
    try {
      await notificationService.dispatchNotification({
        type: "expense_notice",
        title: `Recordatorio de alquiler: ${monthName}`,
        body: `Faltan por abonar su parte (200 €): ${pendingNames}. Plazo bonificado: días 1 al 5.`,
        householdId,
        data: { url: "/gastos", monthStr },
      });
    } catch (err) {
      console.warn("[rentService] Error dispatching reminder notification:", err);
    }

    return true;
  },
};
