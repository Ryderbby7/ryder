import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient<any>> | null = null;

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!_client) {
    _client = createClient<any>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return _client;
}

