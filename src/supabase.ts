import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (you can generate these from your Supabase schema)
export type Database = {
  public: {
    Tables: {
      // track basic profile information linked to auth.users
      profiles: {
        Row: {
          id: string;
          username: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          username?: string;
          role?: string;
          created_at?: string;
        };
      };

      // simple view for counting administrators (used by login page logic)
      admin_count: {
        Row: {
          count: number;
        };
        Insert: {
          count: number;
        };
        Update: {
          count?: number;
        };
      };
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
  }
}