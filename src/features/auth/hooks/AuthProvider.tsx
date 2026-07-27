import { useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/services/supabaseClient'
import { AuthContext, type AppUser } from '@/features/auth/hooks/AuthContext'
import type { Session } from '@supabase/supabase-js'

async function fetchAppUser(userId: string): Promise<AppUser | null> {
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

    async function syncUser(currentSession: Session | null) {
      if (!currentSession) {
        if (isMounted) {
          setUser(null)
          setLoading(false)
        }
        return
      }

      const appUser = await fetchAppUser(currentSession.user.id)
      if (!isMounted) return
      setUser(appUser)
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted) return
      setSession(initialSession)
      void syncUser(initialSession)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setLoading(true)
      void syncUser(newSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
