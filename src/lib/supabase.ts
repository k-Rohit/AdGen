import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you'll need to generate these from your Supabase schema)
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          user_id: string
          title: string
          format: string
          tone: string
          template: string
          image_url: string | null
          generated_content: any | null
          status: 'pending' | 'completed' | 'failed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          format: string
          tone: string
          template: string
          image_url?: string | null
          generated_content?: any | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          format?: string
          tone?: string
          template?: string
          image_url?: string | null
          generated_content?: any | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
