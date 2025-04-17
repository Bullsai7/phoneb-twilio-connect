export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      call_history: {
        Row: {
          contact_name: string | null
          direction: string
          duration: string | null
          id: string
          phone_number: string
          status: string
          timestamp: string
          twilio_account_sid: string | null
          twilio_call_sid: string | null
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          direction: string
          duration?: string | null
          id?: string
          phone_number: string
          status: string
          timestamp?: string
          twilio_account_sid?: string | null
          twilio_call_sid?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string | null
          direction?: string
          duration?: string | null
          id?: string
          phone_number?: string
          status?: string
          timestamp?: string
          twilio_account_sid?: string | null
          twilio_call_sid?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          contact_type: string | null
          created_at: string
          email: string | null
          favorite: boolean
          id: string
          last_contacted: string | null
          name: string | null
          notes: string | null
          phone_number: string
          user_id: string
        }
        Insert: {
          company?: string | null
          contact_type?: string | null
          created_at?: string
          email?: string | null
          favorite?: boolean
          id?: string
          last_contacted?: string | null
          name?: string | null
          notes?: string | null
          phone_number: string
          user_id: string
        }
        Update: {
          company?: string | null
          contact_type?: string | null
          created_at?: string
          email?: string | null
          favorite?: boolean
          id?: string
          last_contacted?: string | null
          name?: string | null
          notes?: string | null
          phone_number?: string
          user_id?: string
        }
        Relationships: []
      }
      message_history: {
        Row: {
          contact_name: string | null
          content: string
          direction: string
          id: string
          phone_number: string
          timestamp: string
          twilio_account_sid: string | null
          twilio_message_sid: string | null
          user_id: string
        }
        Insert: {
          contact_name?: string | null
          content: string
          direction: string
          id?: string
          phone_number: string
          timestamp?: string
          twilio_account_sid?: string | null
          twilio_message_sid?: string | null
          user_id: string
        }
        Update: {
          contact_name?: string | null
          content?: string
          direction?: string
          id?: string
          phone_number?: string
          timestamp?: string
          twilio_account_sid?: string | null
          twilio_message_sid?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          twilio_account_sid: string | null
          twilio_app_sid: string | null
          twilio_auth_token: string | null
          twilio_phone_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          twilio_account_sid?: string | null
          twilio_app_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          twilio_account_sid?: string | null
          twilio_app_sid?: string | null
          twilio_auth_token?: string | null
          twilio_phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      twilio_accounts: {
        Row: {
          account_name: string
          account_sid: string
          app_sid: string | null
          auth_token: string
          created_at: string
          id: string
          is_default: boolean
          phone_number: string | null
          user_id: string
        }
        Insert: {
          account_name: string
          account_sid: string
          app_sid?: string | null
          auth_token: string
          created_at?: string
          id?: string
          is_default?: boolean
          phone_number?: string | null
          user_id: string
        }
        Update: {
          account_name?: string
          account_sid?: string
          app_sid?: string | null
          auth_token?: string
          created_at?: string
          id?: string
          is_default?: boolean
          phone_number?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
