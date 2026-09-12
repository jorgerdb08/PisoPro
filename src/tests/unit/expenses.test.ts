import { describe, it, expect } from "vitest";
import {
  calculateNetBalances,
  minimizeDebts,
  getUserBalanceSummary,
  type ExpenseItem,
} from "@/features/expenses/calculations";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

describe("Expenses Calculations & Debt Minimization", () => {
  const jorgeId = "22222222-2222-4222-8222-222222222222";
  const samuelId = "33333333-3333-4333-8333-333333333333";
  const davidId = "44444444-4444-4444-8444-444444444444";
  const flatmateIds = [jorgeId, samuelId, davidId];

  describe("calculateNetBalances", () => {
    it("computes net balances correctly for a single shared expense", () => {
      // Jorge pays 30€ divided equally among Jorge, Samuel, David (10€ each)
      const mockExpenses: ExpenseItem[] = [
        {
          id: "e1",
          household_id: "h1",
          description: "Compra Mercadona",
          amount: 30,
          paid_by: jorgeId,
          date: "2026-09-12",
          participants: [
            { user_id: jorgeId, share_amount: 10 },
            { user_id: samuelId, share_amount: 10 },
            { user_id: davidId, share_amount: 10 },
          ],
        },
      ];

      const balances = calculateNetBalances(mockExpenses, flatmateIds);

      expect(balances[jorgeId]).toBe(20); // paid 30 - consumed 10 = +20
      expect(balances[samuelId]).toBe(-10); // consumed 10 = -10
      expect(balances[davidId]).toBe(-10); // consumed 10 = -10

      // Zero-sum property
      const sum = Object.values(balances).reduce((acc, val) => acc + val, 0);
      expect(Math.abs(sum)).toBeLessThan(0.001);
    });

    it("computes net balances accurately with multiple cross-expenses", () => {
      // Expense 1: Jorge pays 30€ (10€ each)
      // Expense 2: Samuel pays 30€ (10€ each)
      const mockExpenses: ExpenseItem[] = [
        {
          id: "e1",
          household_id: "h1",
          description: "Mercadona",
          amount: 30,
          paid_by: jorgeId,
          date: "2026-09-12",
          participants: [
            { user_id: jorgeId, share_amount: 10 },
            { user_id: samuelId, share_amount: 10 },
            { user_id: davidId, share_amount: 10 },
          ],
        },
        {
          id: "e2",
          household_id: "h1",
          description: "Internet",
          amount: 30,
          paid_by: samuelId,
          date: "2026-09-12",
          participants: [
            { user_id: jorgeId, share_amount: 10 },
            { user_id: samuelId, share_amount: 10 },
            { user_id: davidId, share_amount: 10 },
          ],
        },
      ];

      const balances = calculateNetBalances(mockExpenses, flatmateIds);

      expect(balances[jorgeId]).toBe(10); // +20 - 10 = +10
      expect(balances[samuelId]).toBe(10); // -10 + 20 = +10
      expect(balances[davidId]).toBe(-20); // -10 - 10 = -20
    });
  });

  describe("minimizeDebts Algorithm", () => {
    it("minimizes triangular debt into a single direct transfer", () => {
      // Samuel net = -15 (owes 15)
      // Jorge net = 0
      // David net = +15 (is owed 15)
      // Result: Samuel pays David 15 directly
      const balances = {
        [samuelId]: -15,
        [jorgeId]: 0,
        [davidId]: 15,
      };

      const transfers = minimizeDebts(balances);

      expect(transfers.length).toBe(1);
      expect(transfers[0]).toEqual({
        fromUserId: samuelId,
        toUserId: davidId,
        amount: 15,
      });
    });

    it("splits a single debtor across multiple creditors efficiently", () => {
      // David owes 20€ total
      // Jorge is owed 10€, Samuel is owed 10€
      const balances = {
        [davidId]: -20,
        [jorgeId]: 10,
        [samuelId]: 10,
      };

      const transfers = minimizeDebts(balances);

      expect(transfers.length).toBe(2);
      expect(transfers.every((t) => t.fromUserId === davidId)).toBe(true);
      const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);
      expect(totalTransferred).toBe(20);
    });

    it("returns empty array when all balances are 0", () => {
      const balances = {
        [jorgeId]: 0,
        [samuelId]: 0,
        [davidId]: 0,
      };

      const transfers = minimizeDebts(balances);
      expect(transfers.length).toBe(0);
    });
  });

  describe("getUserBalanceSummary", () => {
    it("calculates personal summary correctly for a creditor", () => {
      const balances = { [jorgeId]: 20, [samuelId]: -10, [davidId]: -10 };
      const transfers = [
        { fromUserId: samuelId, toUserId: jorgeId, amount: 10 },
        { fromUserId: davidId, toUserId: jorgeId, amount: 10 },
      ];

      const summary = getUserBalanceSummary(jorgeId, balances, transfers);

      expect(summary.netBalance).toBe(20);
      expect(summary.totalOwedByMe).toBe(0);
      expect(summary.totalOwedToMe).toBe(20);
    });

    it("calculates personal summary correctly for a debtor", () => {
      const balances = { [jorgeId]: 20, [samuelId]: -10, [davidId]: -10 };
      const transfers = [
        { fromUserId: samuelId, toUserId: jorgeId, amount: 10 },
        { fromUserId: davidId, toUserId: jorgeId, amount: 10 },
      ];

      const summary = getUserBalanceSummary(samuelId, balances, transfers);

      expect(summary.netBalance).toBe(-10);
      expect(summary.totalOwedByMe).toBe(10);
      expect(summary.totalOwedToMe).toBe(0);
    });
  });

  describe("EXPENSE_CATEGORIES", () => {
    it("defines valid categories with icons and styles", () => {
      expect(EXPENSE_CATEGORIES.length).toBeGreaterThanOrEqual(6);
      EXPENSE_CATEGORIES.forEach((c) => {
        expect(c.value).toBeDefined();
        expect(c.label).toBeDefined();
        expect(c.icon).toBeDefined();
        expect(c.color).toBeDefined();
      });
    });
  });
});
