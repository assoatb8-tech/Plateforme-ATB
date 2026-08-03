import { apiRequest } from '@/services/apiClient'
import type { BureauMemberDto } from '@/features/bureau/types'

export async function fetchBureauMembers(): Promise<BureauMemberDto[]> {
  return apiRequest<BureauMemberDto[]>('/api/bureau', { requireAuth: false })
}
