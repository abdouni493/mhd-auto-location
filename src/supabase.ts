import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

// Do not export from inside block scope. Create a top-level holder and
// assign a real client or a mock implementation depending on env vars.
let _supabase: any = null

if (!supabaseUrl || !supabaseAnonKey) {
  const missingMsg = 'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  console.error(missingMsg)

  const errorResult = { data: null, error: new Error(missingMsg) }

  const makeFrom = () => ({
    select: async () => errorResult,
    insert: async () => errorResult,
    update: async () => errorResult,
    delete: async () => errorResult,
    upsert: async () => errorResult,
    single: async () => errorResult,
    limit: () => ({ select: async () => errorResult, single: async () => errorResult }),
  })

  const mockSupabase: any = {
    from: (_table?: string) => makeFrom(),
    auth: {
      signIn: async () => ({ data: null, error: new Error(missingMsg) }),
      signUp: async () => ({ data: null, error: new Error(missingMsg) }),
      signOut: async () => ({ error: new Error(missingMsg) }),
    },
    storage: {
      from: () => ({ upload: async () => ({ data: null, error: new Error(missingMsg) }) })
    }
  }

  _supabase = mockSupabase
} else {
  _supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = _supabase

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