import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * LeadBro runs against Supabase when credentials are present, and against the
 * seeded demo workspace when they are not. Nothing in the UI pretends a demo
 * record came from a provider — see the DEMO DATA badge in the top bar.
 */
export const isLive = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isLive
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

/** Only the anon key ever reaches the browser. Provider secrets stay server-side (§58). */
export const backendLabel = isLive ? 'Supabase' : 'Demo workspace';
