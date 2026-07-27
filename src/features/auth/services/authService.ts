import { supabase } from '@/services/supabaseClient'
import { apiRequest } from '@/services/apiClient'
import type { Role, UserStatus } from '@/types/domain'

export interface CurrentUserDto {
  id: string
  email: string
  role: Role
  status: UserStatus
  hasProfile: boolean
}

export async function fetchCurrentUser(): Promise<CurrentUserDto> {
  return apiRequest<CurrentUserDto>('/api/auth/me')
}

export async function signUp(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reinitialiser-mot-de-passe`,
  })
  if (error) throw error
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
