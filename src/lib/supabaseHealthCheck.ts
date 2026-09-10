import { supabaseAnonKey, supabaseUrl } from '@/lib/supabaseClient'

/**
 * Lightweight connectivity check that doesn't depend on any content tables
 * (none exist yet — see Phase 4). `auth.getSession()` can resolve locally
 * without a network call, so instead this hits GoTrue's `/health` endpoint
 * directly — a real round trip that 401s on a missing/invalid anon key and
 * fails outright on a bad URL, so it validates both.
 */
export async function pingSupabase(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
    })
    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status} ${response.statusText}` }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
