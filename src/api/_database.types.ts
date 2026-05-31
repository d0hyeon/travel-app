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
          currency: string | null
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
          currency?: string | null
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
          currency?: string | null
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
            referencedRelation: "trip_places"
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
      memos: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          trip_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          trip_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memos_trip_id_fkey"
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
          is_public: boolean
          place_id: string | null
          storage_path: string
          trip_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          place_id?: string | null
          storage_path: string
          trip_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          place_id?: string | null
          storage_path?: string
          trip_id?: string
          url?: string
          user_id?: string
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
          created_at: string
          external_id: string
          id: string
          lat: number
          lng: number
          name: string
          provider: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          external_id?: string
          id?: string
          lat: number
          lng: number
          name: string
          provider?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          external_id?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          provider?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_locations: {
        Row: {
          display_order: number
          place_id: string
          post_id: string
        }
        Insert: {
          display_order: number
          place_id: string
          post_id: string
        }
        Update: {
          display_order?: number
          place_id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_locations_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_locations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_photos: {
        Row: {
          display_order: number
          is_public: boolean
          place_id: string | null
          post_id: string
          storage_path: string
          url: string
        }
        Insert: {
          display_order: number
          is_public?: boolean
          place_id?: string | null
          post_id: string
          storage_path: string
          url: string
        }
        Update: {
          display_order?: number
          is_public?: boolean
          place_id?: string | null
          post_id?: string
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_photos_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          author_id: string
          created_at: string
          description: string | null
          id: string
          title: string | null
          trip_id: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          author_id: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          trip_id?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          author_id?: string
          created_at?: string
          description?: string | null
          id?: string
          title?: string | null
          trip_id?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "posts_trip_id_fkey"
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
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
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
      trip_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_places: {
        Row: {
          category: string | null
          created_at: string
          id: string
          memo: string | null
          place_id: string
          status: string
          tags: string[]
          trip_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          memo?: string | null
          place_id: string
          status?: string
          tags?: string[]
          trip_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          memo?: string | null
          place_id?: string
          status?: string
          tags?: string[]
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_places_trip_id_fkey"
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
          destinations: Json
          end_date: string
          exchange_rate: number | null
          exchange_rates: Json | null
          id: string
          is_overseas: boolean
          lat: number
          lng: number
          name: string
          share_link: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          destination: string
          destinations: Json
          end_date: string
          exchange_rate?: number | null
          exchange_rates?: Json | null
          id?: string
          is_overseas?: boolean
          lat: number
          lng: number
          name: string
          share_link?: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          destination?: string
          destinations?: Json
          end_date?: string
          exchange_rate?: number | null
          exchange_rates?: Json | null
          id?: string
          is_overseas?: boolean
          lat?: number
          lng?: number
          name?: string
          share_link?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          name?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_trip: { Args: { trip_id: string }; Returns: boolean }
      can_view_post: {
        Args: {
          post_author: string
          post_trip: string
          post_visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Returns: boolean
      }
      get_explored_places: {
        Args: { since_date?: string }
        Returns: {
          address: string
          categories: Json
          destinations: Json
          lat: number
          lng: number
          name: string
          place_id: string
          thumbnail_url: string
          total_trips: number
          visitor_count: number
        }[]
      }
      get_most_saved_places: {
        Args: never
        Returns: {
          address: string
          categories: Json
          destinations: Json
          lat: number
          lng: number
          name: string
          place_id: string
          save_count: number
          thumbnail_url: string
          total_trips: number
        }[]
      }
      get_my_trips: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          destination: string
          destinations: Json
          end_date: string
          exchange_rate: number | null
          exchange_rates: Json | null
          id: string
          is_overseas: boolean
          lat: number
          lng: number
          name: string
          share_link: string
          start_date: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trips"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_routes_with_places_by_trip_id: {
        Args: { p_trip_id: string }
        Returns: {
          place_address: string
          place_id: string
          place_lat: number
          place_lng: number
          place_name: string
          place_order: number
          route_id: string
          route_name: string
          scheduled_date: string
        }[]
      }
      get_trip_by_share_link: {
        Args: { link: string }
        Returns: {
          created_at: string
          destination: string
          destinations: Json
          end_date: string
          exchange_rate: number | null
          exchange_rates: Json | null
          id: string
          is_overseas: boolean
          lat: number
          lng: number
          name: string
          share_link: string
          start_date: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trips"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_trips_by_destination: {
        Args: { p_destinations: string[]; p_exclude_trip_id: string }
        Returns: {
          destinations: Json
          end_date: string
          id: string
          member_count: number
          preview_coordinates: Json
          route_count: number
          start_date: string
        }[]
      }
      get_user_trips: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          destination: string
          destinations: Json
          end_date: string
          exchange_rate: number | null
          exchange_rates: Json | null
          id: string
          is_overseas: boolean
          lat: number
          lng: number
          name: string
          share_link: string
          start_date: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "trips"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      post_visibility: "PRIVATE" | "MEMBERS" | "PUBLIC"
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
      post_visibility: ["PRIVATE", "MEMBERS", "PUBLIC"],
    },
  },
} as const
