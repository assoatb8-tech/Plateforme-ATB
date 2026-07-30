import { useEffect, useState, type ReactNode } from 'react'
import { getSupabaseClient } from '@/services/supabaseClient'
import { AuthContext, type AppUser } from '@/features/auth/hooks/AuthContext'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

async function fetchAppUser(supabase: SupabaseClient, userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, role, status')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as AppUser
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | undefined

    async function syncUser(supabase: SupabaseClient, currentSession: Session | null) {
      if (!currentSession) {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const appUser = await fetchAppUser(supabase, currentSession.user.id)
      if (!isMounted) return
      setUser(appUser)
      setLoading(false)
    }

    async function init() {
      const supabase = await getSupabaseClient()
      if (!isMounted) return

      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()
      if (!isMounted) return
      setSession(initialSession)
      void syncUser(supabase, initialSession)

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession)
        setLoading(true)
        void syncUser(supabase, newSession)
      })
      unsubscribe = () => subscription.unsubscribe()
    }

    void init()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  async function signOut() {
    const supabase = await getSupabaseClient()
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
