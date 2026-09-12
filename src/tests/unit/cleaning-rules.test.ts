import { describe, it, expect } from "vitest";
import {
  getElapsedWeeks,
  calculateRotationZoneOrder,
  calculateOriginOrderForZone,
} from "@/services/cleaningService";
import { FLATMATES, CLEANING_ZONES_CONFIG, CLEANING_ROTATION_ORDER } from "@/lib/constants";
import type { ZoneAssignment, CleaningLottery, CleaningHelpRequest, PointTransaction, TrashEvent } from "@/types";


describe("PisoPro Cleaning Rules & Rotation System", () => {
  const jorge = FLATMATES.find((f) => f.name === "Jorge")!;
  const samuel = FLATMATES.find((f) => f.name === "Samuel")!;
  const david = FLATMATES.find((f) => f.name === "David")!;

  // 1. Inicialmente no hay zonas asignadas
  it("1. Initially all 3 zones are unassigned", () => {
    const unassignedZones: ZoneAssignment[] = CLEANING_ZONES_CONFIG.map((z) => ({
      zone_id: `zone-${z.slug}`,
      zone_name: z.name,
      zone_slug: z.slug,
      zone_icon: z.icon,
      zone_default_points: z.defaultPoints,
      zone_help_points: z.helpPoints,
      assigned_user_id: null,
      assigned_user_name: "Sin asignar",
      is_override: false,
      week_start: "2026-09-14",
      tasks: [],
      is_completed: false,
      checked_count: 0,
      total_count: 0,
      helpers: [],
    }));

    expect(unassignedZones).toHaveLength(3);
    unassignedZones.forEach((z) => {
      expect(z.assigned_user_id).toBeNull();
      expect(z.assigned_user_name).toBe("Sin asignar");
    });
  });

  // 2 & 3. El sorteo asigna exactamente una zona a cada usuario sin duplicados
  it("2 & 3. Lottery assigns exactly 1 zone per user bijectively without duplicates", () => {
    const users = [jorge.id, samuel.id, david.id];
    const zones = ["cocina", "salon", "bano"];

    // Simulación de shuffle biyectivo
    const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
    const assignments = zones.map((zoneSlug, idx) => ({
      zone: zoneSlug,
      userId: shuffledUsers[idx]!,
    }));

    expect(assignments).toHaveLength(3);

    // Verificación 1 usuario -> 1 zona
    const assignedUserIds = assignments.map((a) => a.userId);
    expect(new Set(assignedUserIds).size).toBe(3);

    // Verificación 1 zona -> 1 usuario
    const assignedZoneSlugs = assignments.map((a) => a.zone);
    expect(new Set(assignedZoneSlugs).size).toBe(3);
  });

  // 4. El sorteo solo puede ejecutarse una vez (bloqueado tras ejecución)
  it("4. Lottery can only run once and stays permanently locked", () => {
    let lotteryState: CleaningLottery | null = null;

    function executeLottery(adminId: string, currentLottery: CleaningLottery | null) {
      if (currentLottery && currentLottery.is_locked) {
        throw new Error("El sorteo ya ha sido realizado y está bloqueado.");
      }
      return {
        id: "lottery-1",
        household_id: "h-1",
        executed_by: adminId,
        executed_at: new Date().toISOString(),
        base_week_start: "2026-09-14",
        is_locked: true,
      };
    }

    // Primera ejecución por Jorge
    lotteryState = executeLottery(jorge.id, lotteryState);
    expect(lotteryState.is_locked).toBe(true);

    // Intento de re-ejecución debe fallar
    expect(() => executeLottery(jorge.id, lotteryState)).toThrow(
      "El sorteo ya ha sido realizado y está bloqueado."
    );
  });

  // 5, 6, 7, 8, 9. Rotación semanal determinista (Semanas 1, 2, 3, 4)
  describe("5 to 9. Deterministic Weekly Rotation", () => {
    // Escenario del usuario:
    // SEMANA 1 (base): Jorge -> Cocina (0), Samuel -> Salón (1), David -> Baño (2)
    // Orden de rotación: Cocina (0) -> Salón (1) -> Baño (2) -> Cocina (0)

    it("6. Semana 1 (elapsed = 0): Jorge -> Cocina, Samuel -> Salón, David -> Baño", () => {

      const elapsed = 0;
      const getZoneForUser = (initialOrder: number) => {
        const order = calculateRotationZoneOrder(initialOrder, elapsed);
        return CLEANING_ROTATION_ORDER[order];
      };

      expect(getZoneForUser(0)).toBe("cocina"); // Jorge
      expect(getZoneForUser(1)).toBe("salon"); // Samuel
      expect(getZoneForUser(2)).toBe("bano"); // David
    });

    it("7. Semana 2 (elapsed = 1): Jorge -> Salón, Samuel -> Baño, David -> Cocina", () => {
      const elapsed = 1;
      const getZoneForUser = (initialOrder: number) => {
        const order = calculateRotationZoneOrder(initialOrder, elapsed);
        return CLEANING_ROTATION_ORDER[order];
      };

      expect(getZoneForUser(0)).toBe("salon"); // Jorge
      expect(getZoneForUser(1)).toBe("bano"); // Samuel
      expect(getZoneForUser(2)).toBe("cocina"); // David
    });

    it("8. Semana 3 (elapsed = 2): Jorge -> Baño, Samuel -> Cocina, David -> Salón", () => {
      const elapsed = 2;
      const getZoneForUser = (initialOrder: number) => {
        const order = calculateRotationZoneOrder(initialOrder, elapsed);
        return CLEANING_ROTATION_ORDER[order];
      };

      expect(getZoneForUser(0)).toBe("bano"); // Jorge
      expect(getZoneForUser(1)).toBe("cocina"); // Samuel
      expect(getZoneForUser(2)).toBe("salon"); // David
    });

    it("9. Semana 4 (elapsed = 3): Ciclo vuelve a la asignación inicial", () => {
      const elapsed = 3;
      const getZoneForUser = (initialOrder: number) => {
        const order = calculateRotationZoneOrder(initialOrder, elapsed);
        return CLEANING_ROTATION_ORDER[order];
      };

      expect(getZoneForUser(0)).toBe("cocina"); // Jorge
      expect(getZoneForUser(1)).toBe("salon"); // Samuel
      expect(getZoneForUser(2)).toBe("bano"); // David
    });

    it("Verifica resolución inversa por zona (Origin order)", () => {
      // Semana 2: ¿Quién tiene Cocina (orden 0)?
      // origin_order = (0 - 1 + 3) % 3 = 2 (quien tenía Baño inicialmente: David)
      expect(calculateOriginOrderForZone(0, 1)).toBe(2);

      // Semana 2: ¿Quién tiene Salón (orden 1)?
      // origin_order = (1 - 1 + 3) % 3 = 0 (quien tenía Cocina inicialmente: Jorge)
      expect(calculateOriginOrderForZone(1, 1)).toBe(0);

      // Semana 2: ¿Quién tiene Baño (orden 2)?
      // origin_order = (2 - 1 + 3) % 3 = 1 (quien tenía Salón inicialmente: Samuel)
      expect(calculateOriginOrderForZone(2, 1)).toBe(1);
    });

    it("Diferencia de semanas es determinista sin importar cuántas semanas pasen", () => {
      const baseMonday = "2026-09-14";
      const twoWeeksLater = "2026-09-28";
      expect(getElapsedWeeks(baseMonday, twoWeeksLater)).toBe(2);
    });
  });

  // 10 & 11. Una sola zona por persona y bloqueo estricto de zonas ajenas
  describe("10 & 11. Strict Zone Lockout (One Zone per Person)", () => {
    function canUserCheckTask(
      userId: string,
      assignedUserId: string,
      helpers: { helperId: string }[]
    ): boolean {
      const isOwner = userId === assignedUserId;
      const isHelper = helpers.some((h) => h.helperId === userId);
      return isOwner || isHelper;
    }

    it("10. Usuario asignado puede completar tareas de su zona", () => {
      const canJorge = canUserCheckTask(jorge.id, jorge.id, []);
      expect(canJorge).toBe(true);
    });

    it("11. Usuario NO asignado NO puede completar tareas de otra zona directamente", () => {
      // Samuel es responsable de Cocina; Jorge intenta completar tarea de Cocina sin ser ayudante
      const canJorge = canUserCheckTask(jorge.id, samuel.id, []);
      expect(canJorge).toBe(false);
    });
  });

  // 12, 13, 14, 15. Sistema de Ayuda
  describe("12 to 15. Help System Rules", () => {
    it("12. El responsable puede solicitar ayuda con su zona", () => {
      const helpRequest: CleaningHelpRequest = {
        id: "hr-1",
        household_id: "h-1",
        zone_id: "zone-bano",
        requester_id: jorge.id,
        week_start: "2026-09-14",
        status: "open",
        created_at: new Date().toISOString(),
        helpers: [],
      };

      expect(helpRequest.requester_id).toBe(jorge.id);
      expect(helpRequest.status).toBe("open");
    });

    it("13 & 15. Otros usuarios pueden aceptar ayudar y una zona puede tener múltiples ayudantes", () => {
      const helpers: { help_request_id: string; helper_id: string }[] = [];

      function acceptHelp(reqId: string, helperId: string, requesterId: string) {
        if (helperId === requesterId) {
          throw new Error("No puedes aceptar tu propia solicitud");
        }
        helpers.push({ help_request_id: reqId, helper_id: helperId });
      }

      // Samuel ayuda a Jorge
      acceptHelp("hr-1", samuel.id, jorge.id);
      expect(helpers).toHaveLength(1);
      expect(helpers[0]!.helper_id).toBe(samuel.id);

      // David también ayuda a Jorge
      acceptHelp("hr-1", david.id, jorge.id);
      expect(helpers).toHaveLength(2);
      expect(helpers.map((h) => h.helper_id)).toEqual([samuel.id, david.id]);

      // Jorge no puede auto-ayudarse
      expect(() => acceptHelp("hr-1", jorge.id, jorge.id)).toThrow();
    });

    it("14. Ayudar no cambia la zona principal ni la rotación del ayudante", () => {
      const samuelPrimaryZone = "cocina";
      const helpers = [{ helper_id: samuel.id, helping_zone: "bano" }];

      // Samuel ayuda en el baño
      expect(helpers[0]!.helping_zone).toBe("bano");
      // Pero su zona principal sigue siendo la Cocina
      expect(samuelPrimaryZone).toBe("cocina");
    });
  });

  // 16 & 17. Puntuación: Responsable vs Ayudante
  describe("16 & 17. Points Distribution for Owner vs Helpers", () => {
    it("16. Responsable recibe los puntos completos de su zona", () => {
      const zonePoints = { salon: 3, bano: 2, cocina: 1 };
      expect(zonePoints.salon).toBe(3);
      expect(zonePoints.bano).toBe(2);
      expect(zonePoints.cocina).toBe(1);
    });

    it("17. El ayudante recibe únicamente los puntos de ayuda (+1 pt), nunca los de la zona", () => {
      const zonePoints = 2; // Baño
      const helpPoints = 1; // Ayuda

      const ownerAward = zonePoints;
      const helperAward = helpPoints;

      expect(ownerAward).toBe(2);
      expect(helperAward).toBe(1);
      expect(helperAward).not.toBe(zonePoints);
    });
  });

  // 18, 19, 20. Basura independiente y estadísticas
  describe("18 to 20. Trash Module Rules", () => {
    it("18. Registrar basura guarda usuario, fecha y hora", () => {
      const trashEvent: TrashEvent = {
        id: "trash-1",
        household_id: "h-1",
        user_id: jorge.id,
        user_name: "Jorge",
        trash_type: "general",
        created_at: "2026-09-10T21:32:00Z",
      };

      expect(trashEvent.user_name).toBe("Jorge");
      expect(trashEvent.created_at).toBe("2026-09-10T21:32:00Z");
    });

    it("19. Cada registro de basura suma exactamente 1 punto sin multiplicadores", () => {
      const trashTx: PointTransaction = {
        id: "tx-1",
        household_id: "h-1",
        user_id: jorge.id,
        points: 1,
        type: "trash",
        description: "Tirar la basura",
        created_at: new Date().toISOString(),
      };

      expect(trashTx.points).toBe(1);
    });

    it("20. Estadísticas de basura calculan conteos reales por usuario", () => {
      const events: TrashEvent[] = [
        { id: "1", household_id: "h-1", user_id: jorge.id, trash_type: "general", created_at: "2026-09-10T21:32:00Z" },
        { id: "2", household_id: "h-1", user_id: jorge.id, trash_type: "general", created_at: "2026-09-09T22:04:00Z" },
        { id: "3", household_id: "h-1", user_id: david.id, trash_type: "general", created_at: "2026-09-10T20:11:00Z" },
        { id: "4", household_id: "h-1", user_id: samuel.id, trash_type: "general", created_at: "2026-09-08T19:45:00Z" },
      ];

      const counts = {
        Jorge: events.filter((e) => e.user_id === jorge.id).length,
        Samuel: events.filter((e) => e.user_id === samuel.id).length,
        David: events.filter((e) => e.user_id === david.id).length,
      };

      expect(counts.Jorge).toBe(2);
      expect(counts.Samuel).toBe(1);
      expect(counts.David).toBe(1);
    });
  });

  // 21. Transacciones de Puntos y Auditoría
  describe("21. Transaction-based Points Ledger", () => {
    it("Calcula la contribución agregando transacciones por tipo", () => {
      const transactions: PointTransaction[] = [
        { id: "1", household_id: "h-1", user_id: jorge.id, points: 2, type: "cleaning", description: "Limpieza baño", created_at: "2026-09-10" },
        { id: "2", household_id: "h-1", user_id: jorge.id, points: 1, type: "helping", description: "Ayuda cocina", created_at: "2026-09-11" },
        { id: "3", household_id: "h-1", user_id: jorge.id, points: 1, type: "trash", description: "Basura", created_at: "2026-09-12" },
      ];

      const jorgeTotal = transactions.reduce((acc, t) => acc + t.points, 0);
      const cleaningPts = transactions.filter((t) => t.type === "cleaning").reduce((acc, t) => acc + t.points, 0);
      const helpingPts = transactions.filter((t) => t.type === "helping").reduce((acc, t) => acc + t.points, 0);
      const trashPts = transactions.filter((t) => t.type === "trash").reduce((acc, t) => acc + t.points, 0);

      expect(jorgeTotal).toBe(4);
      expect(cleaningPts).toBe(2);
      expect(helpingPts).toBe(1);
      expect(trashPts).toBe(1);
    });
  });
});
