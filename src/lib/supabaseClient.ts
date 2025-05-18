import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase'; // Ensure this path is correct and supabase.ts exists

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
