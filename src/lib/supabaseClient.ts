import { createClient } from '@supabase/supabase-js'
import { parseSupabaseEnv } from '@/lib/env'

// Throws at import time on a missing/invalid URL or key, and on a secret/service-role key,
// which would otherwise be published in the browser bundle.
const { url: supabaseUrl, anonKey: supabaseAnonKey } = parseSupabaseEnv(import.meta.env)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export { supabaseUrl, supabaseAnonKey }
