export interface Database {
  public: {
    Tables: {
      trips: {
        Row: {
          id: string
          name: string
          destination: string
          lat: number
          lng: number
          start_date: string
          end_date: string
          share_link: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['trips']['Insert']>
      }
      places: {
        Row: {
          id: string
          trip_id: string
          name: string
          address: string | null
          lat: number
          lng: number
          status: string
          tags: string[]
          memo: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['places']['Insert']>
      }
      routes: {
        Row: {
          id: string
          trip_id: string
          name: string
          place_ids: string[]
          is_main: boolean
          scheduled_date: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['routes']['Row'], 'id' | 'created_at'> & {
          id?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['routes']['Insert']>
      }
    }
  }
}
