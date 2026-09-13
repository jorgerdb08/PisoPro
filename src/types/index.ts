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

// ==============================================================================
// SISTEMA DE LIMPIEZA, ROTACIÓN, AYUDA, BASURA Y PUNTOS
// ==============================================================================

export type CleaningZoneSlug = "salon" | "bano" | "cocina";

export interface CleaningZone {
  id: string;
  household_id: string;
  slug: CleaningZoneSlug;
  name: string;
  icon: string;
  default_points: number;
  help_points: number;
  rotation_order: number; // 0=cocina, 1=salon, 2=bano
  created_at: string;
  updated_at: string;
}

export interface CleaningTask {
  id: string;
  zone_id: string;
  title: string;
  order_index: number;
  created_at: string;
  is_checked?: boolean;
  completed_by?: string;
  completed_at?: string;
}

export interface CleaningLottery {
  id: string;
  household_id: string;
  executed_by: string;
  executed_at: string;
  base_week_start: string;
  is_locked: boolean;
}

export interface InitialZoneAssignment {
  id: string;
  lottery_id: string;
  user_id: string;
  zone_id: string;
}

export interface CleaningAssignmentOverride {
  id: string;
  household_id: string;
  week_start: string;
  user_id: string;
  zone_id: string;
  assigned_by: string;
  previous_zone_id?: string;
  reason?: string;
  created_at: string;
}

export interface CleaningHelpRequest {
  id: string;
  household_id: string;
  zone_id: string;
  zone_name?: string;
  zone_icon?: string;
  requester_id: string;
  requester_name?: string;
  week_start: string;
  status: "open" | "completed" | "cancelled";
  created_at: string;
  helpers?: CleaningHelper[];
}

export interface CleaningHelper {
  id: string;
  help_request_id: string;
  helper_id: string;
  helper_name?: string;
  joined_at: string;
  points_awarded: number;
}

export interface CleaningCompletion {
  id: string;
  household_id: string;
  zone_id: string;
  week_start: string;
  responsible_user_id: string;
  points_awarded: number;
  completed_at: string;
}

export interface ZoneAssignment {
  zone_id: string;
  zone_name: string;
  zone_slug: CleaningZoneSlug;
  zone_icon: string;
  zone_default_points: number;
  zone_help_points: number;
  assigned_user_id: string | null;
  assigned_user_name: string;
  is_override: boolean;
  week_start: string;
  // Computed / UI properties
  tasks: CleaningTask[];
  is_completed: boolean;
  checked_count: number;
  total_count: number;
  help_request?: CleaningHelpRequest | null;
  helpers: CleaningHelper[];
}

export interface TrashEvent {
  id: string;
  household_id: string;
  user_id: string;
  user_name?: string;
  trash_type: string;
  created_at: string;
}

export type PointTransactionType = "cleaning" | "helping" | "trash" | "admin_adjustment";

export interface PointTransaction {
  id: string;
  household_id: string;
  user_id: string;
  user_name?: string;
  points: number;
  type: PointTransactionType;
  reference_id?: string;
  description: string;
  created_at: string;
}

export interface UserContributionStats {
  user_id: string;
  user_name: "Jorge" | "Samuel" | "David";
  cleaning_points: number;
  helping_points: number;
  trash_points: number;
  total_points: number;
  zones_completed: number;
  helps_given: number;
  trash_count: number;
}

export interface TrashUserStats {
  user_id: string;
  user_name: "Jorge" | "Samuel" | "David";
  count: number;
}

// ==============================================================================
// SISTEMA DE NOTIFICACIONES (AVISOS DE COMPRA, RANKING, SEMANA, CHAT, GASTOS)
// ==============================================================================

export type NotificationType =
  | "shopping_alert"
  | "leaderboard_overtake"
  | "weekly_zone"
  | "chore_reminder"
  | "expense_notice"
  | "chat_mention";

export interface PisoProNotification {
  id: string;
  household_id: string;
  type: NotificationType;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
  target_user_id?: string | null; // null = para todo el piso
  actor_user_id?: string | null;
  actor_name?: string | null;
  data?: {
    url?: string;
    itemName?: string;
    overtakerName?: string;
    overtakenName?: string;
    points?: number;
    zoneName?: string;
    weekStart?: string;
    [key: string]: unknown;
  };
}


