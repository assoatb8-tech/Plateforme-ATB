import { supabase } from '@/services/supabaseClient'
import type { MemberFormValues } from '@/features/member-form/validation'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export async function submitMemberProfile(values: MemberFormValues): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const response = await fetch('/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(values),
  })

  const body = (await response.json()) as ApiResponse<unknown>
  if (!response.ok || !body.success) {
    throw new Error(body.error ?? 'Failed to submit member profile')
  }
}
