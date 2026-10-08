import { useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { AuthContext } from './authContext'

interface AdminCheck {
  userId: string
  isAdmin: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isSessionLoading, setIsSessionLoading] = useState(true)
  const [adminCheck, setAdminCheck] = useState<AdminCheck | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setIsSessionLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id ?? null

  // Keyed on the user id, so token refreshes don't re-run the check. Fails
  // closed: any RPC error counts as "not admin".
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!cancelled) setAdminCheck({ userId, isAdmin: !error && data === true })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const isAdmin = !!userId && adminCheck?.userId === userId && adminCheck.isAdmin
  const isLoading = isSessionLoading || (!!userId && adminCheck?.userId !== userId)

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, isAdmin, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
