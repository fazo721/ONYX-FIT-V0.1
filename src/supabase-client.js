// ONYX FIT v0.1 — shared Supabase client
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || window.ONYX_SUPABASE?.url || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.ONYX_SUPABASE?.anonKey || '';

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
