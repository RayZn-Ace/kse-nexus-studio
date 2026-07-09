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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      automation_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      chatbot_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          budget_range: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          is_archived: boolean
          is_read: boolean
          message: string
          name: string
          services: string[] | null
          source: string | null
          subject: string | null
          timeline: string | null
        }
        Insert: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message: string
          name: string
          services?: string[] | null
          source?: string | null
          subject?: string | null
          timeline?: string | null
        }
        Update: {
          budget_range?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_archived?: boolean
          is_read?: boolean
          message?: string
          name?: string
          services?: string[] | null
          source?: string | null
          subject?: string | null
          timeline?: string | null
        }
        Relationships: []
      }
      kseadsio_ad_accounts: {
        Row: {
          access_token_encrypted: string | null
          ad_account_id: string
          business_id: string | null
          business_name: string | null
          created_at: string
          currency: string | null
          id: string
          label: string | null
          last_verified_at: string | null
          name: string | null
          timezone_name: string | null
          updated_at: string
          verification_error: string | null
          verification_status: string
        }
        Insert: {
          access_token_encrypted?: string | null
          ad_account_id: string
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          label?: string | null
          last_verified_at?: string | null
          name?: string | null
          timezone_name?: string | null
          updated_at?: string
          verification_error?: string | null
          verification_status?: string
        }
        Update: {
          access_token_encrypted?: string | null
          ad_account_id?: string
          business_id?: string | null
          business_name?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          label?: string | null
          last_verified_at?: string | null
          name?: string | null
          timezone_name?: string | null
          updated_at?: string
          verification_error?: string | null
          verification_status?: string
        }
        Relationships: []
      }
      kseadsio_campaign_snapshots: {
        Row: {
          created_at: string
          id: string
          meta_campaign_id: string
          snapshot_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          meta_campaign_id: string
          snapshot_json: Json
        }
        Update: {
          created_at?: string
          id?: string
          meta_campaign_id?: string
          snapshot_json?: Json
        }
        Relationships: []
      }
      kseadsio_commands: {
        Row: {
          approved_at: string | null
          created_at: string
          executed_at: string | null
          id: string
          parsed_json: Json | null
          raw_command: string
          requires_approval: boolean
          risk_level: string | null
          risk_notes: Json | null
          status: string
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          parsed_json?: Json | null
          raw_command: string
          requires_approval?: boolean
          risk_level?: string | null
          risk_notes?: Json | null
          status?: string
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          executed_at?: string | null
          id?: string
          parsed_json?: Json | null
          raw_command?: string
          requires_approval?: boolean
          risk_level?: string | null
          risk_notes?: Json | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      kseadsio_creative_checks: {
        Row: {
          command_id: string | null
          created_at: string
          creative_id: string | null
          id: string
          status: string | null
          text_content: string | null
          warnings: Json | null
        }
        Insert: {
          command_id?: string | null
          created_at?: string
          creative_id?: string | null
          id?: string
          status?: string | null
          text_content?: string | null
          warnings?: Json | null
        }
        Update: {
          command_id?: string | null
          created_at?: string
          creative_id?: string | null
          id?: string
          status?: string | null
          text_content?: string | null
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "kseadsio_creative_checks_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "kseadsio_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      kseadsio_execution_logs: {
        Row: {
          action_type: string
          command_id: string | null
          created_at: string
          error_message: string | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          action_type: string
          command_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Update: {
          action_type?: string
          command_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "kseadsio_execution_logs_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "kseadsio_commands"
            referencedColumns: ["id"]
          },
        ]
      }
      kseadsio_settings: {
        Row: {
          created_at: string
          default_age_max: number | null
          default_age_min: number | null
          default_daily_budget_eur: number | null
          default_landing_page: string | null
          default_pixel_id: string | null
          default_placements: Json | null
          extra_ad_account_ids: string[]
          extra_pixel_ids: string[]
          id: string
          is_system_user_token: boolean
          max_campaign_budget: number | null
          max_daily_budget_increase_percent: number | null
          meta_access_token_encrypted: string | null
          meta_ad_account_id: string | null
          meta_business_id: string | null
          ollama_api_url: string | null
          ollama_model: string | null
          safe_mode: boolean
          system_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_age_max?: number | null
          default_age_min?: number | null
          default_daily_budget_eur?: number | null
          default_landing_page?: string | null
          default_pixel_id?: string | null
          default_placements?: Json | null
          extra_ad_account_ids?: string[]
          extra_pixel_ids?: string[]
          id?: string
          is_system_user_token?: boolean
          max_campaign_budget?: number | null
          max_daily_budget_increase_percent?: number | null
          meta_access_token_encrypted?: string | null
          meta_ad_account_id?: string | null
          meta_business_id?: string | null
          ollama_api_url?: string | null
          ollama_model?: string | null
          safe_mode?: boolean
          system_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_age_max?: number | null
          default_age_min?: number | null
          default_daily_budget_eur?: number | null
          default_landing_page?: string | null
          default_pixel_id?: string | null
          default_placements?: Json | null
          extra_ad_account_ids?: string[]
          extra_pixel_ids?: string[]
          id?: string
          is_system_user_token?: boolean
          max_campaign_budget?: number | null
          max_daily_budget_increase_percent?: number | null
          meta_access_token_encrypted?: string | null
          meta_ad_account_id?: string | null
          meta_business_id?: string | null
          ollama_api_url?: string | null
          ollama_model?: string | null
          safe_mode?: boolean
          system_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          incoming_text: string | null
          outgoing_text: string | null
          post_id: string | null
          sender_id: string | null
          sender_username: string | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          incoming_text?: string | null
          outgoing_text?: string | null
          post_id?: string | null
          sender_id?: string | null
          sender_username?: string | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          incoming_text?: string | null
          outgoing_text?: string | null
          post_id?: string | null
          sender_id?: string | null
          sender_username?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      mission_config: {
        Row: {
          client_name: string | null
          contact: string | null
          created_at: string
          files: Json
          launch_date: string | null
          milestones: Json
          notes: string | null
          rated_at: string | null
          rating: number | null
          rating_comment: string | null
          scope: string | null
          token: string
          updated_at: string
          updates: Json
        }
        Insert: {
          client_name?: string | null
          contact?: string | null
          created_at?: string
          files?: Json
          launch_date?: string | null
          milestones?: Json
          notes?: string | null
          rated_at?: string | null
          rating?: number | null
          rating_comment?: string | null
          scope?: string | null
          token: string
          updated_at?: string
          updates?: Json
        }
        Update: {
          client_name?: string | null
          contact?: string | null
          created_at?: string
          files?: Json
          launch_date?: string | null
          milestones?: Json
          notes?: string | null
          rated_at?: string | null
          rating?: number | null
          rating_comment?: string | null
          scope?: string | null
          token?: string
          updated_at?: string
          updates?: Json
        }
        Relationships: []
      }
      portal_messages: {
        Row: {
          body: string
          created_at: string
          delivered_at: string | null
          from_role: string
          id: string
          read_at: string | null
          token: string
        }
        Insert: {
          body: string
          created_at?: string
          delivered_at?: string | null
          from_role: string
          id?: string
          read_at?: string | null
          token: string
        }
        Update: {
          body?: string
          created_at?: string
          delivered_at?: string | null
          from_role?: string
          id?: string
          read_at?: string | null
          token?: string
        }
        Relationships: []
      }
      posts_log: {
        Row: {
          caption: string | null
          created_at: string
          error_message: string | null
          id: string
          ig_media_id: string | null
          image_prompt: string | null
          image_url: string | null
          status: string
          triggered_by: string
          type: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_media_id?: string | null
          image_prompt?: string | null
          image_url?: string | null
          status: string
          triggered_by?: string
          type: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          ig_media_id?: string | null
          image_prompt?: string | null
          image_url?: string | null
          status?: string
          triggered_by?: string
          type?: string
          video_url?: string | null
        }
        Relationships: []
      }
      tutorial_shares: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          token: string
          tutorial_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          token: string
          tutorial_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          token?: string
          tutorial_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_shares_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          id: string
          thumbnail_path: string | null
          title: string
          video_path: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          thumbnail_path?: string | null
          title: string
          video_path: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          id?: string
          thumbnail_path?: string | null
          title?: string
          video_path?: string
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
      visitor_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          path: string | null
          referrer: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          path?: string | null
          referrer?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
