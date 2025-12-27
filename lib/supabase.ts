import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase] Missing credentials. Supabase features will not work.');
}

// Standard client for client-side use
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

// Admin client for server-side secret operations (Webhook/Cron)
export const supabaseAdmin = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);
