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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      checklist: {
        Row: {
          content: string | null
          created_at: string
          ended_at: string | null
          id: string
          is_completed: boolean
          member_id: string | null
          started_at: string | null
          title: string
          trip_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          is_completed?: boolean
          member_id?: string | null
          started_at?: string | null
          title: string
          trip_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          is_completed?: boolean
          member_id?: string | null
          started_at?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          created_at: string
          date: string | null
          description: string | null
          id: string
          payments: Json
          place_id: string | null
          split_among: string[]
          total_amount: number
          trip_id: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          payments?: Json
          place_id?: string | null
          split_among?: string[]
          total_amount: number
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string | null
          description?: string | null
          id?: string
          payments?: Json
          place_id?: string | null
          split_among?: string[]
          total_amount?: number
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          created_at: string
          id: string
          place_id: string | null
          storage_path: string
          trip_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          place_id?: string | null
          storage_path: string
          trip_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          place_id?: string | null
          storage_path?: string
          trip_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          id: string
          lat: number
          lng: number
          memo: string | null
          name: string
          status: string
          tags: string[]
          trip_id: string
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          lat: number
          lng: number
          memo?: string | null
          name: string
          status?: string
          tags?: string[]
          trip_id: string
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          id?: string
          lat?: number
          lng?: number
          memo?: string | null
          name?: string
          status?: string
          tags?: string[]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          hidden_places: string[] | null
          id: string
          is_main: boolean
          name: string
          place_ids: string[]
          place_memos: Json
          scheduled_date: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          hidden_places?: string[] | null
          id?: string
          is_main?: boolean
          name: string
          place_ids?: string[]
          place_memos?: Json
          scheduled_date?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          hidden_places?: string[] | null
          id?: string
          is_main?: boolean
          name?: string
          place_ids?: string[]
          place_memos?: Json
          scheduled_date?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          created_at: string
          emoji: string
          id: string
          name: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          name: string
          trip_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          destination: string
          end_date: string
          id: string
          is_overseas: boolean
          lat: number
          lng: number
          name: string
          share_link: string
          start_date: string
        }
        Insert: {
          created_at?: string
          destination: string
          end_date: string
          id?: string
          is_overseas?: boolean
          lat: number
          lng: number
          name: string
          share_link?: string
          start_date: string
        }
        Update: {
          created_at?: string
          destination?: string
          end_date?: string
          id?: string
          is_overseas?: boolean
          lat?: number
          lng?: number
          name?: string
          share_link?: string
          start_date?: string
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
    Enums: {},
  },
} as const
