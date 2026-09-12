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
    };
    Enums: {
      user_role: "admin" | "member";
      task_frequency: "daily" | "weekly" | "biweekly" | "monthly";
      task_status: "pending" | "completed";
    };
    CompositeTypes: Record<string, never>;
  };
}
