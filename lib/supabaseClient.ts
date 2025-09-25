// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!url || !key) {
  console.warn("Supabase URL/Key not set. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(url, key);
