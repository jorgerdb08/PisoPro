export type UserRole = "admin" | "member";

export interface Profile {
  id: string;
  name: "Jorge" | "Samuel" | "David";
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string;
  joined_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_id: string;
  last_seen: string;
  is_active: boolean;
  claimed_at: string;
}

export interface Task {
  id: string;
  household_id: string;
  title: string;
  description?: string;
  category?: string;
  points: number;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  assigned_user_id?: string;
  due_date?: string;
  status: "pending" | "completed";
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  share_amount: number;
}

export interface ShoppingItem {
  id: string;
  household_id: string;
  name: string;
  quantity: string;
  added_by: string;
  bought_by?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  household_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
