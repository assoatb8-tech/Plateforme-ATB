import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Role, UserStatus } from '@/types/domain'

export interface AppUser {
  id: string
  email: string
  role: Role
  status: UserStatus
}

export interface AuthContextValue {
  session: Session | null
  user: AppUser | null
  loading: boolean
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
