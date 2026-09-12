import { describe, it, expect } from "vitest";
import { FLATMATES, CHORE_CATEGORIES } from "@/lib/constants";
import type { Task } from "@/types";

describe("Chores Module Logic", () => {
  const mockTasks: Task[] = [
    {
      id: "t1",
      household_id: "h1",
      title: "Limpiar baño",
      category: "bathroom",
      points: 4,
      frequency: "weekly",
      assigned_user_id: FLATMATES[0]!.id, // Jorge
      status: "pending",
      created_at: "2026-09-10T00:00:00Z",
      updated_at: "2026-09-10T00:00:00Z",
    },
    {
      id: "t2",
      household_id: "h1",
      title: "Limpiar cocina",
      category: "kitchen",
      points: 3,
      frequency: "weekly",
      assigned_user_id: FLATMATES[1]!.id, // Samuel
      status: "completed",
      created_at: "2026-09-10T00:00:00Z",
      updated_at: "2026-09-10T00:00:00Z",
    },
    {
      id: "t3",
      household_id: "h1",
      title: "Sacar basura",
      category: "trash",
      points: 1,
      frequency: "daily",
      assigned_user_id: FLATMATES[2]!.id, // David
      status: "pending",
      created_at: "2026-09-10T00:00:00Z",
      updated_at: "2026-09-10T00:00:00Z",
    },
    {
      id: "t4",
      household_id: "h1",
      title: "Ordenar salón",
      category: "living",
      points: 2,
      frequency: "weekly",
      assigned_user_id: undefined, // Sin asignar
      status: "pending",
      created_at: "2026-09-10T00:00:00Z",
      updated_at: "2026-09-10T00:00:00Z",
    },
  ];

  describe("Cyclical Rotation Algorithm", () => {
    function simulateRotation(tasks: Task[]): Task[] {
      const flatmateIds = FLATMATES.map((f) => f.id);
      return tasks.map((task) => {
        const currentIndex = task.assigned_user_id
          ? flatmateIds.indexOf(task.assigned_user_id)
          : -1;
        const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % flatmateIds.length : 0;
        return {
          ...task,
          assigned_user_id: flatmateIds[nextIndex]!,
          status: "pending",
        };
      });
    }

    it("rotates Jorge to Samuel", () => {
      const rotated = simulateRotation(mockTasks);
      expect(rotated[0]?.assigned_user_id).toBe(FLATMATES[1]!.id); // Samuel
    });

    it("rotates Samuel to David", () => {
      const rotated = simulateRotation(mockTasks);
      expect(rotated[1]?.assigned_user_id).toBe(FLATMATES[2]!.id); // David
    });

    it("rotates David back to Jorge (closing the cycle)", () => {
      const rotated = simulateRotation(mockTasks);
      expect(rotated[2]?.assigned_user_id).toBe(FLATMATES[0]!.id); // Jorge
    });

    it("assigns unassigned tasks to the first flatmate (Jorge)", () => {
      const rotated = simulateRotation(mockTasks);
      expect(rotated[3]?.assigned_user_id).toBe(FLATMATES[0]!.id);
    });

    it("resets all task statuses to 'pending' after a new rotation cycle", () => {
      const rotated = simulateRotation(mockTasks);
      expect(rotated.every((t) => t.status === "pending")).toBe(true);
    });
  });

  describe("Task Aggregations and Points", () => {
    it("filters tasks correctly by user", () => {
      const jorgeTasks = mockTasks.filter((t) => t.assigned_user_id === FLATMATES[0]!.id);
      expect(jorgeTasks.length).toBe(1);
      expect(jorgeTasks[0]?.title).toBe("Limpiar baño");
    });

    it("calculates progress percentage correctly", () => {
      const total = mockTasks.length;
      const completed = mockTasks.filter((t) => t.status === "completed").length;
      const percent = Math.round((completed / total) * 100);
      expect(percent).toBe(25); // 1 of 4 = 25%
    });

    it("calculates total points for completed chores", () => {
      const completedPoints = mockTasks
        .filter((t) => t.status === "completed")
        .reduce((sum, t) => sum + t.points, 0);
      expect(completedPoints).toBe(3);
    });
  });

  describe("Category Definitions", () => {
    it("has valid categories with labels and icons", () => {
      expect(CHORE_CATEGORIES.length).toBeGreaterThanOrEqual(5);
      CHORE_CATEGORIES.forEach((cat) => {
        expect(cat.value).toBeDefined();
        expect(cat.label).toBeDefined();
        expect(cat.icon).toBeDefined();
        expect(cat.color).toBeDefined();
      });
    });
  });
});
