export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      candles: {
        Row: {
          created_at: string
          id: string
          lighter_name: string | null
          message: string | null
          obituary_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lighter_name?: string | null
          message?: string | null
          obituary_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lighter_name?: string | null
          message?: string | null
          obituary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "candles_obituary_id_fkey"
            columns: ["obituary_id"]
            isOneToOne: false
            referencedRelation: "obituaries"
            referencedColumns: ["id"]
          },
        ]
      }
      condolences: {
        Row: {
          author_email: string | null
          author_name: string
          created_at: string
          id: string
          is_approved: boolean
          message: string
          obituary_id: string
        }
        Insert: {
          author_email?: string | null
          author_name: string
          created_at?: string
          id?: string
          is_approved?: boolean
          message: string
          obituary_id: string
        }
        Update: {
          author_email?: string | null
          author_name?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          message?: string
          obituary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condolences_obituary_id_fkey"
            columns: ["obituary_id"]
            isOneToOne: false
            referencedRelation: "obituaries"
            referencedColumns: ["id"]
          },
        ]
      }
      obituaries: {
        Row: {
          birth_date: string | null
          birth_location: string | null
          created_at: string
          death_date: string
          death_location: string | null
          funeral_date: string | null
          funeral_location: string | null
          funeral_time: string | null
          id: string
          location: string | null
          mourners: string | null
          name: string
          photo_url: string | null
          publication_date: string | null
          source: string | null
          text: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          birth_date?: string | null
          birth_location?: string | null
          created_at?: string
          death_date: string
          death_location?: string | null
          funeral_date?: string | null
          funeral_location?: string | null
          funeral_time?: string | null
          id?: string
          location?: string | null
          mourners?: string | null
          name: string
          photo_url?: string | null
          publication_date?: string | null
          source?: string | null
          text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          birth_date?: string | null
          birth_location?: string | null
          created_at?: string
          death_date?: string
          death_location?: string | null
          funeral_date?: string | null
          funeral_location?: string | null
          funeral_time?: string | null
          id?: string
          location?: string | null
          mourners?: string | null
          name?: string
          photo_url?: string | null
          publication_date?: string | null
          source?: string | null
          text?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_hash: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_hash: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_hash?: string
        }
        Relationships: []
      }
      scraper_settings: {
        Row: {
          created_at: string
          cron_interval: string
          id: string
          is_active: boolean
          last_run_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cron_interval?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cron_interval?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      search_agent_filter_groups: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          logic_operator: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          logic_operator?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          logic_operator?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_agent_filter_groups_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "search_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      search_agent_filters: {
        Row: {
          agent_id: string
          created_at: string
          filter_type: string
          filter_value: string
          id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          filter_type: string
          filter_value: string
          id?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          filter_type?: string
          filter_value?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_agent_filters_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "search_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      search_agents: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_action: string; p_ip_hash: string; p_max_requests?: number }
        Returns: boolean
      }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      find_duplicate_obituaries: {
        Args: never
        Returns: {
          id: string
        }[]
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          jobid: number
          jobname: string
          schedule: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      schedule_scrape_job: {
        Args: {
          anon_key: string
          cron_expression: string
          function_url: string
        }
        Returns: undefined
      }
      unschedule_scrape_job: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
