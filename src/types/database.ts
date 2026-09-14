export type Json =
  string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: "Jorge" | "Samuel" | "David";
          role: "admin" | "member";
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: "Jorge" | "Samuel" | "David";
          role?: "admin" | "member";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: "Jorge" | "Samuel" | "David";
          role?: "admin" | "member";
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      households: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      household_members: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          joined_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          session_token: string;
          last_seen: string;
          expires_at: string;
          is_active: boolean;
          claimed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          session_token: string;
          last_seen?: string;
          expires_at: string;
          is_active?: boolean;
          claimed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          session_token?: string;
          last_seen?: string;
          expires_at?: string;
          is_active?: boolean;
          claimed_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          household_id: string;
          title: string;
          description: string | null;
          category: string;
          points: number;
          frequency: "daily" | "weekly" | "biweekly" | "monthly";
          assigned_user_id: string | null;
          due_date: string | null;
          status: "pending" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          title: string;
          description?: string | null;
          category?: string;
          points?: number;
          frequency?: "daily" | "weekly" | "biweekly" | "monthly";
          assigned_user_id?: string | null;
          due_date?: string | null;
          status?: "pending" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          points?: number;
          frequency?: "daily" | "weekly" | "biweekly" | "monthly";
          assigned_user_id?: string | null;
          due_date?: string | null;
          status?: "pending" | "completed";
          created_at?: string;
          updated_at?: string;
        };
      };
      task_assignments: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          assigned_at: string;
          order_index: number;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          assigned_at?: string;
          order_index?: number;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          assigned_at?: string;
          order_index?: number;
        };
      };
      task_completions: {
        Row: {
          id: string;
          task_id: string;
          completed_by: string;
          points_awarded: number;
          notes: string | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          completed_by: string;
          points_awarded?: number;
          notes?: string | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          completed_by?: string;
          points_awarded?: number;
          notes?: string | null;
          completed_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          household_id: string;
          description: string;
          amount: number;
          paid_by: string;
          date: string;
          category: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          description: string;
          amount: number;
          paid_by: string;
          date?: string;
          category?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          description?: string;
          amount?: number;
          paid_by?: string;
          date?: string;
          category?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expense_participants: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          share_amount: number;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          share_amount: number;
        };
        Update: {
          id?: string;
          expense_id?: string;
          user_id?: string;
          share_amount?: number;
        };
      };
      shopping_items: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          quantity: string;
          added_by: string;
          bought_by: string | null;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          quantity?: string;
          added_by: string;
          bought_by?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          quantity?: string;
          added_by?: string;
          bought_by?: string | null;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
      cleaning_zones: {
        Row: {
          id: string;
          household_id: string;
          slug: "salon" | "bano" | "cocina";
          name: string;
          icon: string;
          default_points: number;
          help_points: number;
          rotation_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          slug: "salon" | "bano" | "cocina";
          name: string;
          icon: string;
          default_points: number;
          help_points?: number;
          rotation_order: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          slug?: "salon" | "bano" | "cocina";
          name?: string;
          icon?: string;
          default_points?: number;
          help_points?: number;
          rotation_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      cleaning_tasks: {
        Row: {
          id: string;
          zone_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          title: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          zone_id?: string;
          title?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      cleaning_lottery: {
        Row: {
          id: string;
          household_id: string;
          executed_by: string;
          executed_at: string;
          base_week_start: string;
          is_locked: boolean;
        };
        Insert: {
          id?: string;
          household_id: string;
          executed_by: string;
          executed_at?: string;
          base_week_start: string;
          is_locked?: boolean;
        };
        Update: {
          id?: string;
          household_id?: string;
          executed_by?: string;
          executed_at?: string;
          base_week_start?: string;
          is_locked?: boolean;
        };
      };
      initial_zone_assignments: {
        Row: {
          id: string;
          lottery_id: string;
          user_id: string;
          zone_id: string;
        };
        Insert: {
          id?: string;
          lottery_id: string;
          user_id: string;
          zone_id: string;
        };
        Update: {
          id?: string;
          lottery_id?: string;
          user_id?: string;
          zone_id?: string;
        };
      };
      cleaning_assignment_overrides: {
        Row: {
          id: string;
          household_id: string;
          week_start: string;
          user_id: string;
          zone_id: string;
          assigned_by: string;
          previous_zone_id: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          week_start: string;
          user_id: string;
          zone_id: string;
          assigned_by: string;
          previous_zone_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          week_start?: string;
          user_id?: string;
          zone_id?: string;
          assigned_by?: string;
          previous_zone_id?: string | null;
          reason?: string | null;
          created_at?: string;
        };
      };
      cleaning_weekly_task_checks: {
        Row: {
          id: string;
          task_id: string;
          week_start: string;
          completed_by: string;
          completed_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          week_start: string;
          completed_by: string;
          completed_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          week_start?: string;
          completed_by?: string;
          completed_at?: string;
        };
      };
      cleaning_completions: {
        Row: {
          id: string;
          household_id: string;
          zone_id: string;
          week_start: string;
          responsible_user_id: string;
          points_awarded: number;
          completed_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          zone_id: string;
          week_start: string;
          responsible_user_id: string;
          points_awarded?: number;
          completed_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          zone_id?: string;
          week_start?: string;
          responsible_user_id?: string;
          points_awarded?: number;
          completed_at?: string;
        };
      };
      cleaning_help_requests: {
        Row: {
          id: string;
          household_id: string;
          zone_id: string;
          requester_id: string;
          week_start: string;
          status: "open" | "completed" | "cancelled";
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          zone_id: string;
          requester_id: string;
          week_start: string;
          status?: "open" | "completed" | "cancelled";
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          zone_id?: string;
          requester_id?: string;
          week_start?: string;
          status?: "open" | "completed" | "cancelled";
          created_at?: string;
        };
      };
      cleaning_helpers: {
        Row: {
          id: string;
          help_request_id: string;
          helper_id: string;
          joined_at: string;
          points_awarded: number;
        };
        Insert: {
          id?: string;
          help_request_id: string;
          helper_id: string;
          joined_at?: string;
          points_awarded?: number;
        };
        Update: {
          id?: string;
          help_request_id?: string;
          helper_id?: string;
          joined_at?: string;
          points_awarded?: number;
        };
      };
      trash_events: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          trash_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          trash_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          trash_type?: string;
          created_at?: string;
        };
      };
      point_transactions: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          points: number;
          type: "cleaning" | "helping" | "trash" | "admin_adjustment";
          reference_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          points: number;
          type: "cleaning" | "helping" | "trash" | "admin_adjustment";
          reference_id?: string | null;
          description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          points?: number;
          type?: "cleaning" | "helping" | "trash" | "admin_adjustment";
          reference_id?: string | null;
          description?: string;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          household_id: string;
          target_user_id: string | null;
          actor_user_id: string | null;
          type: string;
          title: string;
          body: string;
          data: Json | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          target_user_id?: string | null;
          actor_user_id?: string | null;
          type: string;
          title: string;
          body: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          target_user_id?: string | null;
          actor_user_id?: string | null;
          type?: string;
          title?: string;
          body?: string;
          data?: Json | null;
          read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_profile: {
        Args: {
          p_user_id: string;
          p_device_id: string;
          p_lease_seconds?: number;
        };
        Returns: {
          success: boolean;
          session_token?: string;
          expires_at?: string;
          user_id?: string;
          error?: string;
          is_busy?: boolean;
          renewed?: boolean;
        };
      };
      heartbeat_session: {
        Args: {
          p_session_token: string;
          p_extend_seconds?: number;
        };
        Returns: {
          success: boolean;
          expires_at?: string;
          user_id?: string;
          error?: string;
        };
      };
      release_profile: {
        Args: {
          p_session_token: string;
        };
        Returns: {
          success: boolean;
        };
      };
      admin_force_release_profile: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          success: boolean;
        };
      };
      get_profiles_availability: {
        Args: {
          p_current_device_id?: string;
        };
        Returns: {
          id: string;
          name: "Jorge" | "Samuel" | "David";
          role: "admin" | "member";
          avatar_url: string | null;
          is_busy: boolean;
          is_current_device: boolean;
          last_seen: string | null;
          expires_at: string | null;
        }[];
      };
      rpc_execute_initial_lottery: {
        Args: {
          p_household_id: string;
          p_admin_id: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          lottery_id?: string;
          base_week_start?: string;
        };
      };
      rpc_get_current_zone_assignments: {
        Args: {
          p_household_id: string;
          p_target_date?: string;
        };
        Returns: {
          zone_id: string;
          zone_name: string;
          zone_slug: "salon" | "bano" | "cocina";
          zone_icon: string;
          zone_default_points: number;
          zone_help_points: number;
          assigned_user_id: string | null;
          assigned_user_name: string;
          is_override: boolean;
          week_start: string;
        }[];
      };
      rpc_toggle_cleaning_task: {
        Args: {
          p_task_id: string;
          p_user_id: string;
          p_week_start?: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          action?: "checked" | "unckecked";
          task_id?: string;
          is_completed?: boolean;
          checked_tasks?: number;
          total_tasks?: number;
        };
      };
      rpc_request_cleaning_help: {
        Args: {
          p_household_id: string;
          p_zone_id: string;
          p_user_id: string;
          p_week_start?: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          request_id?: string;
        };
      };
      rpc_accept_cleaning_help: {
        Args: {
          p_help_request_id: string;
          p_helper_id: string;
        };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
      rpc_record_trash: {
        Args: {
          p_household_id: string;
          p_user_id: string;
          p_trash_type?: string;
        };
        Returns: {
          success: boolean;
          error?: string;
          event_id?: string;
          points?: number;
        };
      };
      rpc_admin_reassign_zone: {
        Args: {
          p_household_id: string;
          p_admin_id: string;
          p_user_id: string;
          p_zone_id: string;
          p_week_start?: string;
          p_reason?: string;
        };
        Returns: {
          success: boolean;
          error?: string;
        };
      };
    };
    Enums: {
      user_role: "admin" | "member";
      task_frequency: "daily" | "weekly" | "biweekly" | "monthly";
      task_status: "pending" | "completed";
      cleaning_zone_slug: "salon" | "bano" | "cocina";
      point_transaction_type: "cleaning" | "helping" | "trash" | "admin_adjustment";
    };
    CompositeTypes: Record<string, never>;
  };
}

