import { apiRequest } from '@/services/apiClient'
import type { BureauMemberDto } from '@/features/bureau/types'

export interface CreateBureauMemberInput {
  userId: string
  positionFr: string
  positionAr: string
  facebookUrl: string
}

export async function createBureauMember(input: CreateBureauMemberInput): Promise<BureauMemberDto> {
  return apiRequest<BureauMemberDto>('/api/bureau', { method: 'POST', body: input })
}

export async function deleteBureauMember(id: string): Promise<void> {
  await apiRequest('/api/bureau', { method: 'DELETE', query: { id } })
}
