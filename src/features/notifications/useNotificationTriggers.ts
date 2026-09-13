"use client";

import { useEffect, useRef } from "react";
import { notificationService } from "./notificationService";
import { getIsoWeekMonday } from "@/services/cleaningService";
import { DEFAULT_HOUSEHOLD_ID } from "@/lib/constants";
import type { ZoneAssignment, CleaningLottery } from "@/types";

interface FlatmatePointItem {
  id: string;
  name: string;
  points: number;
}

interface NotificationTriggersProps {
  currentUser: { id: string; name: string; role?: string } | null;
  myAssignedZone?: ZoneAssignment | null;
  lottery?: CleaningLottery | null;
  flatmatePoints?: FlatmatePointItem[];
}

export function useNotificationTriggers({
  currentUser,
  myAssignedZone,
  lottery,
  flatmatePoints,
}: NotificationTriggersProps) {
  const previousPointsRef = useRef<Map<string, number> | null>(null);
  const isInitialRankCheck = useRef(true);

  // ---------------------------------------------------------------------------
  // 1. TRIGGER: Nueva Semana y Asignación de Zona
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !myAssignedZone || !lottery) return;

    const currentWeek = getIsoWeekMonday();
    const storageKey = `pisopro_week_notified_${currentUser.id}_${currentWeek}`;

    try {
      const alreadyNotified = localStorage.getItem(storageKey);
      if (!alreadyNotified && myAssignedZone.assigned_user_id === currentUser.id) {
        localStorage.setItem(storageKey, "true");

        void notificationService.dispatchNotification({
          type: "weekly_zone",
          title: "🧹 Nueva semana de limpieza",
          body: `¡Hola ${currentUser.name}! Esta semana te toca limpiar: ${myAssignedZone.zone_name}. ¡A por ella!`,
          householdId: DEFAULT_HOUSEHOLD_ID,
          targetUserId: currentUser.id,
          actorUserId: currentUser.id,
          actorName: currentUser.name,
          data: {
            url: "/tareas",
            zoneName: myAssignedZone.zone_name,
            weekStart: currentWeek,
          },
        });
      }
    } catch {
      // ignore
    }
  }, [currentUser, myAssignedZone, lottery]);

  // ---------------------------------------------------------------------------
  // 2. TRIGGER: Superación en el Ranking de Puntos
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!currentUser || !flatmatePoints || flatmatePoints.length === 0) return;

    const currentScores = new Map<string, number>();
    flatmatePoints.forEach((f) => currentScores.set(f.id, f.points));

    const currentWeek = getIsoWeekMonday();
    const rankStorageKey = `pisopro_last_ranking_${currentWeek}`;

    // En el primer renderizado, cargar desde memoria o localStorage para no lanzar avisos falsos al recargar
    if (isInitialRankCheck.current) {
      isInitialRankCheck.current = false;
      try {
        const stored = localStorage.getItem(rankStorageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, number>;
          const map = new Map<string, number>();
          Object.entries(parsed).forEach(([k, v]) => map.set(k, v));
          previousPointsRef.current = map;
        } else {
          previousPointsRef.current = currentScores;
          const obj: Record<string, number> = {};
          currentScores.forEach((v, k) => (obj[k] = v));
          localStorage.setItem(rankStorageKey, JSON.stringify(obj));
        }
      } catch {
        previousPointsRef.current = currentScores;
      }
      return;
    }

    const prevScores = previousPointsRef.current;
    if (!prevScores) {
      previousPointsRef.current = currentScores;
      return;
    }

    // Comprobar si algún compañero aumentó puntos y adelantó a otro
    flatmatePoints.forEach((actor) => {
      const prevActorPoints = prevScores.get(actor.id) ?? 0;
      const currActorPoints = actor.points;

      // Solo si sus puntos han aumentado
      if (currActorPoints > prevActorPoints) {
        flatmatePoints.forEach((other) => {
          if (other.id === actor.id) return;

          const prevOtherPoints = prevScores.get(other.id) ?? 0;
          const currOtherPoints = other.points;

          // Si antes actor estaba por detrás o empatado y ahora ha superado a other
          if (prevActorPoints <= prevOtherPoints && currActorPoints > currOtherPoints) {
            const isActorCurrent = actor.id === currentUser.id;
            const isOvertakenCurrent = other.id === currentUser.id;

            let title: string;
            let body: string;

            if (isOvertakenCurrent) {
              title = `⚡ ¡${actor.name} te ha superado!`;
              body = `${actor.name} te ha adelantado en el ranking de convivencia con ${currActorPoints} puntos.`;
            } else if (isActorCurrent) {
              title = `🏆 ¡Has superado a ${other.name}!`;
              body = `¡Enhorabuena! Has adelantado a ${other.name} con tus ${currActorPoints} puntos de convivencia.`;
            } else {
              title = `🏆 Adelantamiento en el ranking`;
              body = `${actor.name} ha superado a ${other.name} alcanzando ${currActorPoints} puntos de convivencia.`;
            }

            void notificationService.dispatchNotification({
              type: "leaderboard_overtake",
              title,
              body,
              householdId: DEFAULT_HOUSEHOLD_ID,
              actorUserId: actor.id,
              actorName: actor.name,
              data: {
                url: "/",
                overtakerName: actor.name,
                overtakenName: other.name,
                points: currActorPoints,
              },
            });
          }
        });
      }
    });

    // Actualizar referencia y almacenamiento
    previousPointsRef.current = currentScores;
    try {
      const obj: Record<string, number> = {};
      currentScores.forEach((v, k) => (obj[k] = v));
      localStorage.setItem(rankStorageKey, JSON.stringify(obj));
    } catch {
      // ignore
    }
  }, [currentUser, flatmatePoints]);
}
